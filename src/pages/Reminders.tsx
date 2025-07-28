import React, { useState, useEffect } from 'react'
import { 
  Plus, Search, Filter, Clock, CheckCircle, AlertTriangle,
  Calendar, User, MessageSquare, MoreVertical, Edit, Trash2, Bell
} from 'lucide-react'
import Layout from '../components/Layout'
import ReminderForm from '../components/ReminderForm'
import Table from '../components/Table'
import { remindersApi, clientsApi } from '../lib/database'
import { useAuth } from '../hooks/useAuth'
import { handleSupabaseError, showErrorToast, showSuccessToast } from '../utils/errorHandler'
import { formatDueDate } from '../utils/dateHelpers'

export default function Reminders() {
  const { user } = useAuth()
  const [reminders, setReminders] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'done'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingReminder, setEditingReminder] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) {
      setLoading(false)
      return
    }
    
    try {
      const [remindersData, clientsData] = await Promise.all([
        remindersApi.getAll(user.id),
        clientsApi.getAll(user.id)
      ])
      setReminders(remindersData)
      setClients(clientsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredReminders = reminders.filter(reminder => {
    const matchesSearch = reminder.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reminder.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reminder.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reminder.clients?.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || reminder.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
      case 'completed': 
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'active':
      case 'pending': 
        return <Clock className="w-5 h-5 text-yellow-500" />
      default: 
        return <AlertTriangle className="w-5 h-5 text-gray-500" />
    }
  }

  const toggleStatus = async (reminderId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'done' : 'active'
      await remindersApi.update(reminderId, { status: newStatus })
      showSuccessToast(`Reminder ${newStatus === 'done' ? 'completed' : 'reactivated'}`)
      loadData()
    } catch (error) {
      console.error('Error updating reminder status:', error)
      const appError = handleSupabaseError(error)
      showErrorToast(appError.message)
    }
  }

  const deleteReminder = async (reminderId: string) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      try {
        await remindersApi.delete(reminderId)
        showSuccessToast('Reminder deleted successfully')
        loadData()
      } catch (error) {
        console.error('Error deleting reminder:', error)
        const appError = handleSupabaseError(error)
        showErrorToast(appError.message)
      }
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingReminder(null)
    loadData()
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingReminder(null)
  }

  const columns = [
    {
      key: 'status',
      label: 'Status',
      render: (value: string, row: any) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(value)}
          <span className={`capitalize text-sm ${
            value === 'done' || value === 'completed' 
              ? 'text-green-600 dark:text-green-400'
              : 'text-yellow-600 dark:text-yellow-400'
          }`}>
            {value}
          </span>
        </div>
      )
    },
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (value: string, row: any) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          {(row.description || row.message) && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {row.description || row.message}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'client',
      label: 'Client',
      render: (value: any, row: any) => (
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-gray-400" />
          <span>{row.clients?.name || 'No client'}</span>
        </div>
      )
    },
    {
      key: 'due_date',
      label: 'Due Date',
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{formatDueDate(value || row.datetime)}</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: any) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => toggleStatus(row.id, row.status)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors duration-200 ${
              row.status === 'active' || row.status === 'pending'
                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/40'
                : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/40'
            }`}
          >
            {row.status === 'active' || row.status === 'pending' ? 'Mark Done' : 'Reactivate'}
          </button>
          <button
            onClick={() => {
              setEditingReminder(row)
              setShowForm(true)
            }}
            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteReminder(row.id)}
            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  if (showForm) {
    return (
      <Layout>
        <div className="p-6 max-w-4xl mx-auto">
          <ReminderForm 
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
            editingReminder={editingReminder}
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reminders</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Stay on top of follow-ups and never miss an opportunity
            </p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Reminder
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search reminders..."
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
            <option value="done">Done</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reminders</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{reminders.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-yellow-50 dark:from-gray-800 dark:to-yellow-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {reminders.filter(r => r.status === 'active' || r.status === 'pending').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {reminders.filter(r => r.status === 'done' || r.status === 'completed').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Reminders Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {filteredReminders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Bell className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {searchQuery || filterStatus !== 'all' ? 'No reminders found' : 'No reminders yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first reminder to stay on top of follow-ups and never miss an opportunity'
                }
              </p>
              {!searchQuery && filterStatus === 'all' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Reminder
                </button>
              )}
            </div>
          ) : (
            <Table
              columns={columns}
              data={filteredReminders}
              loading={loading}
              emptyMessage="No reminders found matching your filters"
            />
          )}
        </div>
      </div>
    </Layout>
  )
}