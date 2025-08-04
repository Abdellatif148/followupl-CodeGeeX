import React, { useState, useEffect } from 'react'
import { Search, X, Users, Bell, FileText, TrendingDown, Calendar } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { clientsApi, remindersApi, invoicesApi, expensesApi } from '../lib/database'
import { useCurrency } from '../hooks/useCurrency'
import { formatDueDate } from '../utils/dateHelpers'

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
  href: string
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const { user } = useAuth()
  const { formatCurrency } = useCurrency()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setResults([])
    }
  }, [isOpen])

  useEffect(() => {
    if (query.length >= 2 && user) {
      performSearch()
    } else {
      setResults([])
    }
  }, [query, user])

  const performSearch = async () => {
    if (!user) return

    setLoading(true)
    try {
      const [clients, reminders, invoices, expenses] = await Promise.all([
        clientsApi.search(user.id, query),
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
          subtitle: client.company || client.email || 'Client',
          metadata: `${client.total_projects} projects • ${formatCurrency(client.total_earned)}`,
          href: '/clients'
        })
      })

      // Search reminders
      reminders
        .filter(reminder => 
          reminder.title.toLowerCase().includes(query.toLowerCase()) ||
          reminder.message?.toLowerCase().includes(query.toLowerCase())
        )
        .forEach(reminder => {
          searchResults.push({
            id: reminder.id,
            type: 'reminder',
            title: reminder.title,
            subtitle: reminder.message || 'Reminder',
            metadata: formatDueDate(reminder.due_date),
            href: '/reminders'
          })
        })

      // Search invoices
      invoices
        .filter(invoice => 
          (invoice.project || invoice.title || '').toLowerCase().includes(query.toLowerCase()) ||
          invoice.clients?.name.toLowerCase().includes(query.toLowerCase())
        )
        .forEach(invoice => {
          searchResults.push({
            id: invoice.id,
            type: 'invoice',
            title: invoice.project || invoice.title || 'Invoice',
            subtitle: invoice.clients?.name || 'Invoice',
            metadata: `${formatCurrency(invoice.amount, invoice.currency)} • ${invoice.status}`,
            href: '/invoices'
          })
        })

      // Search expenses
      expenses
        .filter(expense => 
          expense.title.toLowerCase().includes(query.toLowerCase()) ||
          expense.description?.toLowerCase().includes(query.toLowerCase()) ||
          expense.category.toLowerCase().includes(query.toLowerCase())
        )
        .forEach(expense => {
          searchResults.push({
            id: expense.id,
            type: 'expense',
            title: expense.title,
            subtitle: expense.category,
            metadata: `${formatCurrency(expense.amount, expense.currency)} • ${expense.status}`,
            href: '/expenses'
          })
        })

      setResults(searchResults.slice(0, 10)) // Limit to 10 results
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'client': return <Users className="w-5 h-5 text-blue-500" />
      case 'reminder': return <Bell className="w-5 h-5 text-orange-500" />
      case 'invoice': return <FileText className="w-5 h-5 text-green-500" />
      case 'expense': return <TrendingDown className="w-5 h-5 text-red-500" />
      default: return <Search className="w-5 h-5 text-gray-500" />
    }
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
          {/* Search Input */}
          <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input
              type="text"
              placeholder="Search clients, invoices, reminders, expenses..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Searching...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((result) => (
                  <a
                    key={`${result.type}-${result.id}`}
                    href={result.href}
                    onClick={onClose}
                    className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <div className="mr-3">
                      {getIcon(result.type)}
                    </div>
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
                  </a>
                ))}
              </div>
            ) : query.length >= 2 ? (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No results found
                </h4>
                <p className="text-gray-500 dark:text-gray-400">
                  Try searching for clients, invoices, reminders, or expenses
                </p>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Search your data
                </h4>
                <p className="text-gray-500 dark:text-gray-400">
                  Type at least 2 characters to search
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}