import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  User, Globe, Palette, CreditCard, Save, Loader2, 
  CheckCircle, AlertCircle, Crown, ArrowLeft, Trash2, AlertTriangle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useDarkMode } from '../hooks/useDarkMode'
import { profilesApi, currencyUtils } from '../lib/database'
import LanguageSwitcher from '../components/LanguageSwitcher'

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  currency: string
  timezone: string
  language: string
  plan: string
}

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { user, refreshProfile } = useAuth()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    currency: 'USD',
    timezone: 'UTC',
    language: 'en'
  })

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const fetchProfile = async () => {
    try {
      if (!user) return

      const profileData = await profilesApi.get(user.id)
      
      if (profileData) {
        setProfile(profileData)
        setFormData({
          full_name: profileData.full_name || '',
          currency: profileData.currency || 'USD',
          timezone: profileData.timezone || 'UTC',
          language: profileData.language || 'en'
        })
      } else {
        // Create profile if it doesn't exist
        const newProfile = {
          id: user.id,
          full_name: user.user_metadata?.full_name || '',
          currency: 'USD',
          timezone: 'UTC',
          language: 'en',
          plan: 'free'
        }
        
        const createdProfile = await profilesApi.create(newProfile)
        setProfile(createdProfile)
        setFormData({
          full_name: createdProfile.full_name || '',
          currency: createdProfile.currency || 'USD',
          timezone: createdProfile.timezone || 'UTC',
          language: createdProfile.language || 'en'
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setNotification({
        type: 'error',
        message: 'Failed to load profile settings'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    if (!user || !profile) return

    setSaving(true)
    setNotification(null)

    try {
      await profilesApi.update(user.id, {
        full_name: formData.full_name.trim() || null,
        currency: formData.currency,
        timezone: formData.timezone,
        language: formData.language
      })

      // Update language if changed
      if (formData.language !== i18n.language) {
        await i18n.changeLanguage(formData.language)
      }

      // Refresh profile in auth context
      await refreshProfile()

      setNotification({
        type: 'success',
        message: 'Settings saved successfully!'
      })

      // Update local profile state
      setProfile(prev => prev ? {
        ...prev,
        full_name: formData.full_name.trim() || null,
        currency: formData.currency,
        timezone: formData.timezone,
        language: formData.language
      } : null)

    } catch (error) {
      console.error('Error updating profile:', error)
      setNotification({
        type: 'error',
        message: 'Failed to save settings. Please try again.'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setNotification({
        type: 'error',
        message: 'Please type "DELETE" to confirm account deletion'
      })
      return
    }

    setDeleting(true)
    setNotification(null)

    try {
      // Delete user profile and all related data
      if (user) {
        // Delete profile (this will cascade delete all related data due to foreign key constraints)
        await profilesApi.delete(user.id)
        
        // Delete the auth user account
        const { error } = await supabase.rpc('delete_user')
        
        if (error) {
          console.error('Error deleting user account:', error)
          throw error
        }

        // Sign out and redirect
        await supabase.auth.signOut()
        localStorage.clear()
        navigate('/')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      setNotification({
        type: 'error',
        message: 'Failed to delete account. Please contact support.'
      })
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
      setDeleteConfirmText('')
    }
  }

  const availableCurrencies = currencyUtils.getAvailableCurrencies()

  const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Asia/Kolkata', label: 'Mumbai (IST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST)' }
  ]

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('settings.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('settings.subtitle')}
            </p>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`p-4 rounded-lg flex items-start gap-3 ${
            notification.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${
              notification.type === 'success' 
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            }`}>
              {notification.message}
            </p>
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-6">
            <User className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('settings.profileInfo')}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.fullName')}
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                placeholder="Enter your full name"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.emailAddress')}
              </label>
              <input
                type="email"
                id="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-xl cursor-not-allowed"
                placeholder="Email cannot be changed"
              />
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-6">
            <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('settings.preferences')}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.language')}
              </label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              >
                <option value="en">🇺🇸 English</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="es">🇪🇸 Español</option>
                <option value="de">🇩🇪 Deutsch</option>
                <option value="it">🇮🇹 Italiano</option>
                <option value="hi">🇮🇳 हिन्दी</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.currency')}
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              >
                {availableCurrencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} ({currency.symbol}) - {currency.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timezone
              </label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-6">
            <Palette className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Appearance
            </h2>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                {t('settings.darkMode')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Toggle between light and dark themes
              </p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isDarkMode ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Billing Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-6">
            <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Billing & Subscription
            </h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Current Plan
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {profile?.plan || 'free'} Plan
                </p>
              </div>
              {profile?.plan === 'free' && (
                <button 
                  onClick={() => navigate('/upgrade')}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro - $2.99/month
                </button>
              )}
            </div>

            {profile?.plan === 'pro' && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-purple-900 dark:text-purple-300">Pro Plan Active</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-400">$2.99/month • Next billing: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                  </div>
                  <button className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
                    Manage Subscription
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-red-200 dark:border-red-800 p-6">
          <div className="flex items-center mb-6">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" />
            <h2 className="text-xl font-bold text-red-900 dark:text-red-300">
              Danger Zone
            </h2>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
              Delete Account
            </h3>
            <p className="text-red-700 dark:text-red-400 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Delete Account
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This will permanently delete your account and all data including clients, reminders, invoices, and expenses. This action cannot be undone.
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type "DELETE" to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Type DELETE"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteConfirmText('')
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirmText !== 'DELETE'}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Account'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                {t('settings.saveChanges')}
              </>
            )}
          </button>
        </div>
      </div>
    </Layout>
  )
}