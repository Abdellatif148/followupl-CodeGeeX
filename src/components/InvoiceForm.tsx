import React, { useState, useEffect } from 'react'
import { DollarSign, Calendar, FileText, User, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { invoicesApi, clientsApi } from '../lib/database'
import { useAuth } from '../hooks/useAuth'
import type { Client } from '../types/database'
import { handleSupabaseError, showErrorToast, showSuccessToast } from '../utils/errorHandler'

interface InvoiceFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  editingInvoice?: any
}

export default function InvoiceForm({ onSuccess, onCancel, editingInvoice }: InvoiceFormProps) {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [formData, setFormData] = useState({
    client_id: '',
    project: '',
    amount: '',
    currency: 'USD',
    due_date: '',
    status: 'unpaid'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    loadClients()
    
    if (editingInvoice) {
      setFormData({
        client_id: editingInvoice.client_id || '',
        project: editingInvoice.project || editingInvoice.title || '',
        amount: editingInvoice.amount?.toString() || '',
        currency: editingInvoice.currency || 'USD',
        due_date: editingInvoice.due_date ? editingInvoice.due_date.split('T')[0] : '',
        status: editingInvoice.status || 'unpaid'
      })
    }
  }, [editingInvoice])

  const loadClients = async () => {
    if (!user) return
    
    try {
      const clientsData = await clientsApi.getAll(user.id)
      setClients(clientsData)
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
    if (!formData.client_id) {
      setNotification({
        type: 'error',
        message: 'Please select a client'
      })
      return false
    }

    if (!formData.project.trim()) {
      setNotification({
        type: 'error',
        message: 'Project description is required'
      })
      return false
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setNotification({
        type: 'error',
        message: 'Please enter a valid amount'
      })
      return false
    }

    if (!formData.due_date) {
      setNotification({
        type: 'error',
        message: 'Due date is required'
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

      const invoiceData = {
        user_id: user.id,
        client_id: formData.client_id,
        project: formData.project.trim(),
        title: formData.project.trim(),
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        due_date: new Date(formData.due_date).toISOString(),
        status: formData.status as 'paid' | 'unpaid'
      }

      if (editingInvoice) {
        await invoicesApi.update(editingInvoice.id, invoiceData)
        showSuccessToast('Invoice updated successfully!')
      } else {
        await invoicesApi.create(invoiceData)
        showSuccessToast('Invoice created successfully!')
      }

      // Clear form if creating new
      if (!editingInvoice) {
        setFormData({
          client_id: '',
          project: '',
          amount: '',
          currency: 'USD',
          due_date: '',
          status: 'unpaid'
        })
      }

      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.()
      }, 1500)

    } catch (error) {
      console.error('Error saving invoice:', error)
      const appError = handleSupabaseError(error)
      showErrorToast(appError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
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
          <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Client *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <select
              id="client_id"
              name="client_id"
              value={formData.client_id}
              onChange={handleInputChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              disabled={isSubmitting}
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} {client.company && `(${client.company})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="project" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Project Description *
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <textarea
              id="project"
              name="project"
              value={formData.project}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              placeholder="Website development, logo design, etc."
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Currency
            </label>
            <select
              id="currency"
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              disabled={isSubmitting}
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} ({currency.symbol}) - {currency.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Due Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={formData.due_date}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
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
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              disabled={isSubmitting}
            >
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
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
                {editingInvoice ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              editingInvoice ? 'Update Invoice' : 'Create Invoice'
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