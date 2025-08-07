import React, { useState, useEffect } from 'react'
import { Crown, Users, AlertTriangle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { clientsApi } from '../lib/database'
import { PLAN_LIMITS } from '../lib/constants'
import { Link } from 'react-router-dom'

interface ClientLimitCheckerProps {
  children: React.ReactNode
  onLimitReached?: () => void
}

export default function ClientLimitChecker({ children, onLimitReached }: ClientLimitCheckerProps) {
  const { user, profile } = useAuth()
  const [clientCount, setClientCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showLimitWarning, setShowLimitWarning] = useState(false)

  useEffect(() => {
    if (user) {
      loadClientCount()
    }
  }, [user])

  const loadClientCount = async () => {
    if (!user) return

    try {
      const clients = await clientsApi.getAll(user.id)
      setClientCount(clients.length)
      
      const userPlan = profile?.plan || 'free'
      const limit = PLAN_LIMITS[userPlan].clients
      
      if (limit !== Infinity && clients.length >= limit) {
        setShowLimitWarning(true)
        onLimitReached?.()
      }
    } catch (error) {
      console.error('Error loading client count:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const userPlan = profile?.plan || 'free'
  const limit = PLAN_LIMITS[userPlan].clients
  const isAtLimit = limit !== Infinity && clientCount >= limit

  if (isAtLimit && showLimitWarning) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-orange-600 dark:text-orange-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Client Limit Reached
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You've reached the maximum of {limit} clients on your {userPlan} plan. 
            Upgrade to Pro to add unlimited clients and unlock advanced features.
          </p>

          <div className="flex items-center justify-center space-x-2 mb-6 text-sm text-gray-500 dark:text-gray-400">
            <Users className="w-4 h-4" />
            <span>{clientCount} / {limit} clients used</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/upgrade"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
            >
              <Crown className="w-5 h-5 mr-2" />
              Upgrade to Pro - $2.99/month
            </Link>
            <button
              onClick={() => setShowLimitWarning(false)}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}