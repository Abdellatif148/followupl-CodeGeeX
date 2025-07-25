import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Calendar, Download, Filter, ArrowLeft } from 'lucide-react'
import Layout from '../components/Layout'
import ExpenseAnalytics from '../components/ExpenseAnalytics'
import { supabase } from '../lib/supabase'
import { expensesApi } from '../lib/database'
import { useCurrency } from '../hooks/useCurrency'

export default function ExpenseReports() {
  const { t } = useTranslation()
  const { formatCurrency } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [expenses, setExpenses] = useState<any[]>([])

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          const expensesData = await expensesApi.getAll(user.id)
          setExpenses(expensesData)
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriod(e.target.value as 'month' | 'quarter' | 'year')
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(parseInt(e.target.value))
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonth(parseInt(e.target.value))
  }

  const exportReport = () => {
    // Filter expenses based on selected period
    let filteredExpenses = [...expenses]
    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    if (period === 'month') {
      startDate = new Date(year, month - 1, 1)
      endDate = new Date(year, month, 0)
    } else if (period === 'quarter') {
      const currentQuarter = Math.floor((now.getMonth() / 3))
      startDate = new Date(year, currentQuarter * 3, 1)
      endDate = new Date(year, (currentQuarter + 1) * 3, 0)
    } else {
      // year
      startDate = new Date(year, 0, 1)
      endDate = new Date(year, 11, 31)
    }

    filteredExpenses = expenses.filter(exp => 
      new Date(exp.expense_date) >= startDate && 
      new Date(exp.expense_date) <= endDate
    )

    // Create CSV content
    const headers = [
      'Title',
      'Description',
      'Amount',
      'Currency',
      'Category',
      'Date',
      'Client',
      'Payment Method',
      'Tax Deductible',
      'Status'
    ]
    
    const csvData = filteredExpenses.map(expense => [
      expense.title,
      expense.description || '',
      expense.amount,
      expense.currency,
      expense.category,
      new Date(expense.expense_date).toLocaleDateString(),
      expense.clients?.name || '',
      expense.payment_method || '',
      expense.tax_deductible ? 'Yes' : 'No',
      expense.status
    ])
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    // Create filename based on period
    let filename = 'expense_report_'
    if (period === 'month') {
      filename += `${year}_${month.toString().padStart(2, '0')}`
    } else if (period === 'quarter') {
      const quarter = Math.floor((month - 1) / 3) + 1
      filename += `${year}_Q${quarter}`
    } else {
      filename += year
    }
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Get period label for display
  const getPeriodLabel = () => {
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

    if (period === 'month') {
      return `${monthNames[month - 1]} ${year}`
    } else if (period === 'quarter') {
      const quarter = Math.floor((month - 1) / 3) + 1
      return `Q${quarter} ${year}`
    } else {
      return `${year}`
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
            <div className="flex items-center mb-2">
              <Link
                to="/expenses"
                className="inline-flex items-center mr-3 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                <span>{t('common.back', 'Back')}</span>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('expenses.reports.title', 'Expense Reports')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('expenses.reports.subtitle', 'Analyze and export your expense data')}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Link
              to="/expenses/add"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <Calendar className="w-5 h-5 mr-2" />
              {t('expenses.addExpense', 'Add Expense')}
            </Link>
            <button
              onClick={exportReport}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Download className="w-5 h-5 mr-2" />
              {t('expenses.reports.export', 'Export Report')}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('expenses.reports.period', 'Report Period')}
              </label>
              <select
                value={period}
                onChange={handlePeriodChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="month">{t('expenses.reports.monthly', 'Monthly')}</option>
                <option value="quarter">{t('expenses.reports.quarterly', 'Quarterly')}</option>
                <option value="year">{t('expenses.reports.yearly', 'Yearly')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('expenses.reports.year', 'Year')}
              </label>
              <select
                value={year}
                onChange={handleYearChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {[...Array(5)].map((_, i) => {
                  const yearValue = new Date().getFullYear() - 2 + i
                  return (
                    <option key={yearValue} value={yearValue}>
                      {yearValue}
                    </option>
                  )
                })}
              </select>
            </div>

            {period === 'month' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('expenses.reports.month', 'Month')}
                </label>
                <select
                  value={month}
                  onChange={handleMonthChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {t(`common.months.${i}`, new Date(2000, i, 1).toLocaleString('default', { month: 'long' }))}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center self-end">
              <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">{getPeriodLabel()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          {user && (
            <ExpenseAnalytics 
              userId={user.id} 
              period={period} 
              year={year} 
              month={month} 
            />
          )}
        </div>

        {/* Tax Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t('expenses.reports.taxSummary', 'Tax Deduction Summary')}
          </h2>
          
          {expenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                {t('expenses.reports.noData', 'No expense data available')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {t('expenses.reports.totalTaxDeductible', 'Total Tax Deductible Expenses')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('expenses.reports.forPeriod', 'For period')}: {getPeriodLabel()}
                  </p>
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(
                    expenses
                      .filter(exp => {
                        const expDate = new Date(exp.expense_date)
                        if (period === 'month') {
                          return expDate.getMonth() + 1 === month && expDate.getFullYear() === year && exp.tax_deductible
                        } else if (period === 'quarter') {
                          const expQuarter = Math.floor(expDate.getMonth() / 3) + 1
                          const selectedQuarter = Math.floor((month - 1) / 3) + 1
                          return expQuarter === selectedQuarter && expDate.getFullYear() === year && exp.tax_deductible
                        } else {
                          return expDate.getFullYear() === year && exp.tax_deductible
                        }
                      })
                      .reduce((sum, exp) => sum + exp.amount, 0)
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  {t('expenses.reports.taxDeductibleByCategory', 'Tax Deductible Expenses by Category')}
                </h3>
                <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('expenses.reports.category', 'Category')}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('expenses.reports.amount', 'Amount')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {Object.entries(
                        expenses
                          .filter(exp => {
                            const expDate = new Date(exp.expense_date)
                            if (period === 'month') {
                              return expDate.getMonth() + 1 === month && expDate.getFullYear() === year && exp.tax_deductible
                            } else if (period === 'quarter') {
                              const expQuarter = Math.floor(expDate.getMonth() / 3) + 1
                              const selectedQuarter = Math.floor((month - 1) / 3) + 1
                              return expQuarter === selectedQuarter && expDate.getFullYear() === year && exp.tax_deductible
                            } else {
                              return expDate.getFullYear() === year && exp.tax_deductible
                            }
                          })
                          .reduce((acc, exp) => {
                            const category = exp.category
                            if (!acc[category]) {
                              acc[category] = 0
                            }
                            acc[category] += exp.amount
                            return acc
                          }, {} as Record<string, number>)
                      ).map(([category, amount]) => (
                        <tr key={category}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                            {formatCurrency(amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}