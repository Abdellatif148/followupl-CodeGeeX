import React, { useState, useEffect } from 'react'
import { Calendar, Clock, FileText, User, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { remindersApi, clientsApi } from '../lib/database'
import { supabase } from '../lib/supabase'
import type { Client } from '../types/database'
import { useBusinessAnalytics } from '../hooks/useAnalytics'

interface ReminderFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  editingReminder?: any
}

export default function ReminderForm({ onSuccess, onCancel, editingReminder }: ReminderFormProps) {
  const { trackReminderAction } = useBusinessAnalytics()
  const [clients, setClients] = useState<Client[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '',
    date: '',
    time: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    loadClients()
    
    if (editingReminder) {
      const reminderDate = new Date(editingReminder.due_date || editingReminder.datetime)
      setFormData({
        title: editingReminder.title || '',
        description: editingReminder.description || editingReminder.message || '',
        client_id: editingReminder.client_id || '',
        date: reminderDate.toISOString().split('T')[0],
        time: reminderDate.toTimeString().slice(0, 5)
      })
    }
  }, [editingReminder])

  const loadClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const clientsData = await clientsApi.getAll(user.id)
        setClients(clientsData)
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      setNotification({
        type: 'error',
        message: 'Reminder title is required'
      })
      return false
    }

    if (!formData.date) {
      setNotification({
        type: 'error',
        message: 'Date is required'
      })
      return false
    }

    if (!formData.time) {
      setNotification({
        type: 'error',
        message: 'Time is required'
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    setNotification(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Combine date and time
      const datetime = new Date(`${formData.date}T${formData.time}`)

      const reminderData = {
        user_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        message: formData.description.trim() || null,
        client_id: formData.client_id || null,
        due_date: datetime.toISOString(),
        datetime: datetime.toISOString(),
        status: 'active' as const,
        reminder_type: 'custom' as const,
        priority: 'medium' as const
      }

      if (editingReminder) {
        await remindersApi.update(editingReminder.id, reminderData)
        
        // Track reminder update
        trackReminderAction('update', {
          has_client: !!reminderData.client_id,
          reminder_type: reminderData.reminder_type,
          priority: reminderData.priority
        })
        
        setNotification({
          type: 'success',
          message: 'Reminder updated successfully!'
        })
      } else {
        await remindersApi.create(reminderData)
        
        // Track reminder creation
        trackReminderAction('create', {
          has_client: !!reminderData.client_id,
          reminder_type: reminderData.reminder_type,
          priority: reminderData.priority
        })
        
        setNotification({
          type: 'success',
          message: 'Reminder created successfully!'
        })
      }

      // Clear form if creating new
      if (!editingReminder) {
        setFormData({
          title: '',
          description: '',
          client_id: '',
          date: '',
          time: ''
        })
      }

      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.()
      }, 1500)

    } catch (error) {
      console.error('Error saving reminder:', error)
      setNotification({
        type: 'error',
        message: 'Failed to save reminder. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {editingReminder ? 'Edit Reminder' : 'Create New Reminder'}
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
          >
            ✕
          </button>
        )}
      </div>

      {notification && (
        <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
          notification.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-sm ${
            notification.type === 'success' 
              ? 'text-green-700 dark:text-green-300'
              : 'text-red-700 dark:text-red-300'
          }`}>
            {notification.message}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title *
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              placeholder="Follow up with client about project"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
            placeholder="Add details about this reminder..."
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Related Client
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <select
              id="client_id"
              name="client_id"
              value={formData.client_id}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              disabled={isSubmitting}
            >
              <option value="">Select a client (optional)</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} {client.company && `(${client.company})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                {editingReminder ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              editingReminder ? 'Update Reminder' : 'Create Reminder'
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}