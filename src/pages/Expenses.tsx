import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Plus, Filter, Download, ChevronDown, ChevronUp,
  Edit, Trash2, DollarSign, Calendar, Tag, User, Search,
  BarChart2
} from 'lucide-react'
import Layout from '../components/Layout'
import { expensesApi } from '../lib/expensesApi'
import { supabase } from '../lib/supabase'
import { useCurrency } from '../hooks/useCurrency'
import { Expense } from '../types/database'

export default function Expenses() {
  const { t } = useTranslation()
  const { formatCurrency } = useCurrency()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [sortField, setSortField] = useState('expense_date')
  const [sortDirection, setSortDirection] = useState('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    category: '',
    client_id: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    taxDeductible: false
  })
  const [showFilters, setShowFilters] = useState(false)

  // Categories for filtering
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

  useEffect(() => {
    const loadExpenses = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          const expensesData = await expensesApi.getAll(user.id)
          setExpenses(Array.isArray(expensesData) ? expensesData : [])
        }
      } catch (error) {
        console.error('Error loading expenses:', error)
      } finally {
        setLoading(false)
      }
    }

    loadExpenses()
  }, [])

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFilters(prev => ({
        ...prev,
        [name]: checked
      }))
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const resetFilters = () => {
    setFilters({
      category: '',
      client_id: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      taxDeductible: false
    })
    setSearchQuery('')
  }

  const handleDelete = async (id: string) => {
    if (window.confirm(t('expenses.confirmDelete', 'Are you sure you want to delete this expense?'))) {
      try {
        await expensesApi.delete(id)
        setExpenses(expenses.filter(expense => expense.id !== id))
      } catch (error) {
        console.error('Error deleting expense:', error)
      }
    }
  }

  const exportCSV = () => {
    const headers = [
      'Title',
      'Description',
      'Amount',
      'Currency',
      'Category',
      'Date',
      'Client',
      'Payment Method',
      'Tax Deductible',
      'Status'
    ]
    
    const csvData = filteredExpenses.map(expense => [
      expense.title,
      expense.description || '',
      expense.amount,
      expense.currency,
      expense.category,
      new Date(expense.expense_date).toLocaleDateString(),
      expense.clients?.name || '',
      expense.payment_method || '',
      expense.tax_deductible ? 'Yes' : 'No',
      expense.status
    ])
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Apply filters and search
  const filteredExpenses = expenses
    .filter(expense => {
      if (!expense) return false; // Skip any undefined or null expenses
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = expense.title?.toLowerCase().includes(query) || false
        const matchesDescription = expense.description?.toLowerCase().includes(query) || false
        const matchesCategory = expense.category?.toLowerCase().includes(query) || false
        const matchesClient = expense.clients?.name?.toLowerCase().includes(query) || false
        
        if (!(matchesTitle || matchesDescription || matchesCategory || matchesClient)) {
          return false
        }
      }
      
      // Category filter
      if (filters.category && expense.category !== filters.category) {
        return false
      }
      
      // Client filter
      if (filters.client_id && expense.client_id !== filters.client_id) {
        return false
      }
      
      // Date range filter
      if (filters.startDate && expense.expense_date && new Date(expense.expense_date) < new Date(filters.startDate)) {
        return false
      }
      
      if (filters.endDate && expense.expense_date && new Date(expense.expense_date) > new Date(filters.endDate)) {
        return false
      }
      
      // Amount range filter
      if (filters.minAmount && expense.amount < parseFloat(filters.minAmount)) {
        return false
      }
      
      if (filters.maxAmount && expense.amount > parseFloat(filters.maxAmount)) {
        return false
      }
      
      // Tax deductible filter
      if (filters.taxDeductible && !expense.tax_deductible) {
        return false
      }
      
      return true
    })
    .sort((a, b) => {
      if (!a || !b) return 0; // Handle potential undefined or null values
      if (sortField === 'amount') {
        return sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount
      } else if (sortField === 'expense_date') {
        return sortDirection === 'asc' 
          ? new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime()
          : new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
      } else {
        const aValue = a[sortField as keyof Expense] || ''
        const bValue = b[sortField as keyof Expense] || ''
        return sortDirection === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue))
      }
    })

  // Calculate totals
  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + (expense?.amount || 0), 0)
  const totalTaxDeductible = filteredExpenses
    .filter(expense => expense?.tax_deductible)
    .reduce((sum, expense) => sum + (expense?.amount || 0), 0)

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch (e) {
      return dateString;
    }
  }

  const getCategoryLabel = (categoryValue: string) => {
    const category = categories.find(cat => cat.value === categoryValue)
    return category ? category.label : categoryValue
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('expenses.title', 'Expenses')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('expenses.subtitle', 'Track and manage your business expenses')}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <Filter className="w-5 h-5 mr-2" />
              {t('common.filter', 'Filter')}
            </button>
            <button
              onClick={exportCSV}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <Download className="w-5 h-5 mr-2" />
              {t('common.export', 'Export')}
            </button>
            <Link
              to="/expenses/reports"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <BarChart2 className="w-5 h-5 mr-2" />
              {t('expenses.reports', 'Reports')}
            </Link>
            <Link
              to="/expenses/add"
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t('expenses.addExpense', 'Add Expense')}
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('expenses.searchPlaceholder', 'Search expenses...')}
              className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span className="mr-2">{t('expenses.totalAmount', 'Total')}:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</span>
            {totalTaxDeductible > 0 && (
              <>
                <span className="mx-2">|</span>
                <span className="mr-2">{t('expenses.taxDeductible', 'Tax Deductible')}:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(totalTaxDeductible)}</span>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('expenses.filters.category', 'Category')}
                </label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">{t('expenses.filters.allCategories', 'All Categories')}</option>
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('expenses.filters.dateRange', 'Date Range')}
                </label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder={t('expenses.filters.from', 'From')}
                  />
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder={t('expenses.filters.to', 'To')}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('expenses.filters.amountRange', 'Amount Range')}
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    name="minAmount"
                    value={filters.minAmount}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder={t('expenses.filters.min', 'Min')}
                  />
                  <input
                    type="number"
                    name="maxAmount"
                    value={filters.maxAmount}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder={t('expenses.filters.max', 'Max')}
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="taxDeductible"
                  name="taxDeductible"
                  checked={filters.taxDeductible}
                  onChange={handleFilterChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="taxDeductible" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  {t('expenses.filters.taxDeductible', 'Tax Deductible Only')}
                </label>
              </div>
              <div className="md:col-span-2 flex items-center">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                >
                  {t('common.resetFilters', 'Reset Filters')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expenses Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {filteredExpenses.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('expenses.noExpenses', 'No expenses found')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchQuery || Object.values(filters).some(v => v !== '' && v !== false)
                  ? t('expenses.noExpensesFiltered', 'No expenses match your filters')
                  : t('expenses.noExpensesYet', 'You haven\'t added any expenses yet')}
              </p>
              <Link
                to="/expenses/add"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('expenses.addExpense', 'Add Expense')}
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center">
                        {t('expenses.table.title', 'Title')}
                        {sortField === 'title' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center">
                        {t('expenses.table.category', 'Category')}
                        {sortField === 'category' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center">
                        {t('expenses.table.amount', 'Amount')}
                        {sortField === 'amount' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('expense_date')}
                    >
                      <div className="flex items-center">
                        {t('expenses.table.date', 'Date')}
                        {sortField === 'expense_date' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('expenses.table.client', 'Client')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('common.actions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredExpenses.map(expense => (
                    <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {expense.title}
                            </div>
                            {expense.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                {expense.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {getCategoryLabel(expense.category)}
                        </div>
                        {expense.subcategory && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {expense.subcategory}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(expense.amount, expense.currency)}
                        </div>
                        {expense.tax_deductible && (
                          <div className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                            <Tag className="h-3 w-3 mr-1" />
                            {t('expenses.taxDeductible', 'Tax Deductible')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDate(expense.expense_date)}
                        </div>
                        {expense.payment_method && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {expense.payment_method.replace('_', ' ')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {expense.clients ? (
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {expense.clients.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {t('expenses.noClient', 'No client')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            to={`/expenses/edit/${expense.id}`}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}