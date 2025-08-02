import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart3, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'

export default function ProgressCharts() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>('free')
  const [isProLocal, setIsProLocal] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('followuply_is_pro')
      return raw ? JSON.parse(raw) === true : false
    } catch {
      return false
    }
  })
  const [chartData, setChartData] = useState<any>(null)

  useEffect(() => {
    const getUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          // Get user profile to check subscription plan
          const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_plan')
            .eq('id', user.id)
            .single()

          if (profile) {
            setSubscriptionPlan(profile.subscription_plan || 'free')
          }

          // Generate mock chart data for demonstration
          // In a real app, this would come from your database
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          const currentMonth = new Date().getMonth()

          const clientData = months.map((month, index) => ({
            name: month,
            clients: index <= currentMonth ? Math.floor(Math.random() * 20) + 5 : 0
          }))

          const revenueData = months.map((month, index) => ({
            name: month,
            revenue: index <= currentMonth ? Math.floor(Math.random() * 5000) + 1000 : 0
          }))

          const invoiceData = months.map((month, index) => ({
            name: month,
            invoices: index <= currentMonth ? Math.floor(Math.random() * 15) + 3 : 0
          }))

          setChartData({
            clients: clientData,
            revenue: revenueData,
            invoices: invoiceData
          })
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setLoading(false)
      }
    }

    getUserData()
  }, [])

  // Simple bar chart component using CSS
  const BarChart = ({ data, title, color }: { data: any[], title: string, color: string }) => {
    const maxValue = Math.max(...data.map((d: any) => d.clients || d.revenue || d.invoices))

    return (
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
        <div className="flex items-center mb-4">
          {title === 'Clients' && <Users className="w-5 h-5 mr-2 text-blue-500" />}
          {title === 'Revenue' && <DollarSign className="w-5 h-5 mr-2 text-green-500" />}
          {title === 'Invoices' && <Calendar className="w-5 h-5 mr-2 text-purple-500" />}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>

        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {title === 'Clients' && `${item.clients} clients`}
                  {title === 'Revenue' && `$${item.revenue}`}
                  {title === 'Invoices' && `${item.invoices} invoices`}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${color}`}
                  style={{ width: `${(item.clients || item.revenue || item.invoices) / maxValue * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Business Progress</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your business growth with detailed analytics and insights
          </p>
        </div>

        {subscriptionPlan === 'free' && !isProLocal ? (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Upgrade to Pro</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Progress charts are a premium feature available only to Pro subscribers.
            </p>
            <button 
              onClick={() => navigate('/upgrade')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
            >
              Upgrade to Pro
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">Total Clients</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                      {chartData ? chartData.clients.reduce((acc: number, curr: any) => acc + curr.clients, 0) : 0}
                    </p>
                  </div>
                  <Users className="w-10 h-10 text-blue-500 dark:text-blue-400" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-400 mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                      ${chartData ? chartData.revenue.reduce((acc: number, curr: any) => acc + curr.revenue, 0).toLocaleString() : 0}
                    </p>
                  </div>
                  <DollarSign className="w-10 h-10 text-green-500 dark:text-green-400" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700 dark:text-purple-400 mb-1">Total Invoices</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                      {chartData ? chartData.invoices.reduce((acc: number, curr: any) => acc + curr.invoices, 0) : 0}
                    </p>
                  </div>
                  <Calendar className="w-10 h-10 text-purple-500 dark:text-purple-400" />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <BarChart 
                data={chartData?.clients || []} 
                title="Clients" 
                color="bg-blue-500" 
              />
              <BarChart 
                data={chartData?.revenue || []} 
                title="Revenue" 
                color="bg-green-500" 
              />
              <BarChart 
                data={chartData?.invoices || []} 
                title="Invoices" 
                color="bg-purple-500" 
              />
            </div>

            {/* Monthly Trend */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center mb-6">
                <TrendingUp className="w-6 h-6 text-blue-500 mr-2" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Monthly Growth Trend</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <div>
                    <p className="text-gray-700 dark:text-gray-300">Client Growth</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Last 6 months</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">+{Math.floor(Math.random() * 40) + 10}%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <div>
                    <p className="text-gray-700 dark:text-gray-300">Revenue Growth</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Last 6 months</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">+{Math.floor(Math.random() * 60) + 15}%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <div>
                    <p className="text-gray-700 dark:text-gray-300">Invoice Growth</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Last 6 months</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">+{Math.floor(Math.random() * 35) + 8}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
