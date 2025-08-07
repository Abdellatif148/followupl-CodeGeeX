// Input validation utilities
import { sanitize, validate as securityValidate, contentSecurity } from '../lib/security'

export const validateEmail = (email: string): boolean => {
  return securityValidate.email(email)
}

export const validatePhone = (phone: string): boolean => {
  // Basic phone validation - allows various formats
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
}

export const validateRequired = (value: string): boolean => {
  return securityValidate.textLength(value.trim(), 1)
}

export const validateAmount = (amount: string): boolean => {
  return securityValidate.amount(amount)
}

export const validateDate = (date: string): boolean => {
  return securityValidate.date(date)
}

export const sanitizeInput = (input: string): string => {
  return sanitize.text(input)
}

export const validateClientForm = (data: {
  name: string
  email?: string
  phone?: string
}) => {
  const errors: string[] = []
  const warnings: string[] = []

  if (!data.name?.trim()) {
    errors.push('Client name is required')
  } else {
    const sanitizedName = sanitize.text(data.name)
    if (!securityValidate.textLength(sanitizedName, 1, 100)) {
      errors.push('Client name must be between 1 and 100 characters')
    }
  }

  if (data.email && !validateEmail(data.email)) {
    errors.push('Please enter a valid email address')
  }

  if (data.phone && !validatePhone(data.phone)) {
    errors.push('Please enter a valid phone number')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export const validateReminderForm = (data: {
  title: string
  date: string
  time: string
}) => {
  const errors: string[] = []
  const warnings: string[] = []

  if (!data.title?.trim()) {
    errors.push('Reminder title is required')
  } else {
    const contentCheck = contentSecurity.validateContent(data.title, 'text')
    if (!contentCheck.isValid) {
      errors.push(...contentCheck.errors)
    }
    if (!securityValidate.textLength(data.title, 1, 200)) {
      errors.push('Title must be between 1 and 200 characters')
    }
  }

  if (!validateDate(data.date)) {
    errors.push('Please enter a valid date')
  }

  if (!data.time) {
    errors.push('Please enter a valid time')
  } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.time)) {
    errors.push('Invalid time format')
  }
  
  // Check if reminder is in the past
  if (data.date && data.time) {
    const reminderDateTime = new Date(`${data.date}T${data.time}`)
    if (reminderDateTime < new Date()) {
      warnings.push('Reminder is set for the past')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export const validateInvoiceForm = (data: {
  client_id: string
  project: string
  amount: string
  due_date: string
}) => {
  const errors: string[] = []
  const warnings: string[] = []

  if (!data.client_id || !securityValidate.uuid(data.client_id)) {
    errors.push('Please select a client')
  }

  if (!data.project?.trim()) {
    errors.push('Project description is required')
  } else {
    const contentCheck = contentSecurity.validateContent(data.project, 'text')
    if (!contentCheck.isValid) {
      errors.push(...contentCheck.errors)
    }
  }

  if (!validateAmount(data.amount)) {
    errors.push('Please enter a valid amount')
  } else {
    const amount = parseFloat(data.amount)
    if (amount > 100000) {
      warnings.push('Large invoice amount - please verify')
    }
  }

  if (!validateDate(data.due_date)) {
    errors.push('Please enter a valid due date')
  } else {
    const dueDate = new Date(data.due_date)
    if (dueDate < new Date()) {
      warnings.push('Due date is in the past')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}