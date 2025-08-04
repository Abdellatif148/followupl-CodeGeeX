import React, { useState, useEffect } from 'react'
import { Crown, Check, Zap, TrendingUp, Users, FileText, Shield, Headphones } from 'lucide-react'
import Layout from '../components/Layout'
import { useAuth } from '../hooks/useAuth'
import { profilesApi } from '../lib/database'

export default function Upgrade() {
  const { user } = useAuth()
  const [currentPlan, setCurrentPlan] = useState<'free' | 'pro' | 'super_pro'>('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserPlan()
  }, [user])

  const loadUserPlan = async () => {
    if (!user) return

    try {
      const profile = await profilesApi.get(user.id)
      setCurrentPlan(profile?.plan || 'free')
    } catch (error) {
      console.error('Error loading user plan:', error)
    } finally {
      setLoading(false)
    }
  }

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        'Up to 20 clients',
        'Basic reminders',
        'Invoice tracking',
        'Email support',
        'Mobile app access'
      ],
      limitations: [
        'Limited to 20 clients',
        'Basic features only',
        'Email support only'
      ],
      buttonText: 'Current Plan',
      buttonDisabled: true,
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$9.99',
      period: 'per month',
      description: 'Best for growing freelancers',
      features: [
        'Unlimited clients',
        'AI-powered reminders',
        'Advanced invoice features',
        'Expense tracking',
        'Progress charts & analytics',
        'Priority email support',
        'Export data (PDF/CSV)',
        'Custom tags & categories'
      ],
      limitations: [],
      buttonText: currentPlan === 'pro' ? 'Current Plan' : 'Upgrade to Pro',
      buttonDisabled: currentPlan === 'pro',
      popular: true
    },
    {
      id: 'super_pro',
      name: 'Super Pro',
      price: '$19.99',
      period: 'per month',
      description: 'For established freelance businesses',
      features: [
        'Everything in Pro',
        'Advanced analytics dashboard',
        'Custom integrations',
        'White-label options',
        'Team collaboration',
        '24/7 phone support',
        'Custom reporting',
        'API access'
      ],
      limitations: [],
      buttonText: currentPlan === 'super_pro' ? 'Current Plan' : 'Upgrade to Super Pro',
      buttonDisabled: currentPlan === 'super_pro',
      popular: false
    }
  ]

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Unlock powerful features to grow your freelance business and never miss a payment again
          </p>
        </div>

        {/* Current Plan Banner */}
        {currentPlan !== 'free' && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white text-center">
            <div className="flex items-center justify-center mb-2">
              <Crown className="w-6 h-6 mr-2" />
              <h3 className="text-lg font-semibold">
                You're on the {currentPlan === 'pro' ? 'Pro' : 'Super Pro'} Plan
              </h3>
            </div>
            <p className="opacity-90">
              Thank you for supporting FollowUply! You have access to all premium features.
            </p>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                plan.popular
                  ? 'border-blue-500 dark:border-blue-400 scale-105'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              } ${currentPlan === plan.id ? 'ring-2 ring-green-500 ring-opacity-50' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              {currentPlan === plan.id && (
                <div className="absolute -top-4 right-4">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                    Current
                  </span>
                </div>
              )}

              <div className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {plan.description}
                  </p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      {plan.period}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Features included:</h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300 text-sm">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  disabled={plan.buttonDisabled}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
                    plan.buttonDisabled
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                      : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Is there a free trial?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                The Free plan is available forever. You can upgrade to Pro or Super Pro anytime to unlock more features.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                We accept all major credit cards, PayPal, and bank transfers for annual plans.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Can I export my data?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Yes, Pro and Super Pro plans include data export in PDF and CSV formats.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}