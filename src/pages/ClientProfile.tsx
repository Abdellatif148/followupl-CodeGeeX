import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
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
import Modal from '../components/Modal'

interface ClientProfile {
  id: string
  name: string
  email: string
  phone: string
  tag: string
  totalPaid: number
  totalUnpaid: number
  totalProjects: number
  totalInvoices: number
}

export default function ClientProfile() {
  const { clientId } = useParams<{ clientId: string }>()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [client, setClient] = useState<ClientProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const { formatCurrency } = useCurrency()
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const loadClientProfile = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const clientData = await dashboardApi.getClientProfile(clientId)
        setClient(clientData)
      } catch (error) {
        console.error('Error loading client profile:', error)
        const appError = handleSupabaseError(error)
        showErrorToast(appError.message)
      } finally {
        setLoading(false)
      }
    }

    loadClientProfile()
  }, [user, clientId])

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

  if (!client) {
    return (
      <Layout>
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('clientProfile.notFound')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t('clientProfile.notFoundDescription')}
          </p>
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
              {client.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('clientProfile.subtitle')}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
            >
              <Plus className="w-4 h-4 mr-1" />
              {t('clientProfile.addProject')}
            </button>
          </div>
        </div>

        {/* Client Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {t('clientProfile.clientDetails')}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-900 dark:text-white font-medium">
                  {client.name}
                </span>
              </div>
              {client.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white font-medium">
                    {client.email}
                  </span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white font-medium">
                    {client.phone}
                  </span>
                </div>
              )}
              {client.tag && (
                <div className="flex items-center space-x-3">
                  <Tag className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white font-medium">
                    {client.tag}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {t('clientProfile.financialOverview')}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('clientProfile.totalPaid')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(client.totalPaid)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('clientProfile.totalUnpaid')}
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(client.totalUnpaid)}
                </p>
              </div>
            </div>
          </div>

          {/* Activity Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {t('clientProfile.activitySummary')}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('clientProfile.totalProjects')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {client.totalProjects}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('clientProfile.totalInvoices')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {client.totalInvoices}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Projects and Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projects */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('clientProfile.projects')}
              </h2>
              <Link to={`/projects?clientId=${client.id}`} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                {t('clientProfile.viewAll')}
              </Link>
            </div>
            {/* Display client projects here */}
          </div>

          {/* Invoices */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('clientProfile.invoices')}
              </h2>
              <Link to={`/invoices?clientId=${client.id}`} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                {t('clientProfile.viewAll')}
              </Link>
            </div>
            {/* Display client invoices here */}
          </div>
        </div>
      </div>
    </Layout>
  )
}
