import React, { useState, useEffect, useRef } from 'react'
import { 
  Plus, Search, Filter, Edit, Trash2, Undo, 
  Mail, Phone, ExternalLink, Tag, Calendar, DollarSign,
  CheckCircle, XCircle, AlertTriangle, ToggleLeft, ToggleRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import ClientForm from '../components/ClientForm'
import { clientsApi } from '../lib/database'
import { supabase } from '../lib/supabase'
import { useCurrency } from '../hooks/useCurrency'
import { useBusinessAnalytics } from '../hooks/useAnalytics'
import type { Client } from '../types/database'

export default function Clients() {
  const { trackClientAction } = useBusinessAnalytics()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'archived'>('all')
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [user, setUser] = useState<any>(null)
  const { formatCurrency } = useCurrency()
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
    undoAction?: () => void
  } | null>(null)
  const [deletedClient, setDeletedClient] = useState<Client | null>(null)
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadClients()
  }, [])

  // Auto-hide toast after 6 seconds for delete actions with undo, 3 seconds for others
  useEffect(() => {
    if (toast) {
      const duration = toast.undoAction ? 6000 : 3000
      const timer = setTimeout(() => {
        setToast(null)
        // If this was a delete toast that timed out, clear the deletedClient state
        if (toast.undoAction && deletedClient) {
          setDeletedClient(null)
        }
      }, duration)
      
      undoTimerRef.current = timer
      return () => {
        if (undoTimerRef.current) {
          clearTimeout(undoTimerRef.current)
          undoTimerRef.current = null
        }
      }
    }
  }, [toast, deletedClient])

  const loadClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const clientsData = await clientsApi.getAll(user.id)
        setClients(clientsData)
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client => {
    const query = searchQuery.toLowerCase()
    const matchesSearch = 
      client.name.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query) ||
      client.company?.toLowerCase().includes(query) ||
      client.notes?.toLowerCase().includes(query) ||
      client.tags?.some(tag => tag.toLowerCase().includes(query))
    
    const matchesFilter = filterStatus === 'all' || client.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setShowEditForm(true)
    
    // Track edit action
    trackClientAction('edit_initiated', {
      client_id: client.id,
      has_company: !!client.company,
      tags_count: client.tags?.length || 0
    })
  }

  const handleDeleteClient = async (client: Client) => {
    try {
      // Store client data before deleting
      setDeletedClient({...client})
      
      // Delete the client
      await clientsApi.delete(client.id)
      
      // Track deletion action
      trackClientAction('delete', {
        client_id: client.id,
        had_platform_profile: !!client.platform_profile,
        tags_count: client.tags?.length || 0
      })
      
      // Update UI immediately
      setClients(prevClients => prevClients.filter(c => c.id !== client.id))
      
      // Show toast with undo option
      setToast({
        type: 'success',
        message: `Client "${client.name}" deleted`,
        undoAction: handleUndoDelete
      })
      
    } catch (error) {
      console.error('Error deleting client:', error)
      setToast({
        type: 'error',
        message: 'Failed to delete client. Please try again.'
      })
      // Clear backup if deletion failed
      setDeletedClient(null)
    }
  }
  
  // Function to handle undo delete action
  const handleUndoDelete = async () => {
    // Cancel the timer
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
      undoTimerRef.current = null
    }
    
    if (!deletedClient) return
    
    try {
      // Re-create the client from our backup
      await clientsApi.create({
        ...deletedClient,
        id: deletedClient.id // Ensure ID is preserved
      })
      
      // Reload clients to show the restored client
      await loadClients()
      
      // Show success message
      setToast({
        type: 'success',
        message: `Client "${deletedClient.name}" restored`
      })
      
      // Clear the backup
      setDeletedClient(null)
      
    } catch (error) {
      console.error('Error restoring client:', error)
      setToast({
        type: 'error',
        message: 'Failed to restore client. Please try again.'
      })
    }
  }

  const handleToggleStatus = async (client: Client) => {
    const newStatus = client.status === 'active' ? 'inactive' : 'active'
    
    try {
      await clientsApi.update(client.id, { status: newStatus })
      
      // Track status change
      trackClientAction('status_change', {
        client_id: client.id,
        old_status: client.status,
        new_status: newStatus
      })
      
      // Show success toast
      setToast({
        type: 'success',
        message: `Client marked as ${newStatus} 🔁`
      })
      
      loadClients()
    } catch (error) {
      console.error('Error updating client status:', error)
      setToast({
        type: 'error',
        message: 'Failed to update client status'
      })
    }
  }

  const handleFormSuccess = () => {
    setShowEditForm(false)
    setEditingClient(null)
    setToast({
      type: 'success',
      message: 'Client updated successfully ✅'
    })
    loadClients()
  }

  const handleFormCancel = () => {
    setShowEditForm(false)
    setEditingClient(null)
  }
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'fiverr': return '🟢'
      case 'upwork': return '🔵'
      case 'direct': return '💼'
      default: return '🌐'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (showEditForm) {
    return (
      <Layout>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Client</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Update client information and details
            </p>
          </div>
          <ClientForm 
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
            editingClient={editingClient}
          />
        </div>
      </Layout>
    )
  }
  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clients</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your client relationships and track project history
            </p>
          </div>
          <Link
            to="/clients/add"
            className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Client
          </Link>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg border transition-all duration-300 ${
            toast.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
              : toast.type === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
                {toast.type === 'error' && <XCircle className="w-5 h-5" />}
                {toast.type === 'info' && <AlertTriangle className="w-5 h-5" />}
                <span className="font-medium">{toast.message}</span>
              </div>
              
              {toast.undoAction && (
                <button 
                  onClick={toast.undoAction}
                  className="ml-4 flex items-center gap-1 bg-white dark:bg-gray-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  <Undo className="w-4 h-4" />
                  Undo
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Clients</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{clients.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 text-2xl">👥</span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Clients</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {clients.filter(c => c.status === 'active').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 text-2xl">✅</span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-yellow-50 dark:from-gray-800 dark:to-yellow-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Earned</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(clients.reduce((sum, c) => sum + c.total_earned, 0))}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Clients List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {filteredClients.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {searchQuery || filterStatus !== 'all' ? 'No clients found' : 'No clients yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Add your first client to start tracking your freelance relationships and never miss a follow-up again'
                }
              </p>
              {!searchQuery && filterStatus === 'all' && (
                <Link
                  to="/clients/add"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Client
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredClients.map((client) => (
                <div key={client.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-200 dark:border-gray-600">
                          <span className="text-sm">{getPlatformIcon(client.platform)}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {client.name}
                          </h3>
                          {client.company && (
                            <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              at {client.company}
                            </span>
                          )}
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            client.status === 'active' 
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                              : client.status === 'inactive'
                              ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                          }`}>
                            {client.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                          {client.email && (
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4" />
                              <span className="truncate max-w-48">{client.email}</span>
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>Last contact: {formatDate(client.last_contact)}</span>
                          </div>
                        </div>
                        {client.tags && client.tags.length > 0 && (
                          <div className="flex items-center space-x-2 mt-3">
                            <Tag className="w-4 h-4 text-gray-400" />
                            <div className="flex flex-wrap gap-2">
                              {client.tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg"
                                >
                                  {tag}
                                </span>
                              ))}
                              {client.tags.length > 3 && (
                                <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg">
                                  +{client.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(client.total_earned)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {client.total_projects} {client.total_projects === 1 ? 'project' : 'projects'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Edit Icon */}
                        <button
                          onClick={() => handleEditClient(client)}
                          className="group relative p-3 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-110"
                        >
                          <Edit className="w-5 h-5" />
                        </button>

                        {/* Status Toggle Icon */}
                        <button
                          onClick={() => handleToggleStatus(client)}
                          className={`group relative p-3 rounded-lg transition-all duration-200 hover:scale-110 ${
                            client.status === 'active'
                              ? 'text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                              : 'text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                        >
                          {client.status === 'active' ? (
                            <ToggleRight className="w-5 h-5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>
                        {/* Delete Icon */}
                        <button
                          onClick={() => handleDeleteClient(client)}
                          className="group relative p-3 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 hover:scale-110"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {client.notes && (
                    <div className="mt-4 pl-18">
                      <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border-l-4 border-blue-500">
                        {client.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}