import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { useDarkMode } from './hooks/useDarkMode'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import SecurityHeaders from './components/SecurityHeaders'
import SecurityMonitor from './components/SecurityMonitor'
import ToastContainer from './components/ToastContainer'
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
                <ProtectedRoute>
                  <LanguageSelection />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/clients" element={
                <ProtectedRoute>
                  <Clients />
                </ProtectedRoute>
              } />
              <Route path="/clients/add" element={
                <ProtectedRoute>
                  <AddClient />
                </ProtectedRoute>
              } />
              <Route path="/reminders" element={
                <ProtectedRoute>
                  <Reminders />
                </ProtectedRoute>
              } />
              <Route path="/invoices" element={
                <ProtectedRoute>
                  <Invoices />
                </ProtectedRoute>
              } />
              <Route path="/expenses" element={
                <ProtectedRoute>
                  <Expenses />
                </ProtectedRoute>
              } />
              <Route path="/expenses/add" element={
                <ProtectedRoute>
                  <AddExpense />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/progress-charts" element={
                <ProtectedRoute requiresPro={true}>
                  <ProgressCharts />
                </ProtectedRoute>
              } />
              <Route path="/upgrade" element={
                <ProtectedRoute>
                  <Upgrade />
                </ProtectedRoute>
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