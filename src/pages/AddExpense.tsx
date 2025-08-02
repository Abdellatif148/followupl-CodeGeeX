import React from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import ExpenseForm from '../components/ExpenseForm'

export default function AddExpense() {
  const navigate = useNavigate()

  const handleSuccess = () => {
    navigate('/expenses')
  }

  const handleCancel = () => {
    navigate('/expenses')
  }

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Expense</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track a new business expense
          </p>
        </div>

        <ExpenseForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </Layout>
  )
}