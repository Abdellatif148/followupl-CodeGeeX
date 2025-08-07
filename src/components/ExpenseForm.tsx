import React, { useState, useEffect } from 'react'
import { DollarSign, Calendar, FileText, User, Loader2, CheckCircle, AlertCircle, Tag } from 'lucide-react'
import { expensesApi, clientsApi } from '../lib/database'
import { supabase } from '../lib/supabase'
import type { Client } from '../types/database'
import { useBusinessAnalytics } from '../hooks/useAnalytics'
import { sanitizeInput, validateAmount, validateDate } from '../utils/validators'
import { handleApiError } from '../utils/errorHandling'

interface ExpenseFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  editingExpense?: any
}

export default function ExpenseForm({ onSuccess, onCancel, editingExpense }: ExpenseFormProps) {
  const { trackBusinessAction } = useBusinessAnalytics()
  const [clients, setClients] = useState<Client[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    currency: 'USD',
    category: '',
    subcategory: '',
    expense_date: '',
    payment_method: '',
    tax_deductible: false,
    status: 'pending',
    client_id: '',
    tags: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [formWarnings, setFormWarnings] = useState<string[]>([])
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const categories = [
    'Software & Tools',
    'Hardware & Equipment',
    'Marketing & Advertising',
    'Travel & Transportation',
    'Office Supplies',
    'Professional Services',
    'Education & Training',
    'Internet & Phone',
    'Other'
  ]

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }
  ]

  useEffect(() => {
    loadClients()
    
    if (editingExpense) {
      const expenseDate = new Date(editingExpense.expense_date)
      setFormData({
        title: editingExpense.title || '',
        description: editingExpense.description || '',
        amount: editingExpense.amount?.toString() || '',
        currency: editingExpense.currency || 'USD',
        category: editingExpense.category || '',
        subcategory: editingExpense.subcategory || '',
        expense_date: expenseDate.toISOString().split('T')[0],
        payment_method: editingExpense.payment_method || '',
        tax_deductible: editingExpense.tax_deductible || false,
        status: editingExpense.status || 'pending',
        client_id: editingExpense.client_id || '',
        tags: editingExpense.tags?.join(', ') || ''
      })
    }
  }, [editingExpense])

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
    const { name, value, type } = e.target
    
    // Clear errors when user starts typing
    if (formErrors.length > 0) {
      setFormErrors([])
    }
    if (formWarnings.length > 0) {
      setFormWarnings([])
    }
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: ['title', 'description', 'subcategory', 'payment_method'].includes(name) ? sanitizeInput(value) : value
      }))
    }
  }

  const validateForm = () => {
    const errors: string[] = []
    const warnings: string[] = []
    
    if (!formData.title.trim()) {
      errors.push('Expense title is required')
    } else if (formData.title.length > 200) {
      errors.push('Title must be less than 200 characters')
    }
    
    if (!formData.amount || !validateAmount(formData.amount)) {
      errors.push('Please enter a valid amount')
    } else {
      const amount = parseFloat(formData.amount)
      if (amount > 10000) {
        warnings.push('Large expense amount - please verify')
      }
    }
    
    if (!formData.category) {
      errors.push('Please select a category')
    } else if (!categories.includes(formData.category)) {
      errors.push('Invalid category selected')
    }
    
    if (!formData.expense_date || !validateDate(formData.expense_date)) {
      errors.push('Please enter a valid expense date')
    } else {
      const expenseDate = new Date(formData.expense_date)
      const today = new Date()
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(today.getFullYear() - 1)
      
      if (expenseDate > today) {
        warnings.push('Expense date is in the future')
      }
      if (expenseDate < oneYearAgo) {
        warnings.push('Expense date is more than a year old')
      }
    }
    
    setFormErrors(errors)
    setFormWarnings(warnings)
    
    return errors.length === 0
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

      // Process tags
      const tagsArray = formData.tags
        .split(',')
        .map(tag => sanitizeInput(tag.trim()))
        .filter(tag => tag.length > 0)
        .slice(0, 10) // Limit to 10 tags

      const expenseData = {
        user_id: user.id,
        client_id: formData.client_id || null,
        title: sanitizeInput(formData.title.trim()),
        description: formData.description.trim() ? sanitizeInput(formData.description.trim()) : null,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        category: formData.category,
        subcategory: formData.subcategory.trim() ? sanitizeInput(formData.subcategory.trim()) : null,
        expense_date: new Date(formData.expense_date).toISOString(),
        payment_method: formData.payment_method.trim() ? sanitizeInput(formData.payment_method.trim()) : null,
        tax_deductible: formData.tax_deductible,
        status: formData.status as 'pending' | 'approved' | 'reimbursed' | 'reconciled',
        tags: tagsArray.length > 0 ? tagsArray : null
      }

      if (editingExpense) {
        await expensesApi.update(editingExpense.id, expenseData)
        
        // Track expense update
        trackBusinessAction('update', 'expense', {
          amount: expenseData.amount,
          currency: expenseData.currency,
          category: expenseData.category,
          tax_deductible: expenseData.tax_deductible
        })
        
        setNotification({
          type: 'success',
          message: 'Expense updated successfully!'
        })
      } else {
        await expensesApi.create(expenseData)
        
        // Track expense creation
        trackBusinessAction('create', 'expense', {
          amount: expenseData.amount,
          currency: expenseData.currency,
          category: expenseData.category,
          tax_deductible: expenseData.tax_deductible
        })
        
        setNotification({
          type: 'success',
          message: 'Expense created successfully!'
        })
      }

      // Clear form if creating new
      if (!editingExpense) {
        setFormData({
          title: '',
          description: '',
          amount: '',
          currency: 'USD',
          category: '',
          subcategory: '',
          expense_date: '',
          payment_method: '',
          tax_deductible: false,
          status: 'pending',
          client_id: '',
          tags: ''
        })
        setFormErrors([])
        setFormWarnings([])
      }

      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.()
      }, 1500)

    } catch (error) {
      console.error('Error saving expense:', error)
      const appError = handleApiError(error, 'expense save')
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
          {editingExpense ? 'Edit Expense' : 'Add New Expense'}
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
      
      {/* Form Errors */}
      {formErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                Please fix the following errors:
              </h4>
              <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
                {formErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Form Warnings */}
      {formWarnings.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                Warnings:
              </h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                {formWarnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Expense Title *
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
                placeholder="Software subscription, office supplies, etc."
                disabled={isSubmitting}
                maxLength={200}
              />
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              disabled={isSubmitting}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
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
            placeholder="Add details about this expense..."
            disabled={isSubmitting}
            maxLength={1000}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                max="999999999.99"
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

          <div>
            <label htmlFor="expense_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="date"
                id="expense_date"
                name="expense_date"
                value={formData.expense_date}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subcategory
            </label>
            <input
              type="text"
              id="subcategory"
              name="subcategory"
              value={formData.subcategory}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              placeholder="e.g., Adobe Creative Suite, Office rent"
              disabled={isSubmitting}
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Method
            </label>
            <input
              type="text"
              id="payment_method"
              name="payment_method"
              value={formData.payment_method}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              placeholder="Credit card, cash, bank transfer"
              disabled={isSubmitting}
              maxLength={100}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Related Client (Optional)
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
                <option value="">No client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.company && `(${client.company})`}
                  </option>
                ))}
              </select>
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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="reimbursed">Reimbursed</option>
              <option value="reconciled">Reconciled</option>
            </select>
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
              placeholder="business, tax-deductible, recurring (comma separated)"
              disabled={isSubmitting}
              maxLength={500}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Separate multiple tags with commas (max 10 tags)
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="tax_deductible"
            name="tax_deductible"
            checked={formData.tax_deductible}
            onChange={handleInputChange}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            disabled={isSubmitting}
          />
          <label htmlFor="tax_deductible" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Tax deductible expense
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || formErrors.length > 0}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                {editingExpense ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              editingExpense ? 'Update Expense' : 'Add Expense'
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