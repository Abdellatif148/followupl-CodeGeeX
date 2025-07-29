import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
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
import EditExpense from './pages/EditExpense'
import ExpenseReports from './pages/ExpenseReports'
import Settings from './pages/Settings'
import TermsOfService from './pages/TermsOfService'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Support from './pages/Support'
import ClientProfile from './pages/ClientProfile'
import ProtectedRoute from './components/ProtectedRoute'
import { StructuredData } from './components/StructuredData'
import { SEO } from './components/SEO'

function App() {
  return (
    <HelmetProvider>
      {/* Base SEO - will be overridden by page-specific SEO */}
      <SEO />
      {/* Global structured data for the site */}
      <StructuredData />

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
          <Route path="/client/:clientId" element={
            <ProtectedRoute>
              <ClientProfile />
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
          <Route path="/expenses/edit/:id" element={
            <ProtectedRoute>
              <EditExpense />
            </ProtectedRoute>
          } />
          <Route path="/expenses/reports" element={
            <ProtectedRoute>
              <ExpenseReports />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </HelmetProvider>
  )
}

export default App