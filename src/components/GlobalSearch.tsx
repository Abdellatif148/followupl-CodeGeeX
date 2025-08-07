import React, { useState, useEffect } from 'react'
import { Search, X, Users, Bell, FileText, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { clientsApi, remindersApi, invoicesApi } from '../lib/database'
import { supabase } from '../lib/supabase'
import { formatDate } from '../utils/dateHelpers'
import { formatCurrency } from '../utils/formatters'

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

interface SearchResult {
  id: string
  type: 'client' | 'reminder' | 'invoice'
  title: string
  subtitle?: string
  href: string
  icon: React.ComponentType<any>
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
    }
  }, [isOpen])

  useEffect(() => {
    if (query.trim().length >= 2) {
      performSearch(query.trim())
    } else {
      setResults([])
    }
  }, [query])

  const performSearch = async (searchQuery: string) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [clients, reminders, invoices] = await Promise.all([
        clientsApi.search(user.id, searchQuery),
        remindersApi.getAll(user.id),
        invoicesApi.getAll(user.id)
      ])

      const searchResults: SearchResult[] = []

      // Add matching clients
      clients.forEach(client => {
        searchResults.push({
          id: client.id,
          type: 'client',
          title: client.name,
          subtitle: client.company || client.email || 'Client',
          href: `/clients`,
          icon: Users
        })
      })

      // Add matching reminders
      reminders
        .filter(reminder => 
          reminder.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          reminder.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .forEach(reminder => {
          searchResults.push({
            id: reminder.id,
            type: 'reminder',
            title: reminder.title || 'Untitled Reminder',
            subtitle: `Due ${formatDate(reminder.due_date)}`,
            href: `/reminders`,
            icon: Bell
          })
        })

      // Add matching invoices
      invoices
        .filter(invoice => 
          invoice.project?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          invoice.clients?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .forEach(invoice => {
          searchResults.push({
            id: invoice.id,
            type: 'invoice',
            title: invoice.project || 'Untitled Invoice',
            subtitle: `${formatCurrency(invoice.amount || 0, invoice.currency)} - ${invoice.clients?.name || 'Unknown Client'}`,
            href: `/invoices`,
            icon: FileText
          })
        })

      setResults(searchResults.slice(0, 10)) // Limit to 10 results
    } catch (error) {
      console.error('Error performing search:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    navigate(result.href)
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
          {/* Search Input */}
          <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients, reminders, invoices..."
              className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
              autoFocus
            />
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-3"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Searching...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center">
                {query.trim().length >= 2 ? (
                  <>
                    <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No results found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Try searching for clients, reminders, or invoices
                    </p>
                  </>
                ) : (
                  <>
                    <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Start typing to search
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Search across clients, reminders, and invoices
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="py-2">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <result.icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {result.title}
                        </h4>
                        {result.subtitle && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
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