/**
 * Enhanced validation utilities with security focus
 */

import { sanitize, validate, contentSecurity } from '../lib/security'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  sanitizedValue?: any
}

/**
 * Secure form validation with sanitization
 */
export const secureValidators = {
  /**
   * Validate client form data
   */
  validateClientForm(data: {
    name: string
    email?: string
    phone?: string
    company?: string
    notes?: string
    tags?: string[]
    status?: string
    platform?: string
  }): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const sanitizedValue: any = {}

    // Validate and sanitize name
    if (!data.name?.trim()) {
      errors.push('Client name is required')
    } else {
      sanitizedValue.name = sanitize.text(data.name)
      if (!validate.textLength(sanitizedValue.name, 1, 100)) {
        errors.push('Client name must be between 1 and 100 characters')
      }
    }

    // Validate and sanitize email
    if (data.email) {
      sanitizedValue.email = sanitize.email(data.email)
      if (!validate.email(sanitizedValue.email)) {
        errors.push('Please enter a valid email address')
      }
    }

    // Validate and sanitize phone
    if (data.phone) {
      sanitizedValue.phone = sanitize.phone(data.phone)
      if (sanitizedValue.phone.length < 10) {
        warnings.push('Phone number seems too short')
      }
    }

    // Validate and sanitize company
    if (data.company) {
      sanitizedValue.company = sanitize.text(data.company)
      if (!validate.textLength(sanitizedValue.company, 0, 100)) {
        errors.push('Company name must be less than 100 characters')
      }
    }

    // Validate and sanitize notes
    if (data.notes) {
      const contentCheck = contentSecurity.validateContent(data.notes, 'text')
      if (!contentCheck.isValid) {
        errors.push(...contentCheck.errors)
      }
      sanitizedValue.notes = contentCheck.sanitized
    }

    // Validate and sanitize tags
    if (data.tags) {
      sanitizedValue.tags = data.tags
        .map(tag => sanitize.text(tag))
        .filter(tag => tag.length > 0)
        .slice(0, 10) // Limit to 10 tags
      
      if (data.tags.length > 10) {
        warnings.push('Only the first 10 tags will be saved')
      }
    }

    // Validate status
    if (data.status && !['active', 'inactive', 'archived'].includes(data.status)) {
      errors.push('Invalid status value')
    } else {
      sanitizedValue.status = data.status
    }

    // Validate platform
    if (data.platform && !['fiverr', 'upwork', 'direct', 'other'].includes(data.platform)) {
      errors.push('Invalid platform value')
    } else {
      sanitizedValue.platform = data.platform
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue
    }
  },

  /**
   * Validate invoice form data
   */
  validateInvoiceForm(data: {
    client_id: string
    project?: string
    title?: string
    amount: string | number
    currency?: string
    due_date: string
    status?: string
  }): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const sanitizedValue: any = {}

    // Validate client ID
    if (!data.client_id) {
      errors.push('Please select a client')
    } else if (!validate.uuid(data.client_id)) {
      errors.push('Invalid client ID format')
    } else {
      sanitizedValue.client_id = data.client_id
    }

    // Validate and sanitize project/title
    const projectText = data.project || data.title || ''
    if (!projectText.trim()) {
      errors.push('Project description is required')
    } else {
      const contentCheck = contentSecurity.validateContent(projectText, 'text')
      if (!contentCheck.isValid) {
        errors.push(...contentCheck.errors)
      }
      sanitizedValue.project = contentCheck.sanitized
      sanitizedValue.title = contentCheck.sanitized
    }

    // Validate amount
    const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount
    if (!validate.amount(amount)) {
      errors.push('Please enter a valid amount')
    } else if (amount > 999999999.99) {
      errors.push('Amount is too large')
    } else {
      sanitizedValue.amount = amount
      
      if (amount > 100000) {
        warnings.push('Large invoice amount - please verify')
      }
    }

    // Validate currency
    const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR']
    if (data.currency && !validCurrencies.includes(data.currency)) {
      errors.push('Invalid currency')
    } else {
      sanitizedValue.currency = data.currency || 'USD'
    }

    // Validate due date
    if (!data.due_date) {
      errors.push('Due date is required')
    } else if (!validate.date(data.due_date)) {
      errors.push('Invalid due date format')
    } else {
      const dueDate = new Date(data.due_date)
      const today = new Date()
      
      if (dueDate < today) {
        warnings.push('Due date is in the past')
      }
      
      sanitizedValue.due_date = data.due_date
    }

    // Validate status
    const validStatuses = ['draft', 'sent', 'pending', 'paid', 'overdue', 'cancelled', 'unpaid']
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push('Invalid status value')
    } else {
      sanitizedValue.status = data.status || 'unpaid'
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue
    }
  },

  /**
   * Validate reminder form data
   */
  validateReminderForm(data: {
    title: string
    description?: string
    client_id?: string
    date: string
    time: string
    priority?: string
    reminder_type?: string
  }): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const sanitizedValue: any = {}

    // Validate and sanitize title
    if (!data.title?.trim()) {
      errors.push('Reminder title is required')
    } else {
      const contentCheck = contentSecurity.validateContent(data.title, 'text')
      if (!contentCheck.isValid) {
        errors.push(...contentCheck.errors)
      }
      sanitizedValue.title = contentCheck.sanitized
      
      if (!validate.textLength(sanitizedValue.title, 1, 200)) {
        errors.push('Title must be between 1 and 200 characters')
      }
    }

    // Validate and sanitize description
    if (data.description) {
      const contentCheck = contentSecurity.validateContent(data.description, 'text')
      if (!contentCheck.isValid) {
        errors.push(...contentCheck.errors)
      }
      sanitizedValue.description = contentCheck.sanitized
    }

    // Validate client ID
    if (data.client_id && !validate.uuid(data.client_id)) {
      errors.push('Invalid client ID format')
    } else {
      sanitizedValue.client_id = data.client_id
    }

    // Validate date and time
    if (!data.date) {
      errors.push('Date is required')
    } else if (!validate.date(data.date)) {
      errors.push('Invalid date format')
    } else {
      sanitizedValue.date = data.date
    }

    if (!data.time) {
      errors.push('Time is required')
    } else {
      // Validate time format (HH:MM)
      if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.time)) {
        errors.push('Invalid time format')
      } else {
        sanitizedValue.time = data.time
      }
    }

    // Combine date and time for validation
    if (data.date && data.time) {
      const reminderDateTime = new Date(`${data.date}T${data.time}`)
      const now = new Date()
      
      if (reminderDateTime < now) {
        warnings.push('Reminder is set for the past')
      }
      
      sanitizedValue.due_date = reminderDateTime.toISOString()
    }

    // Validate priority
    if (data.priority && !['low', 'medium', 'high', 'urgent'].includes(data.priority)) {
      errors.push('Invalid priority value')
    } else {
      sanitizedValue.priority = data.priority || 'medium'
    }

    // Validate reminder type
    if (data.reminder_type && !['follow_up', 'payment', 'project_deadline', 'custom'].includes(data.reminder_type)) {
      errors.push('Invalid reminder type')
    } else {
      sanitizedValue.reminder_type = data.reminder_type || 'custom'
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue
    }
  },

  /**
   * Validate expense form data
   */
  validateExpenseForm(data: {
    title: string
    description?: string
    amount: string | number
    currency?: string
    category: string
    subcategory?: string
    expense_date: string
    payment_method?: string
    tax_deductible?: boolean
    status?: string
    client_id?: string
    tags?: string[]
  }): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const sanitizedValue: any = {}

    // Validate and sanitize title
    if (!data.title?.trim()) {
      errors.push('Expense title is required')
    } else {
      const contentCheck = contentSecurity.validateContent(data.title, 'text')
      if (!contentCheck.isValid) {
        errors.push(...contentCheck.errors)
      }
      sanitizedValue.title = contentCheck.sanitized
    }

    // Validate and sanitize description
    if (data.description) {
      const contentCheck = contentSecurity.validateContent(data.description, 'text')
      if (!contentCheck.isValid) {
        errors.push(...contentCheck.errors)
      }
      sanitizedValue.description = contentCheck.sanitized
    }

    // Validate amount
    const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount
    if (!validate.amount(amount)) {
      errors.push('Please enter a valid amount')
    } else if (amount > 999999999.99) {
      errors.push('Amount is too large')
    } else {
      sanitizedValue.amount = amount
      
      if (amount > 10000) {
        warnings.push('Large expense amount - please verify')
      }
    }

    // Validate currency
    const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR']
    if (data.currency && !validCurrencies.includes(data.currency)) {
      errors.push('Invalid currency')
    } else {
      sanitizedValue.currency = data.currency || 'USD'
    }

    // Validate category
    const validCategories = [
      'Software & Tools',
      'Hardware & Equipment',
      'Marketing & Advertising',
      'Travel & Transportation',
      'Office Supplies',
      'Professional Services',
      'Education & Training',
      'Internet & Phone',
      'Other'
    ]
    
    if (!data.category) {
      errors.push('Please select a category')
    } else if (!validCategories.includes(data.category)) {
      errors.push('Invalid category')
    } else {
      sanitizedValue.category = data.category
    }

    // Validate and sanitize subcategory
    if (data.subcategory) {
      sanitizedValue.subcategory = sanitize.text(data.subcategory)
    }

    // Validate expense date
    if (!data.expense_date) {
      errors.push('Expense date is required')
    } else if (!validate.date(data.expense_date)) {
      errors.push('Invalid expense date')
    } else {
      const expenseDate = new Date(data.expense_date)
      const today = new Date()
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(today.getFullYear() - 1)
      
      if (expenseDate > today) {
        warnings.push('Expense date is in the future')
      }
      
      if (expenseDate < oneYearAgo) {
        warnings.push('Expense date is more than a year old')
      }
      
      sanitizedValue.expense_date = data.expense_date
    }

    // Validate and sanitize payment method
    if (data.payment_method) {
      sanitizedValue.payment_method = sanitize.text(data.payment_method)
    }

    // Validate status
    if (data.status && !['pending', 'approved', 'reimbursed', 'reconciled'].includes(data.status)) {
      errors.push('Invalid status value')
    } else {
      sanitizedValue.status = data.status || 'pending'
    }

    // Validate client ID
    if (data.client_id && !validate.uuid(data.client_id)) {
      errors.push('Invalid client ID format')
    } else {
      sanitizedValue.client_id = data.client_id
    }

    // Validate and sanitize tags
    if (data.tags) {
      sanitizedValue.tags = data.tags
        .map(tag => sanitize.text(tag))
        .filter(tag => tag.length > 0)
        .slice(0, 10) // Limit to 10 tags
      
      if (data.tags.length > 10) {
        warnings.push('Only the first 10 tags will be saved')
      }
    }

    // Set tax deductible
    sanitizedValue.tax_deductible = Boolean(data.tax_deductible)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue
    }
  },

  /**
   * Validate profile form data
   */
  validateProfileForm(data: {
    full_name?: string
    currency?: string
    language?: string
  }): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const sanitizedValue: any = {}

    // Validate and sanitize full name
    if (data.full_name !== undefined) {
      sanitizedValue.full_name = sanitize.text(data.full_name)
      if (!validate.textLength(sanitizedValue.full_name, 0, 100)) {
        errors.push('Full name must be less than 100 characters')
      }
    }

    // Validate currency
    if (data.currency) {
      const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR']
      if (!validCurrencies.includes(data.currency)) {
        errors.push('Invalid currency')
      } else {
        sanitizedValue.currency = data.currency
      }
    }

    // Validate language
    if (data.language) {
      const validLanguages = ['en', 'fr', 'es', 'de', 'it', 'hi']
      if (!validLanguages.includes(data.language)) {
        errors.push('Invalid language')
      } else {
        sanitizedValue.language = data.language
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue
    }
  },

  /**
   * Validate search query
   */
  validateSearchQuery(query: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!query.trim()) {
      errors.push('Search query cannot be empty')
    }

    const sanitizedQuery = sanitize.text(query)
    
    if (sanitizedQuery.length < 2) {
      errors.push('Search query must be at least 2 characters')
    }

    if (sanitizedQuery.length > 100) {
      errors.push('Search query is too long')
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /script/i,
      /javascript/i,
      /vbscript/i,
      /onload/i,
      /onerror/i,
      /eval\(/i,
      /union.*select/i,
      /drop.*table/i
    ]

    if (suspiciousPatterns.some(pattern => pattern.test(query))) {
      errors.push('Search query contains invalid characters')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue: sanitizedQuery
    }
  },

  /**
   * Validate file upload
   */
  validateFileUpload(file: File): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // File size validation (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      errors.push('File size must be less than 5MB')
    }

    // File type validation
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/csv'
    ]

    if (!allowedTypes.includes(file.type)) {
      errors.push('File type not allowed')
    }

    // File name validation
    if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
      errors.push('File name contains invalid characters')
    }

    if (file.name.length > 255) {
      errors.push('File name is too long')
    }

    // Security warnings
    if (file.size > 1024 * 1024) {
      warnings.push('Large file size may slow down upload')
    }

    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com']
    if (suspiciousExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      errors.push('Executable files are not allowed')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue: file
    }
  },

  /**
   * Validate URL input
   */
  validateUrl(url: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!url.trim()) {
      errors.push('URL is required')
    }

    try {
      const urlObj = new URL(url)
      
      // Only allow HTTPS in production
      if (import.meta.env.PROD && urlObj.protocol !== 'https:') {
        errors.push('Only HTTPS URLs are allowed')
      }

      // Block suspicious domains
      const blockedDomains = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        '192.168.',
        '10.',
        '172.'
      ]

      if (blockedDomains.some(domain => urlObj.hostname.includes(domain))) {
        errors.push('Local or private network URLs are not allowed')
      }

      // Check for suspicious patterns
      if (urlObj.href.includes('javascript:') || urlObj.href.includes('data:')) {
        errors.push('JavaScript and data URLs are not allowed')
      }

    } catch (error) {
      errors.push('Invalid URL format')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue: sanitize.text(url)
    }
  }
}

export default secureValidators