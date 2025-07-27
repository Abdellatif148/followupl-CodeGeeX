import React, { useState, useEffect } from 'react'
import { User, Mail, Phone, Building, FileText, Tag, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { clientsApi } from '../lib/database'
import { useAuth } from '../hooks/useAuth'
import { useBusinessAnalytics } from '../hooks/useAnalytics'
import { handleSupabaseError } from '../utils/errorHandler'
import type { Client } from '../types/database'

interface ClientFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  editingClient?: Client | null
}

export default function ClientForm({ onSuccess, onCancel, editingClient }: ClientFormProps) {
  const { trackClientAction } = useBusinessAnalytics()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    project: '',
    tags: '',
    status: 'active'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    if (editingClient) {
      setFormData({
        name: editingClient.name || '',
        email: editingClient.email || '',
        phone: editingClient.phone || '',
        company: editingClient.company || '',
        project: editingClient.notes || '',
        tags: editingClient.tags?.join(', ') || '',
        status: editingClient.status || 'active'
      })
    }
  }, [editingClient])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setNotification({
        type: 'error',
        message: 'Client name is required'
      })
      return false
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setNotification({
        type: 'error',
        message: 'Please enter a valid email address'
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
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Process tags
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const clientData = {
        user_id: user.id,
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        company: formData.company.trim() || null,
        notes: formData.project.trim() || null,
        tags: tagsArray,
        platform: 'direct' as const,
        status: formData.status as 'active' | 'inactive' | 'archived'
      }

      if (editingClient) {
        // Update existing client
        await clientsApi.update(editingClient.id, clientData)
        
        // Track client update
        trackClientAction('update', {
          client_id: editingClient.id,
          platform: clientData.platform,
          has_email: !!clientData.email,
          has_phone: !!clientData.phone,
          tags_count: tagsArray.length,
          status: clientData.status
        })
        
        // Don't show notification here - parent will handle it
      } else {
        // Create new client
        await clientsApi.create(clientData)

        // Track client creation
        trackClientAction('create', {
          platform: clientData.platform,
          has_email: !!clientData.email,
          has_phone: !!clientData.phone,
          tags_count: tagsArray.length
        })

        setNotification({
          type: 'success',
          message: 'Client added successfully!'
        })

        // Clear form for new clients
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          project: '',
          tags: '',
          status: 'active'
        })
      }

      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.()
      }, editingClient ? 100 : 1500) // Immediate for edits, delay for new clients

    } catch (error) {
      console.error('Error saving client:', error)
      const appError = handleSupabaseError(error)
      setNotification({
        type: 'error',
        message: appError.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {editingClient ? 'Edit Client' : 'Add New Client'}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Client Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                placeholder="Enter client name"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleSelectChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              disabled={isSubmitting}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                placeholder="client@example.com"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                placeholder="+1 (555) 123-4567"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Name
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                placeholder="Company Inc."
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="project" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {editingClient ? 'Notes' : 'Project Title'}
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <textarea
              id="project"
              name="project"
              value={formData.project}
              onChange={handleInputChange}
              rows={3}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              placeholder={editingClient ? "Add notes about this client..." : "Describe the project or add notes..."}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags
          </label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              placeholder="high-paying, recurring, urgent (comma separated)"
              disabled={isSubmitting}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Separate multiple tags with commas
          </p>
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
                {editingClient ? 'Updating Client...' : 'Adding Client...'}
              </>
            ) : (
              editingClient ? 'Update Client' : 'Add Client'
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