import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  Users, Bell, FileText, DollarSign, TrendingUp, Clock,
  Plus, ArrowRight, AlertTriangle, CheckCircle
} from 'lucide-react'
import Layout from '../components/Layout'
import { dashboardApi } from '../lib/database'
import { useAuth } from '../hooks/useAuth'
import { useCurrency } from '../hooks/useCurrency'
import { handleSupabaseError, showErrorToast } from '../utils/errorHandler'
import { formatDate } from '../utils/dateHelpers'
import Modal from '../components/Modal' // Assuming a reusable Modal component exists

interface DashboardStats {
  activeClients: number
  pendingReminders: number
  pendingInvoicesCount: number
  overdueInvoicesCount: number
  totalPendingAmount: number
  totalOverdueAmount: number
  recentClients: any[]
  upcomingReminders: any[]
  recentInvoices: any[]
  totalMonthlyExpenses: number
  topExpenseCategory: any
  recentExpenses: any[]
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { formatCurrency } = useCurrency()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const loadDashboard = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      
      try {
        const dashboardStats = await dashboardApi.getStats(user.id)
        setStats(dashboardStats)
      } catch (error) {
        console.error('Error loading dashboard:', error)
        const appError = handleSupabaseError(error)
        showErrorToast(appError.message)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [user])

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  const handleAddClick = () => {
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
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
              {t('dashboard.welcome', { name: userName })}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('dashboard.subtitle')}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={handleAddClick}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t('dashboard.addClient')}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.activeClients')}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.activeClients || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/clients" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center">
                View all clients <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-orange-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.pendingReminders')}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.pendingReminders || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/reminders" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center">
                View reminders <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.pendingInvoices')}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.totalPendingAmount || 0)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/invoices" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center">
                View invoices <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-red-50 dark:from-gray-800 dark:to-red-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.overdueAmount')}</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{formatCurrency(stats?.totalOverdueAmount || 0)}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/invoices?filter=overdue" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center">
                View overdue <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Reminders */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('dashboard.upcomingReminders')}</h2>
              <Link to="/reminders" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {stats?.upcomingReminders?.length ? (
                stats.upcomingReminders.slice(0, 5).map((reminder: any) => (
                  <div key={reminder.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        reminder.priority === 'urgent' ? 'bg-red-500' :
                        reminder.priority === 'high' ? 'bg-orange-500' :
                        reminder.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{reminder.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {reminder.clients?.name} • {formatDate(reminder.due_date || reminder.datetime)}
                        </p>
                      </div>
                    </div>
                    <Clock className="w-5 h-5 text-gray-400" />
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('dashboard.noReminders')}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first reminder to stay on top of follow-ups</p>
                  <Link to="/reminders" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('dashboard.addReminder')}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('dashboard.recentInvoices')}</h2>
              <Link to="/invoices" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {stats?.recentInvoices?.length ? (
                stats.recentInvoices.slice(0, 5).map((invoice: any) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        invoice.status === 'paid' ? 'bg-green-500' :
                        invoice.status === 'overdue' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{invoice.title || invoice.project}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {invoice.clients?.name} • Due {formatDate(invoice.due_date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(invoice.amount, invoice.currency)}</p>
                      <p className={`text-sm capitalize ${
                        invoice.status === 'paid' ? 'text-green-600 dark:text-green-400' :
                        invoice.status === 'overdue' ? 'text-red-600 dark:text-red-400' :
                        'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {invoice.status}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('dashboard.noInvoices')}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first invoice to start tracking payments</p>
                  <Link to="/invoices" className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('dashboard.createInvoice')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Expenses Summary */}
        {stats?.totalMonthlyExpenses && stats.totalMonthlyExpenses > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Monthly Expenses</h2>
              <Link to="/expenses" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">This Month</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                      {formatCurrency(stats.totalMonthlyExpenses)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              {stats.topExpenseCategory && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Top Category</p>
                      <p className="text-lg font-bold text-indigo-900 dark:text-indigo-300">
                        {stats.topExpenseCategory.category}
                      </p>
                      <p className="text-sm text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(stats.topExpenseCategory.amount)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isModalOpen && (
          <Modal onClose={closeModal}>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Add New</h2>
              <div className="flex flex-col space-y-4">
                <button
                  onClick={() => {
                    closeModal()
                    navigate('/projects/add')
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add New Project
                </button>
                <button
                  onClick={() => {
                    closeModal()
                    navigate('/users/add')
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add New User
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  )
}