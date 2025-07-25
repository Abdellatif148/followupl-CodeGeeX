import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { 
  User, Mail, Lock, Globe, CreditCard, Trash2, 
  Save, Camera, Bell, Moon, Sun, AlertTriangle, Loader2, CheckCircle
} from 'lucide-react'
import Layout from '../components/Layout'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { profilesApi, currencyUtils } from '../lib/database'
import { supabase } from '../lib/supabase'
import { useDarkMode } from '../hooks/useDarkMode'
import { useCurrency } from '../hooks/useCurrency'
import { useAnalytics } from '../hooks/useAnalytics'

export default function Settings() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const { currency, updateCurrency, refreshCurrency } = useCurrency()
  const analytics = useAnalytics()

  const [formData, setFormData] = useState({
    full_name: '',
    currency: 'USD',
    timezone: 'UTC',
    language: 'en'
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const profileData = await profilesApi.get(user.id)
        
        if (profileData) {
          setProfile(profileData)
          setFormData({
            full_name: profileData.full_name || '',
            currency: profileData.currency || 'USD',
            timezone: profileData.timezone || 'UTC',
            language: profileData.language || i18n.language || 'en'
          })
        } else {
          // Profile doesn't exist yet, use default values
          setFormData({
            full_name: '',
            currency: 'USD',
            timezone: 'UTC',
            language: i18n.language || 'en'
          })
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const handleProfilePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    setUploadingPhoto(true)
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update profile with new avatar URL
      if (profile) {
        await profilesApi.update(user.id, { avatar_url: publicUrl })
      } else {
        await profilesApi.create({
          id: user.id,
          avatar_url: publicUrl,
          full_name: formData.full_name || user.user_metadata?.full_name || ''
        })
      }

      // Refresh profile data
      await loadUserData()
      showNotification('success', 'Profile photo updated successfully!')
      
    } catch (error) {
      console.error('Error uploading profile photo:', error)
      showNotification('error', 'Failed to upload profile photo. Please try again.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      // Update language if changed
      if (formData.language !== i18n.language) {
        i18n.changeLanguage(formData.language)
      }

      if (profile) {
        // Profile exists, update it
        await profilesApi.update(user.id, formData)
      } else {
        // Profile doesn't exist, create it
        await profilesApi.create({
          id: user.id,
          ...formData
        })
      }

      // Update currency in hook
      updateCurrency(formData.currency)
      
      await loadUserData()
      showNotification('success', 'Profile updated successfully!')
      
      // Track settings update
      analytics.trackFeatureUsage('settings', 'profile_update')
    } catch (error) {
      console.error('Error saving profile:', error)
      showNotification('error', 'Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('error', 'Passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      showNotification('error', 'Password must be at least 6 characters long')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })
      
      if (error) throw error
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      showNotification('success', 'Password updated successfully!')
      
      // Track password change
      analytics.trackFeatureUsage('settings', 'password_change')
    } catch (error) {
      console.error('Error changing password:', error)
      showNotification('error', 'Failed to update password. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      return
    }

    setDeleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No user found')
      }

      // Step 1: Delete all user data from database tables in correct order
      console.log('Starting account deletion process...')
      
      // Delete user data in correct order (respecting foreign key constraints)
      try {
        // Delete notifications first
        await supabase.from('notifications').delete().eq('user_id', user.id)
        console.log('✅ Deleted notifications')
        
        // Delete invoices
        await supabase.from('invoices').delete().eq('user_id', user.id)
        console.log('✅ Deleted invoices')
        
        // Delete reminders
        await supabase.from('reminders').delete().eq('user_id', user.id)
        console.log('✅ Deleted reminders')
        
        // Delete clients
        await supabase.from('clients').delete().eq('user_id', user.id)
        console.log('✅ Deleted clients')
        
        // Delete profile
        await supabase.from('profiles').delete().eq('id', user.id)
        console.log('✅ Deleted profile')
        
        console.log('✅ All user data deleted from database')
      } catch (dbError) {
        console.error('❌ Database deletion error:', dbError)
        // Continue with auth deletion even if database cleanup fails
      }
      
      // Step 2: Delete the authentication account
      try {
        // Use the user delete method (more reliable for self-deletion)
        const { error: deleteError } = await supabase.auth.deleteUser()
        
        if (deleteError) {
          console.error('❌ Auth deletion failed:', deleteError.message)
          // Force sign out if deletion fails
          await supabase.auth.signOut()
          console.log('🔐 Forced sign out due to deletion failure')
        } else {
          console.log('✅ Authentication account deleted successfully')
        }
      } catch (error) {
        console.error('❌ Auth deletion error:', error)
        // Force sign out as fallback
        await supabase.auth.signOut()
        console.log('🔐 Forced sign out due to error')
      }

      // Step 3: Clear all local data
      localStorage.clear()
      sessionStorage.clear()
      console.log('🧹 Cleared all local storage')
      
      // Show success message
      showNotification('success', 'Account permanently deleted. You will be redirected shortly.')
      
      // Navigate to home page
      setTimeout(() => {
        navigate('/')
      }, 2500)
      
    } catch (error) {
      console.error('❌ Critical error during account deletion:', error)
      showNotification('error', 'Account deletion failed. Please contact support.')
      
      // Force sign out for security even on error
      try {
        await supabase.auth.signOut()
        localStorage.clear()
        sessionStorage.clear()
        setTimeout(() => {
          navigate('/')
        }, 2000)
      } catch (signOutError) {
        console.error('❌ Failed to sign out after deletion error:', signOutError)
      }
    } finally {
      setDeleting(false)
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'account', name: 'Account', icon: Mail },
    { id: 'preferences', name: 'Preferences', icon: Globe },
    { id: 'billing', name: 'Billing', icon: CreditCard },
    { id: 'danger', name: 'Danger Zone', icon: Trash2 },
  ]

  const availableCurrencies = currencyUtils.getAvailableCurrencies()

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

  const displayName = formData.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const avatarUrl = profile?.avatar_url

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`p-4 rounded-xl border ${
            notification.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          } flex items-start space-x-3`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
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

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <tab.icon className="w-5 h-5 mr-3" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              {activeTab === 'profile' && (
                <div className="p-8 space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile Information</h2>
                    <p className="text-gray-600 dark:text-gray-400">Update your personal information and profile details</p>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Profile"
                          className="w-24 h-24 rounded-2xl object-cover shadow-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <label className="absolute bottom-0 right-0 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors duration-200 shadow-lg cursor-pointer">
                        {uploadingPhoto ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePhotoUpload}
                          className="hidden"
                          disabled={uploadingPhoto}
                        />
                      </label>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {displayName}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Free Plan</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-xl cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Email cannot be changed
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                    >
                      <Save className="w-5 h-5 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'account' && (
                <div className="p-8 space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Account Security</h2>
                    <p className="text-gray-600 dark:text-gray-400">Update your password and security settings</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                        placeholder="Enter current password"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                        placeholder="Enter new password"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleChangePassword}
                      disabled={saving || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                    >
                      <Lock className="w-5 h-5 mr-2" />
                      {saving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="p-8 space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Preferences</h2>
                    <p className="text-gray-600 dark:text-gray-400">Customize your app experience</p>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dark Mode</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Toggle between light and dark themes</p>
                      </div>
                      <button
                        onClick={toggleDarkMode}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 ${
                          isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 ${
                            isDarkMode ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Currency
                        </label>
                        <select
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                        >
                          {availableCurrencies.map((curr) => (
                            <option key={curr.code} value={curr.code}>
                              {curr.code} ({curr.symbol}) - {curr.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          This will be used for all monetary displays
                        </p>
                      </div>
                      
                      <div>
                        <LanguageSwitcher variant="settings" />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {activeTab === 'billing' && (
                <div className="p-8 space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Billing & Subscription</h2>
                    <p className="text-gray-600 dark:text-gray-400">Manage your subscription and billing information</p>
                  </div>
                  
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <CreditCard className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      Coming Soon
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                      We're working on bringing you premium features and subscription plans. Stay tuned for updates!
                    </p>
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xl font-bold text-blue-900 dark:text-blue-300">Free Plan</h4>
                          <p className="text-blue-700 dark:text-blue-400">Current plan - All features included</p>
                        </div>
                        <span className="px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg font-semibold">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'danger' && (
                <div className="p-8 space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Danger Zone</h2>
                    <p className="text-gray-600 dark:text-gray-400">Irreversible and destructive actions</p>
                  </div>
                  
                  <div className="border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-red-900 dark:text-red-300 mb-3">Delete Account</h3>
                        <p className="text-red-700 dark:text-red-400 mb-6">
                          Once you delete your account, there is no going back. This will permanently delete:
                        </p>
                        <ul className="text-red-700 dark:text-red-400 mb-6 space-y-1 list-disc list-inside">
                          <li>Your profile and account data</li>
                          <li>All clients and their information</li>
                          <li>All reminders and notifications</li>
                          <li>All invoices and payment history</li>
                          <li>All settings and preferences</li>
                        </ul>
                        
                        {!showDeleteConfirm ? (
                          <button 
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 font-semibold"
                          >
                            Delete Account
                          </button>
                        ) : (
                          <div className="space-y-4">
                            <div className="bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 rounded-lg p-4">
                              <p className="text-red-800 dark:text-red-300 font-medium mb-3">
                                To confirm deletion, type <span className="font-bold">DELETE</span> in the box below:
                              </p>
                              <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="Type DELETE to confirm"
                                className="w-full px-4 py-3 border border-red-300 dark:border-red-600 bg-white dark:bg-red-900/20 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent transition-all duration-200"
                              />
                            </div>
                            
                            <div className="flex space-x-3">
                              <button
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== 'DELETE' || deleting}
                                className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-semibold flex items-center"
                              >
                                {deleting ? (
                                  <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="w-5 h-5 mr-2" />
                                    Delete Account Permanently
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setShowDeleteConfirm(false)
                                  setDeleteConfirmText('')
                                }}
                                disabled={deleting}
                                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 font-semibold"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}