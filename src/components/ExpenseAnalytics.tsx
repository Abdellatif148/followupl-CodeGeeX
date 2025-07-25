import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { PieChart, BarChart, Calendar, DollarSign } from 'lucide-react'
import { expensesApi } from '../lib/database'
import { supabase } from '../lib/supabase'
import { useCurrency } from '../hooks/useCurrency'

interface ExpenseAnalyticsProps {
  userId: string
  period?: 'month' | 'quarter' | 'year'
  year?: number
  month?: number
}

interface CategoryTotal {
  category: string
  total: number
}

interface ClientTotal {
  client_id: string
  client_name: string
  total: number
}

interface MonthlyTotal {
  month: number
  total: number
}

export default function ExpenseAnalytics({ 
  userId, 
  period = 'month', 
  year = new Date().getFullYear(), 
  month = new Date().getMonth() + 1 
}: ExpenseAnalyticsProps) {
  const { t } = useTranslation()
  const { formatCurrency } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([])
  const [clientTotals, setClientTotals] = useState<ClientTotal[]>([])
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([])
  const [activeTab, setActiveTab] = useState<'category' | 'client' | 'time'>('category')
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [taxDeductibleTotal, setTaxDeductibleTotal] = useState(0)

  // Categories for display
  const categories = [
    { value: 'office_supplies', label: t('expenses.categories.officeSupplies', 'Office Supplies'), color: '#3B82F6' },
    { value: 'travel', label: t('expenses.categories.travel', 'Travel'), color: '#10B981' },
    { value: 'meals', label: t('expenses.categories.meals', 'Meals & Entertainment'), color: '#F59E0B' },
    { value: 'software', label: t('expenses.categories.software', 'Software & Subscriptions'), color: '#6366F1' },
    { value: 'hardware', label: t('expenses.categories.hardware', 'Hardware & Equipment'), color: '#EC4899' },
    { value: 'marketing', label: t('expenses.categories.marketing', 'Marketing & Advertising'), color: '#8B5CF6' },
    { value: 'professional_services', label: t('expenses.categories.professionalServices', 'Professional Services'), color: '#14B8A6' },
    { value: 'rent', label: t('expenses.categories.rent', 'Rent & Utilities'), color: '#F97316' },
    { value: 'fees', label: t('expenses.categories.fees', 'Fees & Licenses'), color: '#06B6D4' },
    { value: 'other', label: t('expenses.categories.other', 'Other'), color: '#6B7280' }
  ]

  // Month names
  const monthNames = [
    t('common.months.january', 'January'),
    t('common.months.february', 'February'),
    t('common.months.march', 'March'),
    t('common.months.april', 'April'),
    t('common.months.may', 'May'),
    t('common.months.june', 'June'),
    t('common.months.july', 'July'),
    t('common.months.august', 'August'),
    t('common.months.september', 'September'),
    t('common.months.october', 'October'),
    t('common.months.november', 'November'),
    t('common.months.december', 'December')
  ]

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!userId) return

      try {
        setLoading(true)

        // Calculate date range based on period
        const now = new Date()
        let startDate: string
        let endDate: string = now.toISOString()

        if (period === 'month') {
          const start = new Date(year, month - 1, 1)
          const end = new Date(year, month, 0)
          startDate = start.toISOString()
          endDate = end.toISOString()
        } else if (period === 'quarter') {
          const currentQuarter = Math.floor((now.getMonth() / 3))
          const start = new Date(year, currentQuarter * 3, 1)
          const end = new Date(year, (currentQuarter + 1) * 3, 0)
          startDate = start.toISOString()
          endDate = end.toISOString()
        } else {
          // year
          const start = new Date(year, 0, 1)
          const end = new Date(year, 11, 31)
          startDate = start.toISOString()
          endDate = end.toISOString()
        }

        // Fetch data
        const [byCategory, byClient, monthlyData, allExpenses] = await Promise.all([
          expensesApi.getByCategory(userId, startDate, endDate),
          expensesApi.getByClient(userId, startDate, endDate),
          expensesApi.getMonthlyTotals(userId, year),
          expensesApi.getAll(userId)
        ])

        setCategoryTotals(byCategory)
        setClientTotals(byClient)
        setMonthlyTotals(monthlyData)

        // Calculate totals
        const filteredExpenses = allExpenses.filter(exp => 
          new Date(exp.expense_date) >= new Date(startDate) && 
          new Date(exp.expense_date) <= new Date(endDate)
        )
        
        const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)
        setTotalExpenses(total)
        
        const taxDeductible = filteredExpenses
          .filter(exp => exp.tax_deductible)
          .reduce((sum, exp) => sum + exp.amount, 0)
        setTaxDeductibleTotal(taxDeductible)
      } catch (error) {
        console.error('Error loading analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [userId, period, year, month])

  const getCategoryLabel = (categoryValue: string) => {
    const category = categories.find(cat => cat.value === categoryValue)
    return category ? category.label : categoryValue
  }

  const getCategoryColor = (categoryValue: string) => {
    const category = categories.find(cat => cat.value === categoryValue)
    return category ? category.color : '#6B7280'
  }

  // Find the highest value for scaling
  const maxCategoryValue = Math.max(...categoryTotals.map(cat => cat.total), 1)
  const maxClientValue = Math.max(...clientTotals.map(client => client.total), 1)
  const maxMonthlyValue = Math.max(...monthlyTotals.map(month => month.total), 1)

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('expenses.analytics.totalExpenses', 'Total Expenses')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('expenses.analytics.taxDeductible', 'Tax Deductible')}
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {formatCurrency(taxDeductibleTotal)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('expenses.analytics.topCategory', 'Top Category')}
              </p>
              {categoryTotals.length > 0 ? (
                <>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {getCategoryLabel(categoryTotals[0].category)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatCurrency(categoryTotals[0].total)}
                  </p>
                </>
              ) : (
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                  {t('expenses.analytics.noData', 'No data')}
                </p>
              )}
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <PieChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('category')}
            className={`py-2 px-1 text-sm font-medium border-b-2 ${
              activeTab === 'category'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {t('expenses.analytics.byCategory', 'By Category')}
          </button>
          <button
            onClick={() => setActiveTab('client')}
            className={`py-2 px-1 text-sm font-medium border-b-2 ${
              activeTab === 'client'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {t('expenses.analytics.byClient', 'By Client')}
          </button>
          <button
            onClick={() => setActiveTab('time')}
            className={`py-2 px-1 text-sm font-medium border-b-2 ${
              activeTab === 'time'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {t('expenses.analytics.byTime', 'By Time')}
          </button>
        </nav>
      </div>

      {/* Charts */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        {activeTab === 'category' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('expenses.analytics.expensesByCategory', 'Expenses by Category')}
            </h3>
            {categoryTotals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {t('expenses.analytics.noData', 'No data available for the selected period')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {categoryTotals.map(category => (
                  <div key={category.category} className="flex items-center">
                    <div className="w-32 truncate text-sm text-gray-700 dark:text-gray-300">
                      {getCategoryLabel(category.category)}
                    </div>
                    <div className="flex-1 ml-2">
                      <div className="relative h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full rounded-lg"
                          style={{ 
                            width: `${(category.total / maxCategoryValue) * 100}%`,
                            backgroundColor: getCategoryColor(category.category)
                          }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-end px-3">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(category.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'client' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('expenses.analytics.expensesByClient', 'Expenses by Client')}
            </h3>
            {clientTotals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {t('expenses.analytics.noClientData', 'No client-associated expenses for the selected period')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {clientTotals.map(client => (
                  <div key={client.client_id} className="flex items-center">
                    <div className="w-32 truncate text-sm text-gray-700 dark:text-gray-300">
                      {client.client_name}
                    </div>
                    <div className="flex-1 ml-2">
                      <div className="relative h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-blue-500 dark:bg-blue-600 rounded-lg"
                          style={{ width: `${(client.total / maxClientValue) * 100}%` }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-end px-3">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(client.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'time' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('expenses.analytics.expensesByMonth', 'Monthly Expenses')}
            </h3>
            {monthlyTotals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {t('expenses.analytics.noData', 'No data available for the selected period')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {monthlyTotals.map(monthData => (
                  <div key={monthData.month} className="flex items-center">
                    <div className="w-32 truncate text-sm text-gray-700 dark:text-gray-300">
                      {monthNames[monthData.month - 1]}
                    </div>
                    <div className="flex-1 ml-2">
                      <div className="relative h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-green-500 dark:bg-green-600 rounded-lg"
                          style={{ width: `${(monthData.total / maxMonthlyValue) * 100}%` }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-end px-3">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(monthData.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}