import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, CreditCard, ArrowLeft, Loader2 } from 'lucide-react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'

export default function Upgrade() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()
  }, [])

  const handleUpgrade = async () => {
    setLoading(true)
    setError(null)

    try {
      // In a real implementation, this would integrate with a payment processor
      // For now, we'll simulate the upgrade process

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Update user profile to indicate Pro subscription
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ subscription_plan: 'pro' })
          .eq('id', user.id)

        if (error) throw error
      }

      setSuccess(true)
    } catch (err) {
      console.error('Upgrade error:', err)
      setError('Failed to process upgrade. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <button 
          onClick={() => navigate('/settings')}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Settings
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Upgrade to Pro</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Unlock premium features and take your business to the next level
            </p>
          </div>

          {success ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Upgrade Successful!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Thank you for upgrading to Pro! You now have access to all premium features.
              </p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {/* Feature 1 */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                    <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Unlimited Clients</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Add as many clients as you need without any limitations
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                    <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Progress Charts</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Visualize your business growth with interactive charts and graphs
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                    <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Priority Support</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Get help faster with our priority customer support
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-8 mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-300 mb-2">Pro Plan</h3>
                    <p className="text-purple-700 dark:text-purple-400 mb-4">Billed monthly at $9.99/month</p>
                    <ul className="space-y-2">
                      <li className="flex items-center text-purple-800 dark:text-purple-300">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        Unlimited clients
                      </li>
                      <li className="flex items-center text-purple-800 dark:text-purple-300">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        Advanced reminders
                      </li>
                      <li className="flex items-center text-purple-800 dark:text-purple-300">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        Custom invoices
                      </li>
                      <li className="flex items-center text-purple-800 dark:text-purple-300">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        Progress chart graphs
                      </li>
                      <li className="flex items-center text-purple-800 dark:text-purple-300">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        Priority support
                      </li>
                    </ul>
                  </div>
                  <div className="mt-6 md:mt-0 text-center">
                    <div className="text-4xl font-bold text-purple-900 dark:text-purple-300 mb-2">
                      $9.99<span className="text-lg font-normal text-purple-700 dark:text-purple-400">/month</span>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <div className="flex justify-center">
                <button 
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Upgrade Now - $9.99/month'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}