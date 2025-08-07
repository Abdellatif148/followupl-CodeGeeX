/**
 * Application constants and configuration
 */

// App metadata
export const APP_NAME = 'FollowUply'
export const APP_DESCRIPTION = 'AI-powered client tracker for freelancers'
export const APP_URL = 'https://followuply.vercel.app'
export const CONTACT_EMAIL = 'followuplysc@gmail.com'

// Plan limits
export const PLAN_LIMITS = {
  free: {
    clients: 20,
    reminders: 50,
    invoices: 50,
    expenses: 100,
    features: ['basic_reminders', 'client_management', 'invoice_tracking']
  },
  pro: {
    clients: Infinity,
    reminders: Infinity,
    invoices: Infinity,
    expenses: Infinity,
    features: ['ai_reminders', 'progress_charts', 'priority_support', 'custom_branding']
  }
} as const

// Pricing
export const PRICING = {
  pro: {
    monthly: 2.99,
    currency: 'USD'
  }
} as const

// Supported platforms
export const PLATFORMS = [
  { value: 'fiverr', label: 'Fiverr', icon: '🟢' },
  { value: 'upwork', label: 'Upwork', icon: '🔵' },
  { value: 'direct', label: 'Direct Client', icon: '💼' },
  { value: 'other', label: 'Other', icon: '🌐' }
] as const

// Contact methods
export const CONTACT_METHODS = [
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'discord', label: 'Discord' },
  { value: 'other', label: 'Other' }
] as const

// Reminder types
export const REMINDER_TYPES = [
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'payment', label: 'Payment' },
  { value: 'project_deadline', label: 'Project Deadline' },
  { value: 'custom', label: 'Custom' }
] as const

// Priority levels
export const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'green' },
  { value: 'medium', label: 'Medium', color: 'yellow' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'urgent', label: 'Urgent', color: 'red' }
] as const

// Status options
export const CLIENT_STATUSES = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'inactive', label: 'Inactive', color: 'yellow' },
  { value: 'archived', label: 'Archived', color: 'gray' }
] as const

export const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'sent', label: 'Sent', color: 'blue' },
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'overdue', label: 'Overdue', color: 'red' },
  { value: 'cancelled', label: 'Cancelled', color: 'gray' },
  { value: 'unpaid', label: 'Unpaid', color: 'red' }
] as const

export const EXPENSE_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'approved', label: 'Approved', color: 'green' },
  { value: 'reimbursed', label: 'Reimbursed', color: 'blue' },
  { value: 'reconciled', label: 'Reconciled', color: 'purple' }
] as const

// Expense categories
export const EXPENSE_CATEGORIES = [
  'Software & Tools',
  'Hardware & Equipment',
  'Marketing & Advertising',
  'Travel & Transportation',
  'Office Supplies',
  'Professional Services',
  'Education & Training',
  'Internet & Phone',
  'Other'
] as const

// Date formats
export const DATE_FORMATS = {
  display: 'MMM dd, yyyy',
  input: 'yyyy-MM-dd',
  time: 'HH:mm',
  full: 'MMM dd, yyyy HH:mm'
} as const

// API endpoints
export const API_ENDPOINTS = {
  clients: '/clients',
  reminders: '/reminders',
  invoices: '/invoices',
  expenses: '/expenses',
  notifications: '/notifications',
  profiles: '/profiles'
} as const

// Local storage keys
export const STORAGE_KEYS = {
  darkMode: 'followuply-dark-mode',
  language: 'followuply-language',
  languageSelected: 'followuply-language-selected',
  cachedProfile: 'followuply-cached-profile'
} as const

// Animation durations (in ms)
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 200,
  slow: 300
} as const

// Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const