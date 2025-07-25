import React, { useState, useEffect } from 'react'
import { Search, X, Users, Bell, FileText, Calendar, DollarSign } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { clientsApi, remindersApi, invoicesApi, expensesApi } from '../lib/database'
import { supabase } from '../lib/supabase'
import { useCurrency } from '../hooks/useCurrency'

interface SearchResult {
  id: string
  type: 'client' | 'reminder' | 'invoice' | 'expense'
  title: string
  subtitle: string
  status?: string
  amount?: number
  currency?: string
  date?: string
  icon: React.ComponentType<any>
}

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [allData, setAllData] = useState<{
    clients: any[]
    reminders: any[]
    invoices: any[]
    expenses: any[]
  }>({
    clients: [],
    reminders: [],
    invoices: [],
    expenses: []
  })
  const navigate = useNavigate()
  const { formatCurrency } = useCurrency()

  useEffect(() => {
    if (isOpen) {
      loadAllData()
      // Focus search input when modal opens
      setTimeout(() => {
        const input = document.getElementById('global-search-input')
        if (input) input.focus()
      }, 100)
    } else {
      setSearchQuery('')
      setResults([])
    }
  }, [isOpen])

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery)
    } else {
      setResults([])
    }
  }, [searchQuery, allData])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const [clients, reminders, invoices, expenses] = await Promise.all([
          clientsApi.getAll(user.id),
          remindersApi.getAll(user.id),
          invoicesApi.getAll(user.id),
          expensesApi.getAll(user.id)
        ])
        
        setAllData({ clients, reminders, invoices, expenses })
      }
    } catch (error) {
      console.error('Error loading search data:', error)
    } finally {
      setLoading(false)
    }
  }

  const performSearch = (query: string) => {
    const searchTerm = query.toLowerCase().trim()
    const searchResults: SearchResult[] = []

    // Search clients
    allData.clients.forEach(client => {
      const matchesName = client.name.toLowerCase().includes(searchTerm)
      const matchesEmail = client.email?.toLowerCase().includes(searchTerm)
      const matchesPhone = client.phone?.toLowerCase().includes(searchTerm)
      const matchesCompany = client.company?.toLowerCase().includes(searchTerm)
      const matchesTags = client.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      const matchesStatus = client.status.toLowerCase().includes(searchTerm)
      
      if (matchesName || matchesEmail || matchesPhone || matchesCompany || matchesTags || matchesStatus) {
        searchResults.push({
          id: client.id,
          type: 'client',
          title: client.name,
          subtitle: [
            client.company,
            client.email,
            client.phone,
            client.tags?.length ? `${client.tags.length} tags` : null,
            client.status
          ].filter(Boolean).join(' • '),
          status: client.status,
          icon: Users
        })
      }
    })

    // Search invoices
    allData.invoices.forEach(invoice => {
      const matchesProject = invoice.project?.toLowerCase().includes(searchTerm) || 
                            invoice.title?.toLowerCase().includes(searchTerm)
      const matchesClient = invoice.clients?.name.toLowerCase().includes(searchTerm)
      const matchesStatus = invoice.status.toLowerCase().includes(searchTerm)
      const matchesAmount = invoice.amount.toString().includes(searchTerm)
      
      // Special status searches
      const isPaidSearch = searchTerm === 'paid' && invoice.status === 'paid'
      const isUnpaidSearch = (searchTerm === 'unpaid' || searchTerm === 'overdue') && 
                            (invoice.status === 'unpaid' || invoice.status === 'pending')
      const isOverdueSearch = searchTerm.includes('overdue') && 
                             (invoice.status === 'unpaid' || invoice.status === 'pending') &&
                             new Date(invoice.due_date) < new Date()
      
      if (matchesProject || matchesClient || matchesStatus || matchesAmount || 
          isPaidSearch || isUnpaidSearch || isOverdueSearch) {
        const isOverdue = (invoice.status === 'unpaid' || invoice.status === 'pending') && 
                         new Date(invoice.due_date) < new Date()
        
        searchResults.push({
          id: invoice.id,
          type: 'invoice',
          title: invoice.project || invoice.title || 'Untitled Invoice',
          subtitle: `${invoice.clients?.name} • ${invoice.status}${isOverdue ? ' (Overdue)' : ''}`,
          status: invoice.status,
          amount: invoice.amount,
          currency: invoice.currency,
          date: invoice.due_date,
          icon: FileText
        })
      }
    })

    // Search reminders
    allData.reminders.forEach(reminder => {
      const matchesTitle = reminder.title.toLowerCase().includes(searchTerm)
      const matchesDescription = reminder.description?.toLowerCase().includes(searchTerm) ||
                                reminder.message?.toLowerCase().includes(searchTerm)
      const matchesClient = reminder.clients?.name.toLowerCase().includes(searchTerm)
      const matchesStatus = reminder.status.toLowerCase().includes(searchTerm)
      
      // Special reminder searches
      const isOverdueReminder = searchTerm.includes('overdue') && 
                               new Date(reminder.due_date || reminder.datetime) < new Date() &&
                               (reminder.status === 'active' || reminder.status === 'pending')
      
      if (matchesTitle || matchesDescription || matchesClient || matchesStatus || isOverdueReminder) {
        const isOverdue = new Date(reminder.due_date || reminder.datetime) < new Date() &&
                         (reminder.status === 'active' || reminder.status === 'pending')
        
        searchResults.push({
          id: reminder.id,
          type: 'reminder',
          title: reminder.title,
          subtitle: `${reminder.clients?.name || 'No client'} • ${reminder.status}${isOverdue ? ' (Overdue)' : ''}`,
          status: reminder.status,
          date: reminder.due_date || reminder.datetime,
          icon: Bell
        })
      }
    })

    // Search expenses
    allData.expenses.forEach(expense => {
      const matchesTitle = expense.title.toLowerCase().includes(searchTerm)
      const matchesDescription = expense.description?.toLowerCase().includes(searchTerm)
      const matchesCategory = expense.category.toLowerCase().includes(searchTerm)
      const matchesClient = expense.clients?.name.toLowerCase().includes(searchTerm)
      const matchesAmount = expense.amount.toString().includes(searchTerm)
      const matchesStatus = expense.status?.toLowerCase().includes(searchTerm)
      
      // Special expense searches
      const isTaxDeductible = searchTerm.includes('tax') && expense.tax_deductible
      
      if (matchesTitle || matchesDescription || matchesCategory || matchesClient ||
          matchesAmount || matchesStatus || isTaxDeductible) {
        searchResults.push({
          id: expense.id,
          type: 'expense',
          title: expense.title,
          subtitle: `${expense.category} • ${expense.clients?.name || 'No client'} • ${formatCurrency(expense.amount, expense.currency)}`,
          status: expense.status,
          amount: expense.amount,
          currency: expense.currency,
          date: expense.expense_date,
          icon: DollarSign
        })
      }
    })

    // Sort results by relevance (exact matches first, then partial matches)
    searchResults.sort((a, b) => {
      const aExact = a.title.toLowerCase() === searchTerm
      const bExact = b.title.toLowerCase() === searchTerm
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      return 0
    })

    setResults(searchResults.slice(0, 10)) // Limit to 10 results
  }

  const handleResultClick = (result: SearchResult) => {
    onClose()
    
    switch (result.type) {
      case 'client':
        navigate('/clients')
        break
      case 'reminder':
        navigate('/reminders')
        break
      case 'invoice':
        navigate('/invoices')
        break
      case 'expense':
        navigate('/expenses')
        break
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
    if (diffDays < 7) return `Due in ${diffDays} days`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string, type: string) => {
    if (type === 'invoice') {
      switch (status) {
        case 'paid': return 'text-green-600 dark:text-green-400'
        case 'unpaid':
        case 'pending': return 'text-red-600 dark:text-red-400'
        default: return 'text-gray-600 dark:text-gray-400'
      }
    }
    if (type === 'reminder') {
      switch (status) {
        case 'completed':
        case 'done': return 'text-green-600 dark:text-green-400'
        case 'active':
        case 'pending': return 'text-yellow-600 dark:text-yellow-400'
        default: return 'text-gray-600 dark:text-gray-400'
      }
    }
    if (type === 'client') {
      switch (status) {
        case 'active': return 'text-green-600 dark:text-green-400'
        case 'inactive': return 'text-yellow-600 dark:text-yellow-400'
        case 'archived': return 'text-gray-600 dark:text-gray-400'
        default: return 'text-gray-600 dark:text-gray-400'
      }
    }
    if (type === 'expense') {
      switch (status) {
        case 'approved': return 'text-green-600 dark:text-green-400'
        case 'pending': return 'text-yellow-600 dark:text-yellow-400'
        case 'reimbursed': return 'text-blue-600 dark:text-blue-400'
        case 'reconciled': return 'text-purple-600 dark:text-purple-400'
        default: return 'text-gray-600 dark:text-gray-400'
      }
    }
    return 'text-gray-600 dark:text-gray-400'
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Search Modal */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients, invoices, reminders, expenses... (try 'paid', 'tax', 'overdue')"
              className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-lg"
            />
            <button
              onClick={onClose}
              className="ml-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading...</p>
              </div>
            ) : searchQuery.trim() === '' ? (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Search Everything
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Search by name, status (paid/unpaid), or try "overdue amount"
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Try searching for client names, "paid", "unpaid", or "overdue"
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        result.type === 'client' ? 'bg-blue-100 dark:bg-blue-900/20' :
                        result.type === 'invoice' ? 'bg-green-100 dark:bg-green-900/20' :
                        result.type === 'expense' ? 'bg-purple-100 dark:bg-purple-900/20' :
                        'bg-yellow-100 dark:bg-yellow-900/20'
                      }`}>
                        <result.icon className={`w-5 h-5 ${
                          result.type === 'client' ? 'text-blue-600 dark:text-blue-400' :
                          result.type === 'invoice' ? 'text-green-600 dark:text-green-400' :
                          result.type === 'expense' ? 'text-purple-600 dark:text-purple-400' :
                          'text-yellow-600 dark:text-yellow-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {result.title}
                          </h4>
                          <div className="flex items-center space-x-2 ml-2">
                            {result.amount && (
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(result.amount, result.currency)}
                              </span>
                            )}
                            {result.date && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(result.date)}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className={`text-sm mt-1 truncate ${getStatusColor(result.status || '', result.type)}`}>
                          {result.subtitle}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Tips */}
          {searchQuery.trim() === '' && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p><strong>Search tips:</strong></p>
                <p>• Type client names to find specific clients</p>
                <p>• Use "paid" or "unpaid" to filter by payment status</p>
                <p>• Try "overdue" to find overdue invoices and reminders</p>
                <p>• Search "tax" to find tax-deductible expenses</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}