import React from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import ClientForm from '../components/ClientForm'
import ClientLimitChecker from '../components/ClientLimitChecker'

export default function AddClient() {
  const navigate = useNavigate()

  const handleSuccess = () => {
    navigate('/clients')
  }

  const handleCancel = () => {
    navigate('/clients')
  }

  const handleLimitReached = () => {
    // User has reached client limit, redirect back to clients page
    navigate('/clients')
  }

  return (
    <Layout>
      <ClientLimitChecker onLimitReached={handleLimitReached}>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Client</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Add a new client to start tracking your freelance relationships
            </p>
          </div>

          <ClientForm onSuccess={handleSuccess} onCancel={handleCancel} />
        </div>
      </ClientLimitChecker>
    </Layout>
  )
}