import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, User, Building, Mail, Phone, Tag } from 'lucide-react'
import Layout from '../components/Layout'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import ClientForm from '../components/ClientForm'
import LoadingSpinner from '../components/LoadingSpinner'
import { clientsApi } from '../lib/database'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import { useAnalytics } from '../hooks/useAnalytics'
import { formatDate } from '../utils/dateHelpers'
import { handleApiError } from '../utils/errorHandling'
import { debounce } from '../utils/performance'

interface Client {
  id: string
  user_id: string
  name: string
  email?: string
  phone?: string
  company?: string
  platform: 'fiverr' | 'upwork' | 'direct' | 'other'
  status: 'active' | 'inactive' | 'archived'
  notes?: string
  tags?: string[]
  last_contact?: string
  created_at: string
  updated_at: string
}

export default function Clients() {
  const { trackBusinessAction } = useAnalytics()
  const { success, error } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingClient, setDeletingClient] = useState<string | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    loadClients()
  }, [])

  // Debounced search to improve performance
  const debouncedSearch = debounce(() => {
    setSearchLoading(true)
    filterClients()
    setSearchLoading(false)
  }, 300)
  
  useEffect(() => {
    debouncedSearch()
  }, [clients, searchTerm, statusFilter, platformFilter])

  const loadClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const clientsData = await clientsApi.getAll(user.id)
        setClients(clientsData)
      }
    } catch (err) {
      console.error('Error loading clients:', err)
      const appError = handleApiError(err, 'clients loading')
      error(appError.message)
    } finally {
      setLoading(false)
    }
  }

  const filterClients = () => {
    let filtered = clients

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === statusFilter)
    }

    // Filter by platform
    if (platformFilter !== 'all') {
      filtered = filtered.filter(client => client.platform === platformFilter)
    }

    setFilteredClients(filtered)
  }

  const handleCreateClient = () => {
    trackBusinessAction('start_create', 'client')
    setEditingClient(null)
    setShowForm(true)
  }

  const handleEditClient = (client: Client) => {
    trackBusinessAction('start_edit', 'client', { client_id: client.id })
    setEditingClient(client)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingClient(null)
    loadClients()
    success(editingClient ? 'Client updated successfully!' : 'Client added successfully!')
  }

  const handleFormCancel = () => {
    trackBusinessAction('cancel_form', 'client')
    setShowForm(false)
    setEditingClient(null)
  }

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) return

    setDeletingClient(clientId)
    try {
      await clientsApi.delete(clientId)
      
      // Track client deletion
      trackBusinessAction('delete', 'client', { client_id: clientId })
      
      loadClients()
      success('Client deleted successfully!')
    } catch (err) {
      console.error('Error deleting client:', err)
      const appError = handleApiError(err, 'client deletion')
      error(appError.message)
    } finally {
      setDeletingClient(null)
    }
  }
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    
    if (value.length > 0) {
      trackBusinessAction('search', 'client', { query_length: value.length })
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'fiverr': return '🟢'
      case 'upwork': return '🔵'
      case 'direct': return '💼'
      default: return '🌐'
    }
  }

  const totalClients = filteredClients.length
  const activeClients = filteredClients.filter(client => client.status === 'active').length

  if (showForm) {
    return (
      <Layout>
        <div className="p-6">
          <ClientForm
            editingClient={editingClient}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clients</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your client relationships and track project history
            </p>
          </div>
          <button
            onClick={handleCreateClient}
            className="mt-4 sm:mt-0 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors duration-200 flex items-center font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
            aria-label="Add new client"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Client
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">Total Clients</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                  {totalClients}
                </p>
              </div>
              <User className="w-10 h-10 text-blue-500 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-400 mb-1">Active Clients</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                  {activeClients}
                </p>
              </div>
              <User className="w-10 h-10 text-green-500 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                maxLength={100}
              />
            </div>
            <div className="flex gap-4">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                  aria-label="Filter by status"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="relative">
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                  aria-label="Filter by platform"
                >
                  <option value="all">All Platforms</option>
                  <option value="fiverr">Fiverr</option>
                  <option value="upwork">Upwork</option>
                  <option value="direct">Direct</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Clients List */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <LoadingSpinner text="Loading clients..." size="lg" />
          </div>
        ) : filteredClients.length === 0 ? (
          <EmptyState
            icon={User}
            title={clients.length === 0 ? "No clients yet" : "No clients found"}
            description={
              clients.length === 0
                ? "Add your first client to start tracking your freelance relationships and never miss a follow-up again"
                : "Try adjusting your search or filter criteria"
            }
            action={
              clients.length === 0
                ? {
                    label: "Add Your First Client",
                    onClick: handleCreateClient
                  }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg mr-3">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {client.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <span className="mr-2">{getPlatformIcon(client.platform)}</span>
                        <span className="capitalize">{client.platform}</span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={client.status} type="client" />
                </div>

                {client.company && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <Building className="w-4 h-4 mr-2" />
                    {client.company}
                  </div>
                )}

                {client.email && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <Mail className="w-4 h-4 mr-2" />
                    <a 
                      href={`mailto:${client.email}`}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                      onClick={() => trackBusinessAction('contact', 'client', { method: 'email', client_id: client.id })}
                    >
                      {client.email}
                    </a>
                  </div>
                )}

                {client.phone && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <Phone className="w-4 h-4 mr-2" />
                    <a 
                      href={`tel:${client.phone}`}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                      onClick={() => trackBusinessAction('contact', 'client', { method: 'phone', client_id: client.id })}
                    >
                      {client.phone}
                    </a>
                  </div>
                )}

                {client.tags && client.tags.length > 0 && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <Tag className="w-4 h-4 mr-2" />
                    <div className="flex flex-wrap gap-1">
                      {client.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {client.tags.length > 3 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{client.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Added {formatDate(client.created_at)}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {client.last_contact ? `Last contact ${formatDate(client.last_contact)}` : 'No recent contact'}
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleEditClient(client)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                      title="Edit client"
                      aria-label={`Edit ${client.name}`}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      disabled={deletingClient === client.id}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 transition-colors duration-200"
                      title="Delete client"
                      aria-label={`Delete ${client.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}