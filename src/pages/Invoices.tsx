import React, { useState, useEffect } from 'react'
import { 
  Plus, Search, Filter, DollarSign, Calendar, AlertTriangle,
  CheckCircle, Clock, MoreVertical, Eye, Send, Download, Edit, Trash2, FileText
} from 'lucide-react'
import Layout from '../components/Layout'
import InvoiceForm from '../components/InvoiceForm'
import Table from '../components/Table'
import { invoicesApi, clientsApi } from '../lib/database'
import { useAuth } from '../hooks/useAuth'
import { useCurrency } from '../hooks/useCurrency'
import { formatDueDate } from '../utils/dateHelpers'

export default function Invoices() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<any>(null)
  const { formatCurrency } = useCurrency()

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) {
      setLoading(false)
      return
    }
    
    try {
      const [invoicesData, clientsData] = await Promise.all([
        invoicesApi.getAll(user.id),
        clientsApi.getAll(user.id)
      ])
      setInvoices(invoicesData)
      setClients(clientsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = (invoice.project || invoice.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.clients?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
      case 'unpaid': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'unpaid': return <Clock className="w-5 h-5 text-red-500" />
      default: return <DollarSign className="w-5 h-5 text-gray-500" />
    }
  }

  const markAsPaid = async (invoiceId: string) => {
    try {
      await invoicesApi.markPaid(invoiceId)
      loadData()
    } catch (error) {
      console.error('Error marking invoice as paid:', error)
    }
  }

  const deleteInvoice = async (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await invoicesApi.delete(invoiceId)
        loadData()
      } catch (error) {
        console.error('Error deleting invoice:', error)
      }
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingInvoice(null)
    loadData()
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingInvoice(null)
  }

  // Calculate totals
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0)
  const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0)
  const unpaidAmount = invoices.filter(inv => inv.status === 'unpaid').reduce((sum, inv) => sum + inv.amount, 0)

  const columns = [
    {
      key: 'status',
      label: 'Status',
      render: (value: string, row: any) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(value)}
          <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(value)}`}>
            {value}
          </span>
        </div>
      )
    },
    {
      key: 'project',
      label: 'Project',
      sortable: true,
      render: (value: string, row: any) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {value || row.title || 'Untitled Project'}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {row.clients?.name}
          </div>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value: number, row: any) => (
        <div className="font-semibold text-gray-900 dark:text-white">
          {formatCurrency(value, row.currency)}
        </div>
      )
    },
    {
      key: 'due_date',
      label: 'Due Date',
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className={
            row.status === 'unpaid' && new Date(value) < new Date()
              ? 'text-red-600 dark:text-red-400'
              : ''
          }>
            {formatDueDate(value)}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: any) => (
        <div className="flex items-center space-x-2">
          {row.status === 'unpaid' && (
            <button
              onClick={() => markAsPaid(row.id)}
              className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors duration-200"
            >
              Mark Paid
            </button>
          )}
          <button
            onClick={() => {
              setEditingInvoice(row)
              setShowForm(true)
            }}
            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteInvoice(row.id)}
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
          <InvoiceForm 
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
            editingInvoice={editingInvoice}
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Invoices</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track payments and manage your invoice workflow
            </p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Invoice
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(paidAmount)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-red-50 dark:from-gray-800 dark:to-red-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unpaid</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{formatCurrency(unpaidAmount)}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {searchQuery || filterStatus !== 'all' ? 'No invoices found' : 'No invoices yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first invoice to start tracking payments and get paid faster'
                }
              </p>
              {!searchQuery && filterStatus === 'all' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Invoice
                </button>
              )}
            </div>
          ) : (
            <Table
              columns={columns}
              data={filteredInvoices}
              loading={loading}
              emptyMessage="No invoices found matching your filters"
            />
          )}
        </div>
      </div>
    </Layout>
  )
}