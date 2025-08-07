import React, { useState, useEffect } from 'react'
import { Crown, Users, ArrowRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { clientsApi } from '../lib/database'
import { supabase } from '../lib/supabase'
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

  useEffect(() => {
    loadClientCount()
  }, [user])

  const loadClientCount = async () => {
    try {
      if (user) {
        const clients = await clientsApi.getAll(user.id)
        setClientCount(clients.length)
      }
    } catch (error) {
      console.error('Error loading client count:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    )
  }

  const currentPlan = profile?.plan || 'free'
  const limit = PLAN_LIMITS[currentPlan].clients
  const hasReachedLimit = limit !== Infinity && clientCount >= limit

  if (hasReachedLimit) {
    // Call the callback if provided
    if (onLimitReached) {
      onLimitReached()
    }

    return (
      <div className="p-6">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Crown className="w-10 h-10 text-purple-600 dark:text-purple-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Client Limit Reached
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            You've reached the limit of {limit} clients on the {currentPlan} plan. 
            Upgrade to Pro to add unlimited clients and unlock advanced features.
          </p>

          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <Users className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
              <span className="text-gray-700 dark:text-gray-300">
                {clientCount} / {limit} clients used
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/upgrade"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Crown className="w-5 h-5 mr-2" />
              Upgrade to Pro
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            
            <Link
              to="/clients"
              className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Back to Clients
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}