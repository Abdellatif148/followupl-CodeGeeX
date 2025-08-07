/**
 * Secure Client Form with enhanced validation and protection
 */

import React, { useState, useEffect } from 'react'
import { User, Mail, Phone, Building, FileText, Tag, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { clientsApi } from '../lib/secureDatabase'
import { supabase } from '../lib/supabase'
import { useBusinessAnalytics } from '../hooks/useAnalytics'
import { secureValidators } from '../utils/secureValidators'
import SecureInput from './SecureInput'
import RateLimitWrapper from './RateLimitWrapper'
import type { Client } from '../types/database'

interface SecureClientFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  editingClient?: Client | null
}

export default function SecureClientForm({ onSuccess, onCancel, editingClient }: SecureClientFormProps) {
  const { trackClientAction } = useBusinessAnalytics()
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
  const [validationResult, setValidationResult] = useState<any>(null)
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

  const handleInputChange = (field: string) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear previous validation when user types
    if (validationResult) {
      setValidationResult(null)
    }
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form data
    const validation = secureValidators.validateClientForm({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      notes: formData.project,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      status: formData.status,
      platform: 'direct'
    })

    setValidationResult(validation)

    if (!validation.isValid) {
      setNotification({
        type: 'error',
        message: validation.errors[0]
      })
      return
    }

    setIsSubmitting(true)
    setNotification(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const clientData = {
        user_id: user.id,
        ...validation.sanitizedValue,
        platform: 'direct' as const
      }

      if (editingClient) {
        // Update existing client
        await clientsApi.update(editingClient.id, clientData, user.id)
        
        // Track client update
        trackClientAction('update', {
          client_id: editingClient.id,
          platform: clientData.platform,
          has_email: !!clientData.email,
          has_phone: !!clientData.phone,
          tags_count: clientData.tags?.length || 0,
          status: clientData.status
        })
      } else {
        // Create new client
        await clientsApi.create(clientData)

        // Track client creation
        trackClientAction('create', {
          platform: clientData.platform,
          has_email: !!clientData.email,
          has_phone: !!clientData.phone,
          tags_count: clientData.tags?.length || 0
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

      setNotification({
        type: 'success',
        message: `Client ${editingClient ? 'updated' : 'added'} successfully!`
      })

      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.()
      }, editingClient ? 100 : 1500)

    } catch (error) {
      console.error('Error saving client:', error)
      setNotification({
        type: 'error',
        message: `Failed to ${editingClient ? 'update' : 'add'} client. Please try again.`
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <RateLimitWrapper
      action="client_form_submit"
      limit={10}
      windowMs={60000}
      onLimitExceeded={() => {
        setNotification({
          type: 'error',
          message: 'Too many form submissions. Please wait a moment before trying again.'
        })
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editingClient ? 'Edit Client' : 'Add New Client'}
          </h2>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              aria-label="Close form"
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
                <SecureInput
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  placeholder="Enter client name"
                  required
                  validation="text"
                  maxLength={100}
                  minLength={1}
                  disabled={isSubmitting}
                  className="pl-10"
                  autoComplete="name"
                  aria-label="Client name"
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
                aria-label="Client status"
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
                <SecureInput
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  placeholder="client@example.com"
                  validation="email"
                  disabled={isSubmitting}
                  className="pl-10"
                  autoComplete="email"
                  aria-label="Client email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <SecureInput
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  placeholder="+1 (555) 123-4567"
                  validation="phone"
                  disabled={isSubmitting}
                  className="pl-10"
                  autoComplete="tel"
                  aria-label="Client phone number"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Name
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <SecureInput
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange('company')}
                placeholder="Company Inc."
                validation="text"
                maxLength={100}
                disabled={isSubmitting}
                className="pl-10"
                autoComplete="organization"
                aria-label="Company name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="project" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {editingClient ? 'Notes' : 'Project Title'}
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <SecureInput
                type="textarea"
                name="project"
                value={formData.project}
                onChange={handleInputChange('project')}
                placeholder={editingClient ? "Add notes about this client..." : "Describe the project or add notes..."}
                validation="text"
                maxLength={1000}
                disabled={isSubmitting}
                className="pl-10"
                aria-label={editingClient ? "Client notes" : "Project description"}
              />
            </div>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <SecureInput
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange('tags')}
                placeholder="high-paying, recurring, urgent (comma separated)"
                validation="text"
                maxLength={500}
                disabled={isSubmitting}
                className="pl-10"
                aria-label="Client tags"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Separate multiple tags with commas (max 10 tags)
            </p>
          </div>

          {/* Validation warnings */}
          {validationResult && validationResult.warnings.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                    Warnings:
                  </h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                    {validationResult.warnings.map((warning: string, index: number) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center font-medium"
              aria-label={editingClient ? 'Update client' : 'Add client'}
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
                aria-label="Cancel"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </RateLimitWrapper>
  )
}