import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { useDarkMode } from './hooks/useDarkMode'
import ErrorBoundary from './components/ErrorBoundary'
import SecureProtectedRoute from './components/SecureProtectedRoute'
import SecurityHeaders from './components/SecurityHeaders'
import SecurityMonitor from './components/SecurityMonitor'
import ToastContainer from './components/ToastContainer'
import { ddosProtection } from './lib/ddosProtection'
import { secureError } from './lib/security'

// Pages
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import AddClient from './pages/AddClient'
import Reminders from './pages/Reminders'
import Invoices from './pages/Invoices'
import Expenses from './pages/Expenses'
import AddExpense from './pages/AddExpense'
import Settings from './pages/Settings'
import Support from './pages/Support'
import TermsOfService from './pages/TermsOfService'
import PrivacyPolicy from './pages/PrivacyPolicy'
import LanguageSelection from './pages/LanguageSelection'
import ProgressCharts from './pages/ProgressCharts'
import Upgrade from './pages/Upgrade'

export default function App() {
  // Initialize dark mode
  useDarkMode()

  // Global error handler
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      secureError.logSecurityEvent('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      secureError.logSecurityEvent('unhandled_promise_rejection', {
        reason: event.reason
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <SecurityHeaders 
          allowInlineStyles={true}
          allowInlineScripts={false}
        />
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/support" element={<Support />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />

              {/* Protected routes */}
              <Route path="/language-selection" element={
                <SecureProtectedRoute>
                  <LanguageSelection />
                </SecureProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <SecureProtectedRoute>
                  <Dashboard />
                </SecureProtectedRoute>
              } />
              <Route path="/clients" element={
                <SecureProtectedRoute>
                  <Clients />
                </SecureProtectedRoute>
              } />
              <Route path="/clients/add" element={
                <SecureProtectedRoute>
                  <AddClient />
                </SecureProtectedRoute>
              } />
              <Route path="/reminders" element={
                <SecureProtectedRoute>
                  <Reminders />
                </SecureProtectedRoute>
              } />
              <Route path="/invoices" element={
                <SecureProtectedRoute>
                  <Invoices />
                </SecureProtectedRoute>
              } />
              <Route path="/expenses" element={
                <SecureProtectedRoute>
                  <Expenses />
                </SecureProtectedRoute>
              } />
              <Route path="/expenses/add" element={
                <SecureProtectedRoute>
                  <AddExpense />
                </SecureProtectedRoute>
              } />
              <Route path="/settings" element={
                <SecureProtectedRoute>
                  <Settings />
                </SecureProtectedRoute>
              } />
              <Route path="/progress-charts" element={
                <SecureProtectedRoute requiresPro={true}>
                  <ProgressCharts />
                </SecureProtectedRoute>
              } />
              <Route path="/upgrade" element={
                <SecureProtectedRoute>
                  <Upgrade />
                </SecureProtectedRoute>
              } />
            </Routes>
            {/* Security Components */}
            <SecurityMonitor />
            <ToastContainer />
          </div>
        </Router>
      </ErrorBoundary>
    </HelmetProvider>
  )
}