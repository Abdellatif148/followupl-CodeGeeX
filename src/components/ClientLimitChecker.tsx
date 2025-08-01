import React, { useState, useEffect } from 'react'
import { AlertTriangle, Crown } from 'lucide-react'
import { clientsApi, profilesApi } from '../lib/database'
import { supabase } from '../lib/supabase'

interface ClientLimitCheckerProps {
  onLimitReached: () => void
  children: React.ReactNode
}

export default function ClientLimitChecker({ onLimitReached, children }: ClientLimitCheckerProps) {
  const [clientCount, setClientCount] = useState(0)
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'super_pro'>('free')
  const [showLimitWarning, setShowLimitWarning] = useState(false)

  useEffect(() => {
    checkClientLimit()
  }, [])

  const checkClientLimit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's plan
      const profile = await profilesApi.get(user.id)
      const plan = profile?.plan || 'free'
      setUserPlan(plan)

      // Get client count
      const clients = await clientsApi.getAll(user.id)
      setClientCount(clients.length)

      // Check if approaching limit (free plan = 20 clients)
      if (plan === 'free' && clients.length >= 18) {
        setShowLimitWarning(true)
      }

      // Check if limit reached
      if (plan === 'free' && clients.length >= 20) {
        onLimitReached()
      }
    } catch (error) {
      console.error('Error checking client limit:', error)
    }
  }

  const getClientLimit = () => {
    switch (userPlan) {
      case 'free': return 20
      case 'pro': return 500
      case 'super_pro': return Infinity
      default: return 20
    }
  }

  const isNearLimit = () => {
    const limit = getClientLimit()
    return userPlan === 'free' && clientCount >= limit - 2
  }

  const isAtLimit = () => {
    const limit = getClientLimit()
    return userPlan === 'free' && clientCount >= limit
  }

  return (
    <>
      {children}
      
      {/* Limit Warning Modal */}
      {showLimitWarning && isNearLimit() && !isAtLimit() && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Approaching Client Limit
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You have {clientCount} out of {getClientLimit()} clients on your Free plan. 
              Consider upgrading to Pro for unlimited clients.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLimitWarning(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Continue
              </button>
              <button
                onClick={() => {
                  setShowLimitWarning(false)
                  // Navigate to billing/upgrade page when available
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Limit Reached Modal */}
      {isAtLimit() && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Client Limit Reached
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You've reached the maximum of {getClientLimit()} clients on your Free plan. 
              Upgrade to Pro for unlimited clients and advanced features.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  // Navigate to billing/upgrade page when available
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}