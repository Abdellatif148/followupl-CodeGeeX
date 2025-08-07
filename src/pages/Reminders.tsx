import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Clock, User, CheckCircle, AlertTriangle, Calendar } from 'lucide-react'
import Layout from '../components/Layout'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import ReminderForm from '../components/ReminderForm'
import LoadingSpinner from '../components/LoadingSpinner'
import { remindersApi } from '../lib/database'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import { formatDate, formatRelativeDate, isOverdue, getDaysUntil } from '../utils/dateHelpers'
import { useBusinessAnalytics } from '../hooks/useAnalytics'

interface ReminderWithClient {
  id: string
  user_id: string
  client_id?: string
  title: string
  description?: string
  message?: string
  due_date: string
  datetime?: string
  status: 'active' | 'completed' | 'cancelled' | 'pending'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  reminder_type: 'follow_up' | 'payment' | 'project_deadline' | 'custom'
  completed_at?: string
  created_at: string
  updated_at: string
  clients?: {
    id: string
    name: string
    platform: string
  } | null
}

export default function Reminders() {
  const { trackReminderAction } = useBusinessAnalytics()
  const { success, error } = useToast()
  const [reminders, setReminders] = useState<ReminderWithClient[]>([])
  const [filteredReminders, setFilteredReminders] = useState<ReminderWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingReminder, setEditingReminder] = useState<ReminderWithClient | null>(null)
  const [deletingReminder, setDeletingReminder] = useState<string | null>(null)

  useEffect(() => {
    loadReminders()
    // Request notification permission
    remindersApi.requestBrowserNotificationPermission()
  }, [])

  useEffect(() => {
    filterReminders()
  }, [reminders, searchTerm, statusFilter, priorityFilter])

  const loadReminders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const remindersData = await remindersApi.getAll(user.id)
        setReminders(remindersData)
      }
    } catch (err) {
      console.error('Error loading reminders:', err)
      error('Failed to load reminders')
    } finally {
      setLoading(false)
    }
  }

  const filterReminders = () => {
    let filtered = reminders

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(reminder =>
        reminder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reminder.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reminder.clients?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(reminder => reminder.status === statusFilter)
    }

    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(reminder => reminder.priority === priorityFilter)
    }

    // Sort by due date
    filtered.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

    setFilteredReminders(filtered)
  }

  const handleCreateReminder = () => {
    setEditingReminder(null)
    setShowForm(true)
  }

  const handleEditReminder = (reminder: ReminderWithClient) => {
    setEditingReminder(reminder)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingReminder(null)
    loadReminders()
    success(editingReminder ? 'Reminder updated successfully!' : 'Reminder created successfully!')
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingReminder(null)
  }

  const handleMarkCompleted = async (reminder: ReminderWithClient) => {
    try {
      await remindersApi.markCompleted(reminder.id)
      
      // Track reminder completion
      trackReminderAction('complete', {
        reminder_type: reminder.reminder_type,
        priority: reminder.priority
      })
      
      loadReminders()
      success('Reminder marked as completed!')
    } catch (err) {
      console.error('Error marking reminder as completed:', err)
      error('Failed to mark reminder as completed')
    }
  }

  const handleReactivate = async (reminder: ReminderWithClient) => {
    try {
      await remindersApi.update(reminder.id, { status: 'active' })
      
      // Track reminder reactivation
      trackReminderAction('reactivate', {
        reminder_type: reminder.reminder_type,
        priority: reminder.priority
      })
      
      loadReminders()
      success('Reminder reactivated!')
    } catch (err) {
      console.error('Error reactivating reminder:', err)
      error('Failed to reactivate reminder')
    }
  }

  const handleDeleteReminder = async (reminderId: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return

    setDeletingReminder(reminderId)
    try {
      await remindersApi.delete(reminderId)
      
      // Track reminder deletion
      trackReminderAction('delete', {})
      
      loadReminders()
      success('Reminder deleted successfully!')
    } catch (err) {
      console.error('Error deleting reminder:', err)
      error('Failed to delete reminder')
    } finally {
      setDeletingReminder(null)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 dark:text-red-400'
      case 'high': return 'text-orange-600 dark:text-orange-400'
      case 'medium': return 'text-yellow-600 dark:text-yellow-400'
      case 'low': return 'text-green-600 dark:text-green-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="w-4 h-4" />
      case 'high': return <AlertTriangle className="w-4 h-4" />
      case 'medium': return <Clock className="w-4 h-4" />
      case 'low': return <Clock className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const totalReminders = filteredReminders.length
  const activeReminders = filteredReminders.filter(reminder => reminder.status === 'active').length
  const overdueReminders = filteredReminders.filter(reminder => 
    reminder.status === 'active' && isOverdue(reminder.due_date)
  ).length

  if (showForm) {
    return (
      <Layout>
        <div className="p-6">
          <ReminderForm
            editingReminder={editingReminder}
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reminders</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Stay on top of follow-ups and never miss an opportunity
            </p>
          </div>
          <button
            onClick={handleCreateReminder}
            className="mt-4 sm:mt-0 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors duration-200 flex items-center font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Reminder
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">Total Reminders</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                  {totalReminders}
                </p>
              </div>
              <Clock className="w-10 h-10 text-blue-500 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-400 mb-1">Active Reminders</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                  {activeReminders}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 dark:text-red-400 mb-1">Overdue</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-300">
                  {overdueReminders}
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-500 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search reminders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="flex gap-4">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="relative">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Reminders List */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <LoadingSpinner text="Loading reminders..." />
          </div>
        ) : filteredReminders.length === 0 ? (
          <EmptyState
            icon={Clock}
            title={reminders.length === 0 ? "No reminders yet" : "No reminders found"}
            description={
              reminders.length === 0
                ? "Create your first reminder to stay on top of follow-ups and never miss an opportunity"
                : "Try adjusting your search or filter criteria"
            }
            action={
              reminders.length === 0
                ? {
                    label: "Create Your First Reminder",
                    onClick: handleCreateReminder
                  }
                : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredReminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all duration-200 p-6 hover:shadow-lg ${
                  reminder.status === 'active' && isOverdue(reminder.due_date)
                    ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className={`mr-3 ${getPriorityColor(reminder.priority)}`}>
                        {getPriorityIcon(reminder.priority)}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {reminder.title}
                      </h3>
                      <StatusBadge status={reminder.status} type="reminder" size="sm" />
                    </div>

                    {reminder.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {reminder.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span className={isOverdue(reminder.due_date) && reminder.status === 'active' ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                          {formatDate(reminder.due_date)}
                          {reminder.status === 'active' && (
                            <span className="ml-2">
                              ({getDaysUntil(reminder.due_date) < 0 ? 'Overdue' : formatRelativeDate(reminder.due_date)})
                            </span>
                          )}
                        </span>
                      </div>

                      {reminder.clients && (
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          <span>{reminder.clients.name}</span>
                        </div>
                      )}

                      <div className="flex items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPriorityColor(reminder.priority)} bg-current bg-opacity-10`}>
                          {reminder.priority}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <span className="px-2 py-1 rounded-full text-xs font-medium capitalize bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {reminder.reminder_type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {reminder.status === 'active' ? (
                      <button
                        onClick={() => handleMarkCompleted(reminder)}
                        className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors duration-200"
                        title="Mark as completed"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    ) : reminder.status === 'completed' ? (
                      <button
                        onClick={() => handleReactivate(reminder)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                        title="Reactivate reminder"
                      >
                        <Clock className="w-5 h-5" />
                      </button>
                    ) : null}
                    
                    <button
                      onClick={() => handleEditReminder(reminder)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                      title="Edit reminder"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteReminder(reminder.id)}
                      disabled={deletingReminder === reminder.id}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 transition-colors duration-200"
                      title="Delete reminder"
                    >
                      <Trash2 className="w-5 h-5" />
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