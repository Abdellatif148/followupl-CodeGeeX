import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, User, CheckCircle, X } from 'lucide-react'
import { auth } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'
import DarkModeToggle from '../components/DarkModeToggle'
import GoogleAuthButton from '../components/GoogleAuthButton'
import { useAuthAnalytics } from '../hooks/useAnalytics'
import { useAuth } from '../hooks/useAuth'

interface PasswordStrength {
  score: number
  feedback: string[]
  color: string
}

export default function Signup() {
  const { trackSignup } = useAuthAnalytics()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    color: 'bg-gray-200'
  })
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      if (user) {
        // Check if language is selected
        const hasSelectedLanguage = localStorage.getItem('followuply-language-selected')
        if (hasSelectedLanguage) {
          navigate('/dashboard')
        } else {
          navigate('/language-selection')
        }
      }
    }
    
    if (user) {
      checkUser()
    }
  }, [user, navigate])

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0
    const feedback: string[] = []

    if (password.length >= 8) score += 1
    else feedback.push('At least 8 characters')

    if (/[a-z]/.test(password)) score += 1
    else feedback.push('One lowercase letter')

    if (/[A-Z]/.test(password)) score += 1
    else feedback.push('One uppercase letter')

    if (/\d/.test(password)) score += 1
    else feedback.push('One number')

    if (/[^a-zA-Z0-9]/.test(password)) score += 1
    else feedback.push('One special character')

    let color = 'bg-red-500'
    if (score >= 4) color = 'bg-green-500'
    else if (score >= 3) color = 'bg-yellow-500'
    else if (score >= 2) color = 'bg-orange-500'

    return { score, feedback, color }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })

    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value))
    }
  }

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Please enter your full name')
      return false
    }
    if (!formData.email.trim()) {
      setError('Please enter your email')
      return false
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setError('')

    try {
      const { data, error } = await auth.signUp(
        formData.email,
        formData.password,
        {
          full_name: formData.fullName.trim()
        }
      )

      if (error) {
        if (error.message.includes('already registered')) {
          setError('This email is already in use. Please try logging in instead.')
        } else {
          setError(error.message)
        }
      } else if (data.user) {
        // Check if email confirmation is required
        if (!data.session) {
          // Track successful signup
          trackSignup('email')
          
          setError('Please check your email and click the confirmation link to complete your registration.')
        } else {
          // Track successful signup
          trackSignup('email')
          
          // For new signups, go to language selection first
          navigate('/language-selection')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = () => {
    // Track Google signup
    trackSignup('google')
    // OAuth will handle the redirect automatically
  }

  const handleGoogleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:via-slate-900 dark:to-blue-900 transition-colors duration-300">
      <Helmet>
        <title>Sign Up Free - FollowUply | AI Client Tracker for Freelancers</title>
        <meta name="description" content="Create your free FollowUply account and start organizing your freelance business with AI-powered client tracking and invoice reminders." />
        <link rel="canonical" href="https://followuply.vercel.app/signup" />
        <meta name="robots" content="index, follow" />
      </Helmet>
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link 
              to="/"
              className="flex items-center space-x-2"
            >
              <img 
                src="/followuplyImage-removebg-preview.png" 
                alt="FollowUply Logo" 
                className="w-12 h-12"
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FollowUply
              </span>
            </Link>
            <DarkModeToggle />
          </div>
        </div>
      </nav>

      {/* Signup Form */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 transition-colors duration-300">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Create your account
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Start organizing your freelance business today
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Google Auth Button */}
            <div className="mb-6">
              <GoogleAuthButton 
                mode="signup" 
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
              />
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleEmailSignup} className="space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-3">
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-2 flex-1 rounded-full transition-colors duration-200 ${
                            level <= passwordStrength.score
                              ? passwordStrength.color
                              : 'bg-gray-200 dark:bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        <p className="mb-1">Password needs:</p>
                        <ul className="space-y-1">
                          {passwordStrength.feedback.map((item, index) => (
                            <li key={index} className="flex items-center gap-1">
                              <X className="w-3 h-3 text-red-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {passwordStrength.score >= 4 && (
                      <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        Strong password
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <X className="w-3 h-3" />
                    Passwords do not match
                  </p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password && (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Passwords match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}