import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Globe, ArrowRight, Loader2 } from 'lucide-react'
import { languages } from '../lib/i18n'
import DarkModeToggle from '../components/DarkModeToggle'

export default function LanguageSelection() {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [isLoading, setIsLoading] = useState(false)

  // Filter out Arabic language
  const availableLanguages = languages.filter(lang => lang.code !== 'ar')

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode)
  }

  const handleContinue = async () => {
    setIsLoading(true)
    
    // Change language
    await i18n.changeLanguage(selectedLanguage)
    
    // Save preference
    localStorage.setItem('followuply-language', selectedLanguage)
    localStorage.setItem('followuply-language-selected', 'true')
    
    // Update document direction
    const selectedLang = availableLanguages.find(lang => lang.code === selectedLanguage)
    const direction = selectedLang?.dir || 'ltr'
    document.documentElement.dir = direction
    document.documentElement.lang = selectedLanguage
    
    if (direction === 'rtl') {
      document.documentElement.classList.add('rtl')
    } else {
      document.documentElement.classList.remove('rtl')
    }
    
    // Simulate loading
    setTimeout(() => {
      navigate('/dashboard')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:via-slate-900 dark:to-blue-900 transition-colors duration-300">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img 
                src="/followuplyImage-removebg-preview.png" 
                alt="FollowUply Logo" 
                className="w-12 h-12"
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FollowUply
              </span>
            </div>
            <DarkModeToggle />
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 transition-colors duration-300">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Globe className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Choose Your Language
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Select your preferred language to get started with FollowUply
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {availableLanguages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language.code)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedLanguage === language.code
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{language.flag}</span>
                    <div className="text-left">
                      <div className="font-semibold text-lg">{language.name}</div>
                      <div className="text-sm opacity-75">{language.code.toUpperCase()}</div>
                    </div>
                  </div>
                  {selectedLanguage === language.code && (
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleContinue}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-lg flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Setting up...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-6 h-6 ml-2" />
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              You can change this later in your settings
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}