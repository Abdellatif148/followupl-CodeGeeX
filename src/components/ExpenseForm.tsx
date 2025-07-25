import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { expensesApi, clientsApi } from '../lib/database'
import { supabase } from '../lib/supabase'
import { useCurrency } from '../hooks/useCurrency'
import { Expense, Client } from '../types/database'

interface ExpenseFormProps {
  expenseId?: string
  onSuccess: () => void
  onCancel?: () => void
}

export default function ExpenseForm({ expenseId, onSuccess, onCancel }: ExpenseFormProps) {
  const { t } = useTranslation()
  const { formatCurrency, getAvailableCurrencies } = useCurrency()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: 0,
    currency: 'USD',
    category: '',
    subcategory: '',
    expense_date: new Date().toISOString().split('T')[0],
    client_id: null as string | null,
    payment_method: '',
    tax_deductible: false,
    status: 'pending',
    tags: [] as string[]
  })

  // Standard expense categories
  const categories = [
    { value: 'office_supplies', label: t('expenses.categories.officeSupplies', 'Office Supplies') },
    { value: 'travel', label: t('expenses.categories.travel', 'Travel') },
    { value: 'meals', label: t('expenses.categories.meals', 'Meals & Entertainment') },
    { value: 'software', label: t('expenses.categories.software', 'Software & Subscriptions') },
    { value: 'hardware', label: t('expenses.categories.hardware', 'Hardware & Equipment') },
    { value: 'marketing', label: t('expenses.categories.marketing', 'Marketing & Advertising') },
    { value: 'professional_services', label: t('expenses.categories.professionalServices', 'Professional Services') },
    { value: 'rent', label: t('expenses.categories.rent', 'Rent & Utilities') },
    { value: 'fees', label: t('expenses.categories.fees', 'Fees & Licenses') },
    { value: 'other', label: t('expenses.categories.other', 'Other') }
  ]

  // Payment methods
  const paymentMethods = [
    { value: 'credit_card', label: t('expenses.paymentMethods.creditCard', 'Credit Card') },
    { value: 'debit_card', label: t('expenses.paymentMethods.debitCard', 'Debit Card') },
    { value: 'cash', label: t('expenses.paymentMethods.cash', 'Cash') },
    { value: 'bank_transfer', label: t('expenses.paymentMethods.bankTransfer', 'Bank Transfer') },
    { value: 'paypal', label: t('expenses.paymentMethods.paypal', 'PayPal') },
    { value: 'other', label: t('expenses.paymentMethods.other', 'Other') }
  ]

  // Status options
  const statusOptions = [
    { value: 'pending', label: t('expenses.status.pending', 'Pending') },
    { value: 'approved', label: t('expenses.status.approved', 'Approved') },
    { value: 'reimbursed', label: t('expenses.status.reimbursed', 'Reimbursed') },
    { value: 'reconciled', label: t('expenses.status.reconciled', 'Reconciled') }
  ]

  // Load clients and expense data if editing
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Get user
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Load clients
          const clientsData = await clientsApi.getAll(user.id)
          setClients(clientsData)
          
          // Load expense if editing
          if (expenseId) {
            const expenseData = await expensesApi.getById(expenseId)
            setFormData({
              ...expenseData,
              expense_date: new Date(expenseData.expense_date).toISOString().split('T')[0],
              tags: expenseData.tags || []
            })
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [expenseId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else if (name === 'amount') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsString = e.target.value
    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(Boolean)
    setFormData(prev => ({
      ...prev,
      tags: tagsArray
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      
      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const expenseData = {
          ...formData,
          user_id: user.id,
          amount: parseFloat(formData.amount.toString()),
          client_id: formData.client_id || null
        }
        
        if (expenseId) {
          await expensesApi.update(expenseId, expenseData)
        } else {
          await expensesApi.create(expenseData)
        }
        
        onSuccess()
      }
    } catch (error) {
      console.error('Error saving expense:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && expenseId) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('expenses.form.title', 'Title')}*
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        {/* Amount and Currency */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('expenses.form.amount', 'Amount')}*
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="w-1/3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('expenses.form.currency', 'Currency')}
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {getAvailableCurrencies().map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} ({currency.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('expenses.form.category', 'Category')}*
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">{t('expenses.form.selectCategory', 'Select a category')}</option>
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Subcategory */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('expenses.form.subcategory', 'Subcategory')}
          </label>
          <input
            type="text"
            name="subcategory"
            value={formData.subcategory || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('expenses.form.date', 'Date')}*
          </label>
          <input
            type="date"
            name="expense_date"
            value={formData.expense_date}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        {/* Client */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('expenses.form.client', 'Client')}
          </label>
          <select
            name="client_id"
            value={formData.client_id || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">{t('expenses.form.noClient', 'No client')}</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('expenses.form.paymentMethod', 'Payment Method')}
          </label>
          <select
            name="payment_method"
            value={formData.payment_method || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">{t('expenses.form.selectPaymentMethod', 'Select payment method')}</option>
            {paymentMethods.map(method => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('expenses.form.status', 'Status')}
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {statusOptions.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('expenses.form.tags', 'Tags')} <span className="text-xs text-gray-500">{t('expenses.form.tagsHint', '(comma separated)')}</span>
          </label>
          <input
            type="text"
            name="tags"
            value={formData.tags.join(', ')}
            onChange={handleTagsChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder={t('expenses.form.tagsPlaceholder', 'e.g. project1, tax2025, client-reimbursable')}
          />
        </div>
        
        {/* Tax Deductible */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="tax_deductible"
            name="tax_deductible"
            checked={formData.tax_deductible}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="tax_deductible" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            {t('expenses.form.taxDeductible', 'Tax Deductible')}
          </label>
        </div>
      </div>
      
      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('expenses.form.description', 'Description')}
        </label>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
      
      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            {t('common.cancel', 'Cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
        >
          {loading ? t('common.saving', 'Saving...') : (expenseId ? t('common.update', 'Update') : t('common.save', 'Save'))}
        </button>
      </div>
    </form>
  )
}