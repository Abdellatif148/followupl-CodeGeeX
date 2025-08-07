import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, DollarSign, Calendar, User, Tag, Receipt } from 'lucide-react'
import Layout from '../components/Layout'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import ExpenseForm from '../components/ExpenseForm'
import LoadingSpinner from '../components/LoadingSpinner'
import { expensesApi } from '../lib/database'
import { supabase } from '../lib/supabase'
import { useCurrency } from '../hooks/useCurrency'
import { useToast } from '../hooks/useToast'
import { formatDate } from '../utils/dateHelpers'
import { useBusinessAnalytics } from '../hooks/useAnalytics'

interface ExpenseWithClient {
  id: string
  user_id: string
  client_id?: string
  title: string
  description?: string
  amount: number
  currency: string
  category: string
  subcategory?: string
  expense_date: string
  payment_method?: string
  tax_deductible: boolean
  status: 'pending' | 'approved' | 'reimbursed' | 'reconciled'
  tags?: string[]
  created_at: string
  updated_at: string
  clients?: {
    id: string
    name: string
  } | null
}

export default function Expenses() {
  const { trackBusinessAction } = useBusinessAnalytics()
  const { formatCurrency } = useCurrency()
  const { success, error } = useToast()
  const [expenses, setExpenses] = useState<ExpenseWithClient[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseWithClient | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<string | null>(null)

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

  useEffect(() => {
    loadExpenses()
  }, [])

  useEffect(() => {
    filterExpenses()
  }, [expenses, searchTerm, categoryFilter, statusFilter])

  const loadExpenses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const expensesData = await expensesApi.getAll(user.id)
        setExpenses(expensesData)
      }
    } catch (err) {
      console.error('Error loading expenses:', err)
      error('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  const filterExpenses = () => {
    let filtered = expenses

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.subcategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.clients?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(expense => expense.category === categoryFilter)
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(expense => expense.status === statusFilter)
    }

    // Sort by expense date (newest first)
    filtered.sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())

    setFilteredExpenses(filtered)
  }

  const handleCreateExpense = () => {
    setEditingExpense(null)
    setShowForm(true)
  }

  const handleEditExpense = (expense: ExpenseWithClient) => {
    setEditingExpense(expense)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingExpense(null)
    loadExpenses()
    success(editingExpense ? 'Expense updated successfully!' : 'Expense created successfully!')
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingExpense(null)
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return

    setDeletingExpense(expenseId)
    try {
      await expensesApi.delete(expenseId)
      
      // Track expense deletion
      trackBusinessAction('delete', 'expense', {})
      
      loadExpenses()
      success('Expense deleted successfully!')
    } catch (err) {
      console.error('Error deleting expense:', err)
      error('Failed to delete expense')
    } finally {
      setDeletingExpense(null)
    }
  }

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const taxDeductibleAmount = filteredExpenses
    .filter(expense => expense.tax_deductible)
    .reduce((sum, expense) => sum + expense.amount, 0)
  const pendingAmount = filteredExpenses
    .filter(expense => expense.status === 'pending')
    .reduce((sum, expense) => sum + expense.amount, 0)

  if (showForm) {
    return (
      <Layout>
        <div className="p-6">
          <ExpenseForm
            editingExpense={editingExpense}
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Expenses</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track and manage your business expenses
            </p>
          </div>
          <button
            onClick={handleCreateExpense}
            className="mt-4 sm:mt-0 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors duration-200 flex items-center font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Expense
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-blue-500 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-400 mb-1">Tax Deductible</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                  {formatCurrency(taxDeductibleAmount)}
                </p>
              </div>
              <Receipt className="w-10 h-10 text-green-500 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
                  {formatCurrency(pendingAmount)}
                </p>
              </div>
              <Calendar className="w-10 h-10 text-yellow-500 dark:text-yellow-400" />
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
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="flex gap-4">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="reimbursed">Reimbursed</option>
                  <option value="reconciled">Reconciled</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <LoadingSpinner text="Loading expenses..." />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={expenses.length === 0 ? "No expenses yet" : "No expenses found"}
            description={
              expenses.length === 0
                ? "Add your first expense to start tracking your business costs"
                : "Try adjusting your search or filter criteria"
            }
            action={
              expenses.length === 0
                ? {
                    label: "Add Your First Expense",
                    onClick: handleCreateExpense
                  }
                : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mr-3">
                        {expense.title}
                      </h3>
                      <StatusBadge status={expense.status} type="expense" size="sm" />
                      {expense.tax_deductible && (
                        <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
                          Tax Deductible
                        </span>
                      )}
                    </div>

                    {expense.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {expense.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(expense.amount, expense.currency)}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{formatDate(expense.expense_date)}</span>
                      </div>

                      <div className="flex items-center">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                          {expense.category}
                        </span>
                      </div>

                      {expense.subcategory && (
                        <div className="flex items-center">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            {expense.subcategory}
                          </span>
                        </div>
                      )}

                      {expense.clients && (
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          <span>{expense.clients.name}</span>
                        </div>
                      )}

                      {expense.payment_method && (
                        <div className="flex items-center">
                          <span className="text-xs">via {expense.payment_method}</span>
                        </div>
                      )}
                    </div>

                    {expense.tags && expense.tags.length > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <div className="flex flex-wrap gap-1">
                          {expense.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEditExpense(expense)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                      title="Edit expense"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      disabled={deletingExpense === expense.id}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 transition-colors duration-200"
                      title="Delete expense"
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