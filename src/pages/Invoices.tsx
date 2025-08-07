import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, DollarSign, Calendar, User, CheckCircle, AlertCircle } from 'lucide-react'
import Layout from '../components/Layout'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import InvoiceForm from '../components/InvoiceForm'
import LoadingSpinner from '../components/LoadingSpinner'
import { invoicesApi } from '../lib/database'
import { supabase } from '../lib/supabase'
import { useCurrency } from '../hooks/useCurrency'
import { useToast } from '../hooks/useToast'
import { formatDate, isOverdue } from '../utils/dateHelpers'
import { useBusinessAnalytics } from '../hooks/useAnalytics'

interface InvoiceWithClient {
  id: string
  user_id: string
  client_id: string
  project?: string
  title?: string
  amount: number
  currency: string
  due_date: string
  status: 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'unpaid'
  payment_date?: string
  payment_method?: string
  created_at: string
  updated_at: string
  clients?: {
    id: string
    name: string
    email: string | null
    platform: string
  } | null
}

export default function Invoices() {
  const { trackInvoiceAction } = useBusinessAnalytics()
  const { formatCurrency } = useCurrency()
  const { success, error } = useToast()
  const [invoices, setInvoices] = useState<InvoiceWithClient[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<InvoiceWithClient | null>(null)
  const [deletingInvoice, setDeletingInvoice] = useState<string | null>(null)

  useEffect(() => {
    loadInvoices()
  }, [])

  useEffect(() => {
    filterInvoices()
  }, [invoices, searchTerm, statusFilter])

  const loadInvoices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const invoicesData = await invoicesApi.getAll(user.id)
        setInvoices(invoicesData)
      }
    } catch (err) {
      console.error('Error loading invoices:', err)
      error('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  const filterInvoices = () => {
    let filtered = invoices

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.clients?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.clients?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'overdue') {
        filtered = filtered.filter(invoice => 
          ['unpaid', 'pending'].includes(invoice.status) && isOverdue(invoice.due_date)
        )
      } else {
        filtered = filtered.filter(invoice => invoice.status === statusFilter)
      }
    }

    setFilteredInvoices(filtered)
  }

  const handleCreateInvoice = () => {
    setEditingInvoice(null)
    setShowForm(true)
  }

  const handleEditInvoice = (invoice: InvoiceWithClient) => {
    setEditingInvoice(invoice)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingInvoice(null)
    loadInvoices()
    success(editingInvoice ? 'Invoice updated successfully!' : 'Invoice created successfully!')
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingInvoice(null)
  }

  const handleMarkPaid = async (invoice: InvoiceWithClient) => {
    try {
      await invoicesApi.markPaid(invoice.id)
      
      // Track invoice payment
      trackInvoiceAction('mark_paid', {
        amount: invoice.amount,
        currency: invoice.currency
      })
      
      loadInvoices()
      success('Invoice marked as paid!')
    } catch (err) {
      console.error('Error marking invoice as paid:', err)
      error('Failed to mark invoice as paid')
    }
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return

    setDeletingInvoice(invoiceId)
    try {
      await invoicesApi.delete(invoiceId)
      
      // Track invoice deletion
      trackInvoiceAction('delete', {})
      
      loadInvoices()
      success('Invoice deleted successfully!')
    } catch (err) {
      console.error('Error deleting invoice:', err)
      error('Failed to delete invoice')
    } finally {
      setDeletingInvoice(null)
    }
  }

  const getStatusColor = (invoice: InvoiceWithClient) => {
    if (['unpaid', 'pending'].includes(invoice.status) && isOverdue(invoice.due_date)) {
      return 'text-red-600 dark:text-red-400'
    }
    switch (invoice.status) {
      case 'paid': return 'text-green-600 dark:text-green-400'
      case 'pending': return 'text-yellow-600 dark:text-yellow-400'
      case 'draft': return 'text-gray-600 dark:text-gray-400'
      default: return 'text-red-600 dark:text-red-400'
    }
  }

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0)
  const paidAmount = filteredInvoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.amount, 0)
  const pendingAmount = filteredInvoices
    .filter(invoice => ['unpaid', 'pending'].includes(invoice.status))
    .reduce((sum, invoice) => sum + invoice.amount, 0)

  if (showForm) {
    return (
      <Layout>
        <div className="p-6">
          <InvoiceForm
            editingInvoice={editingInvoice}
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Invoices</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track payments and manage your invoice workflow
            </p>
          </div>
          <button
            onClick={handleCreateInvoice}
            className="mt-4 sm:mt-0 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors duration-200 flex items-center font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Invoice
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">Total Amount</p>
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
                <p className="text-sm text-green-700 dark:text-green-400 mb-1">Paid Amount</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                  {formatCurrency(paidAmount)}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-1">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
                  {formatCurrency(pendingAmount)}
                </p>
              </div>
              <AlertCircle className="w-10 h-10 text-yellow-500 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <LoadingSpinner text="Loading invoices..." />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title={invoices.length === 0 ? "No invoices yet" : "No invoices found"}
            description={
              invoices.length === 0
                ? "Create your first invoice to start tracking payments and get paid faster"
                : "Try adjusting your search or filter criteria"
            }
            action={
              invoices.length === 0
                ? {
                    label: "Create Your First Invoice",
                    onClick: handleCreateInvoice
                  }
                : undefined
            }
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Client & Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {invoice.clients?.name || 'Unknown Client'}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {invoice.project || invoice.title || 'No project specified'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
                          <div className={`text-sm ${getStatusColor(invoice)}`}>
                            {formatDate(invoice.due_date)}
                            {['unpaid', 'pending'].includes(invoice.status) && isOverdue(invoice.due_date) && (
                              <span className="ml-2 text-xs text-red-600 dark:text-red-400 font-medium">
                                (Overdue)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge 
                          status={
                            ['unpaid', 'pending'].includes(invoice.status) && isOverdue(invoice.due_date)
                              ? 'overdue'
                              : invoice.status
                          } 
                          type="invoice" 
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {invoice.status !== 'paid' && (
                            <button
                              onClick={() => handleMarkPaid(invoice)}
                              className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors duration-200"
                              title="Mark as paid"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEditInvoice(invoice)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                            title="Edit invoice"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            disabled={deletingInvoice === invoice.id}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 transition-colors duration-200"
                            title="Delete invoice"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}