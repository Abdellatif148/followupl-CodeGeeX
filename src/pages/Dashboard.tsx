import React, { useState, useEffect } from 'react'
import { Plus, Users, Clock, DollarSign, AlertTriangle, TrendingUp, Calendar, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'
import { dashboardApi } from '../lib/database'
import { supabase } from '../lib/supabase'
import { useCurrency } from '../hooks/useCurrency'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { formatDate, isOverdue } from '../utils/dateHelpers'

interface DashboardStats {
  activeClients: number
  pendingReminders: number
  pendingInvoicesCount: number
  overdueInvoicesCount: number
  totalPendingAmount: number
  totalOverdueAmount: number
  totalExpenses: number
  totalRevenue: number
  recentClients: any[]
  upcomingReminders: any[]
  recentInvoices: any[]
  recentExpenses: any[]
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const { formatCurrency } = useCurrency()
  const { error } = useToast()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const dashboardStats = await dashboardApi.getStats(user.id)
        setStats(dashboardStats)
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const userName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <LoadingSpinner text="Loading dashboard..." />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {getGreeting()}, {userName}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening with your freelance business today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">Active Clients</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                  {stats?.activeClients || 0}
                </p>
              </div>
              <Users className="w-10 h-10 text-blue-500 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-1">Pending Reminders</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
                  {stats?.pendingReminders || 0}
                </p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500 dark:text-yellow-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-400 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 dark:text-red-400 mb-1">Overdue Amount</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-300">
                  {formatCurrency(stats?.totalOverdueAmount || 0)}
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-500 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/clients/add"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 group"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Client</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Track a new client</p>
              </div>
            </div>
          </Link>

          <Link
            to="/reminders"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 group"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Reminder</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Set a follow-up</p>
              </div>
            </div>
          </Link>

          <Link
            to="/invoices"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 group"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Invoice</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Track payments</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Reminders */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upcoming Reminders</h2>
              <Link
                to="/reminders"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
              >
                View all
              </Link>
            </div>

            {stats?.upcomingReminders && stats.upcomingReminders.length > 0 ? (
              <div className="space-y-4">
                {stats.upcomingReminders.slice(0, 5).map((reminder: any) => (
                  <div key={reminder.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{reminder.title}</h4>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span className={isOverdue(reminder.due_date) ? 'text-red-600 dark:text-red-400' : ''}>
                          {formatDate(reminder.due_date)}
                        </span>
                        {reminder.clients && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{reminder.clients.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={reminder.status} type="reminder" size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No upcoming reminders</p>
              </div>
            )}
          </div>

          {/* Recent Invoices */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Invoices</h2>
              <Link
                to="/invoices"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
              >
                View all
              </Link>
            </div>

            {stats?.recentInvoices && stats.recentInvoices.length > 0 ? (
              <div className="space-y-4">
                {stats.recentInvoices.slice(0, 5).map((invoice: any) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {invoice.clients?.name || 'Unknown Client'}
                      </h4>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span>{formatCurrency(invoice.amount, invoice.currency)}</span>
                        <span className="mx-2">•</span>
                        <span className={isOverdue(invoice.due_date) && ['unpaid', 'pending'].includes(invoice.status) ? 'text-red-600 dark:text-red-400' : ''}>
                          Due {formatDate(invoice.due_date)}
                        </span>
                      </div>
                    </div>
                    <StatusBadge 
                      status={
                        ['unpaid', 'pending'].includes(invoice.status) && isOverdue(invoice.due_date)
                          ? 'overdue'
                          : invoice.status
                      } 
                      type="invoice" 
                      size="sm" 
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No invoices yet</p>
                <Link
                  to="/invoices"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium mt-2 inline-block"
                >
                  Create your first invoice
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}