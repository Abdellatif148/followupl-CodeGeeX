import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Crown, Check, Star, Zap, Shield, BarChart3, Headphones } from 'lucide-react'
import Layout from '../components/Layout'
import { useAuth } from '../hooks/useAuth'
import { PRICING } from '../lib/constants'

export default function Upgrade() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const features = {
    free: [
      'Up to 20 clients',
      'Basic reminders',
      'Invoice tracking',
      'Expense tracking',
      'Email support'
    ],
    pro: [
      'Unlimited clients',
      'AI-powered reminders',
      'Advanced analytics',
      'Progress charts',
      'Priority support',
      'Custom branding',
      'Export data',
      'Advanced filters'
    ]
  }

  const handleUpgrade = async () => {
    setIsLoading(true)
    
    // In a real app, this would integrate with Stripe or another payment processor
    // For now, we'll simulate the upgrade process
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Here you would:
      // 1. Create Stripe checkout session
      // 2. Handle payment confirmation
      // 3. Update user's plan in database
      
      alert('Upgrade functionality would be implemented with Stripe integration')
      
    } catch (error) {
      console.error('Upgrade error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Crown className="w-10 h-10 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Upgrade to Pro
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Unlock advanced features and take your freelance business to the next level
          </p>
        </div>

        {/* Current Plan */}
        {profile && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300">
                  Current Plan: {profile.plan === 'free' ? 'Free' : 'Pro'}
                </h3>
                <p className="text-blue-700 dark:text-blue-400">
                  {profile.plan === 'free' 
                    ? 'You\'re currently on the free plan'
                    : 'Thank you for being a Pro subscriber!'
                  }
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                  {profile.plan === 'free' ? '$0' : '$2.99'}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400">per month</p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Free Plan */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free</h3>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">$0</div>
              <p className="text-gray-600 dark:text-gray-400">Forever free</p>
            </div>

            <ul className="space-y-4 mb-8">
              {features.free.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              disabled={profile?.plan === 'free'}
              className="w-full py-3 px-6 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {profile?.plan === 'free' ? 'Current Plan' : 'Downgrade to Free'}
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-2xl p-8 relative">
            {/* Popular badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-medium flex items-center">
                <Star className="w-4 h-4 mr-1" />
                Most Popular
              </div>
            </div>

            <div className="text-center mb-8 mt-4">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pro</h3>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                ${PRICING.pro.monthly}
              </div>
              <p className="text-gray-600 dark:text-gray-400">per month</p>
            </div>

            <ul className="space-y-4 mb-8">
              {features.pro.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={isLoading || profile?.plan !== 'free'}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : profile?.plan === 'free' ? (
                <>
                  <Crown className="w-5 h-5 mr-2" />
                  Upgrade to Pro
                </>
              ) : (
                'Current Plan'
              )}
            </button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              AI-Powered Reminders
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Smart notifications that learn from your patterns and suggest optimal follow-up times
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Advanced Analytics
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Detailed insights into your business performance with interactive charts and reports
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Headphones className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Priority Support
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Get faster response times and dedicated support from our team
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, you can cancel your Pro subscription at any time. You'll continue to have access to Pro features until the end of your billing period.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                What happens to my data if I downgrade?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your data is always safe. If you downgrade, you'll lose access to Pro features but all your data remains intact.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                The free plan gives you access to core features forever. You can upgrade to Pro anytime to unlock advanced features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}