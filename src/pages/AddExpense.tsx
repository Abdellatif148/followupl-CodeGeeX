import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import Layout from '../components/Layout'
import ExpenseForm from '../components/ExpenseForm'
import { showSuccessToast } from '../utils/errorHandler'

export default function AddExpense() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleSuccess = () => {
    showSuccessToast('Expense added successfully')
    navigate('/expenses')
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
            {t('expenses.addExpense', 'Add Expense')}
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <ExpenseForm onSuccess={handleSuccess} onCancel={() => navigate('/expenses')} />
        </div>
      </div>
    </Layout>
  )
}