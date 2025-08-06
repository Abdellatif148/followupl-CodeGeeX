import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import LanguageSelection from './pages/LanguageSelection'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import AddClient from './pages/AddClient'
import Reminders from './pages/Reminders'
import Invoices from './pages/Invoices'
import Expenses from './pages/Expenses'
import AddExpense from './pages/AddExpense'
import Settings from './pages/Settings'
import Upgrade from './pages/Upgrade'
import ProgressCharts from './pages/ProgressCharts'
import TermsOfService from './pages/TermsOfService'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Support from './pages/Support'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/support" element={<Support />} />
          
          {/* Protected Routes */}
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
          <Route path="/upgrade" element={
            <ProtectedRoute>
              <Upgrade />
            </ProtectedRoute>
          } />
          <Route path="/progress-charts" element={
            <ProtectedRoute>
              <ProgressCharts />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App