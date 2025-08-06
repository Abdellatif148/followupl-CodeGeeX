import React, { useState, useEffect, useCallback } from 'react'
import { Search, X, Users, Bell, FileText, TrendingDown, Calendar, DollarSign } from 'lucide-react'
import { clientsApi, remindersApi, invoicesApi, expensesApi } from '../lib/database'
import { supabase } from '../lib/supabase'
import { useCurrency } from '../hooks/useCurrency'
import { formatDate } from '../utils/dateHelpers'

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

interface SearchResult {
  id: string
  type: 'client' | 'reminder' | 'invoice' | 'expense'
  title: string
  subtitle: string
  metadata?: string
  url: string
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const { formatCurrency } = useCurrency()

  const searchData = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [clients, reminders, invoices, expenses] = await Promise.all([
        clientsApi.search(user.id, searchQuery),
        remindersApi.getAll(user.id),
        invoicesApi.getAll(user.id),
        expensesApi.getAll(user.id)
      ])

      const searchResults: SearchResult[] = []

      // Search clients
      clients.forEach(client => {
        searchResults.push({
          id: client.id,
          type: 'client',
          title: client.name,
          subtitle: client.company || client.email || 'No company',
          metadata: `${client.total_projects} projects • ${formatCurrency(client.total_earned)}`,
          url: '/clients'
        })
      })

      // Search reminders
      reminders
        .filter(reminder => 
          reminder.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          reminder.message?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .forEach(reminder => {
          searchResults.push({
            id: reminder.id,
            type: 'reminder',
            title: reminder.title,
            subtitle: reminder.clients?.name || 'No client',
            metadata: formatDate(reminder.due_date),
            url: '/reminders'
          })
        })

      // Search invoices
      invoices
        .filter(invoice => 
          invoice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          invoice.project?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          invoice.clients?.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .forEach(invoice => {
          searchResults.push({
            id: invoice.id,
            type: 'invoice',
            title: invoice.title || invoice.project || 'Untitled Invoice',
            subtitle: invoice.clients?.name || 'No client',
            metadata: `${formatCurrency(invoice.amount, invoice.currency)} • ${invoice.status}`,
            url: '/invoices'
          })
        })

      // Search expenses
      expenses
        .filter(expense => 
          expense.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          expense.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .forEach(expense => {
          searchResults.push({
            id: expense.id,
            type: 'expense',
            title: expense.title,
            subtitle: expense.category,
            metadata: `${formatCurrency(expense.amount, expense.currency)} • ${formatDate(expense.expense_date)}`,
            url: '/expenses'
          })
        })

      setResults(searchResults.slice(0, 20)) // Limit to 20 results
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setLoading(false)
    }
  }, [formatCurrency])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchData(query)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query, searchData])

  const getIcon = (type: string) => {
    switch (type) {
      case 'client': return <Users className="w-5 h-5 text-blue-500" />
      case 'reminder': return <Bell className="w-5 h-5 text-orange-500" />
      case 'invoice': return <FileText className="w-5 h-5 text-green-500" />
      case 'expense': return <TrendingDown className="w-5 h-5 text-red-500" />
      default: return <Search className="w-5 h-5 text-gray-500" />
    }
  }

  const handleResultClick = (result: SearchResult) => {
    window.location.href = result.url
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black bg-opacity-25" 
        onClick={onClose}
      />
      
      {/* Search Modal */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients, invoices, reminders, expenses..."
              className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
              autoFocus
            />
            <button
              onClick={onClose}
              className="ml-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Searching...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center">
                {query ? (
                  <>
                    <Search className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">No results found for "{query}"</p>
                  </>
                ) : (
                  <>
                    <Search className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">Start typing to search...</p>
                  </>
                )}
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
                      {getIcon(result.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {result.title}
                          </h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {result.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {result.subtitle}
                        </p>
                        {result.metadata && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {result.metadata}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}