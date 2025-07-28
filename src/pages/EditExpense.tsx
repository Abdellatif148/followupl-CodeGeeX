import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import Layout from '../components/Layout'
import ExpenseForm from '../components/ExpenseForm'
import { expensesApi } from '../lib/database'
import { handleSupabaseError, showErrorToast } from '../utils/errorHandler'
import { Expense } from '../types/database'

export default function EditExpense() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [expense, setExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadExpense = async () => {
      if (!id) {
        setError('No expense ID provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const expenseData = await expensesApi.getById(id)
        setExpense(expenseData)
      } catch (err) {
        console.error('Error loading expense:', err)
        const appError = handleSupabaseError(err)
        showErrorToast(appError.message)
      } finally {
        setLoading(false)
      }
    }

    loadExpense()
  }, [id])

  const handleSuccess = () => {
    navigate('/expenses')
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !id) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-400 mb-2">
              {t('common.error', 'Error')}
            </h2>
            <p className="text-red-600 dark:text-red-300">
              {error || t('expenses.noIdProvided', 'No expense ID provided')}
            </p>
            <button
              onClick={() => navigate('/expenses')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              {t('common.backToList', 'Back to List')}
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/expenses')}
            className="mr-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('expenses.editExpense', 'Edit Expense')}
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <ExpenseForm 
            expenseId={id} 
            onSuccess={handleSuccess} 
            onCancel={() => navigate('/expenses')} 
          />
        </div>
      </div>
    </Layout>
  )
}