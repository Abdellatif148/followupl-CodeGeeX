import React, { useState, useEffect } from 'react'
import { 
  Plus, Search, Filter, DollarSign, Calendar, Tag,
  Edit, Trash2, FileText, TrendingDown, CheckCircle, Clock
} from 'lucide-react'
import Layout from '../components/Layout'
import ExpenseForm from '../components/ExpenseForm'
import Table from '../components/Table'
import { expensesApi, clientsApi } from '../lib/database'
import { supabase } from '../lib/supabase'
import { useCurrency } from '../hooks/useCurrency'
import { useBusinessAnalytics } from '../hooks/useAnalytics'

export default function Expenses() {
  const { trackExpenseAction } = useBusinessAnalytics()
  const [expenses, setExpenses] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const { formatCurrency } = useCurrency()

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
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const [expensesData, clientsData] = await Promise.all([
          expensesApi.getAll(user.id),
          clientsApi.getAll(user.id)
        ])
        setExpenses(expensesData)
        setClients(clientsData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expense.clients?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = filterCategory === 'all' || expense.category === filterCategory
    const matchesStatus = filterStatus === 'all' || expense.status === filterStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
      case 'reimbursed': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
      case 'reconciled': return 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300'
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'reimbursed': return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'reconciled': return <CheckCircle className="w-4 h-4 text-purple-500" />
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />
      default: return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const deleteExpense = async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await expensesApi.delete(expenseId)
        
        // Track expense deletion
        trackExpenseAction('delete', {
          expense_id: expenseId
        })
        
        loadData()
      } catch (error) {
        console.error('Error deleting expense:', error)
      }
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingExpense(null)
    loadData()
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingExpense(null)
  }

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
  const taxDeductibleExpenses = expenses.filter(exp => exp.tax_deductible).reduce((sum, exp) => sum + (exp.amount || 0), 0)
  const pendingExpenses = expenses.filter(exp => exp.status === 'pending').reduce((sum, exp) => sum + (exp.amount || 0), 0)

  const columns = [
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(value)}
          <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(value)}`}>
            {value}
          </span>
        </div>
      )
    },
    {
      key: 'title',
      label: 'Expense',
      sortable: true,
      render: (value: string, row: any) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{row.category}</div>
          {row.description && (
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate max-w-xs">
              {row.description}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value: number, row: any) => (
        <div>
          <div className="font-semibold text-gray-900 dark:text-white">
            {formatCurrency(value || 0, row.currency)}
          </div>
          {row.tax_deductible && (
            <div className="text-xs text-green-600 dark:text-green-400">Tax deductible</div>
          )}
        </div>
      )
    },
    {
      key: 'expense_date',
      label: 'Date',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{formatDate(value)}</span>
        </div>
      )
    },
    {
      key: 'client',
      label: 'Client',
      render: (value: any, row: any) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.clients?.name || 'No client'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: any) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setEditingExpense(row)
              setShowForm(true)
            }}
            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteExpense(row.id)}
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
          <ExpenseForm 
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
            editingExpense={editingExpense}
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Expenses</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track business expenses and manage your spending
            </p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Expense
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="reimbursed">Reimbursed</option>
            <option value="reconciled">Reconciled</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-white to-red-50 dark:from-gray-800 dark:to-red-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tax Deductible</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(taxDeductibleExpenses)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-yellow-50 dark:from-gray-800 dark:to-yellow-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(pendingExpenses)}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <TrendingDown className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {searchQuery || filterCategory !== 'all' || filterStatus !== 'all' ? 'No expenses found' : 'No expenses yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                {searchQuery || filterCategory !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start tracking your business expenses to better manage your finances'
                }
              </p>
              {!searchQuery && filterCategory === 'all' && filterStatus === 'all' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Expense
                </button>
              )}
            </div>
          ) : (
            <Table
              columns={columns}
              data={filteredExpenses}
              loading={loading}
              emptyMessage="No expenses found matching your filters"
            />
          )}
        </div>
      </div>
    </Layout>
  )
}