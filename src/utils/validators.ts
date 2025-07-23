// Input validation utilities

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone: string): boolean => {
  // Basic phone validation - allows various formats
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
}

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0
}

export const validateAmount = (amount: string): boolean => {
  const num = parseFloat(amount)
  return !isNaN(num) && num > 0
}

export const validateDate = (date: string): boolean => {
  const dateObj = new Date(date)
  return dateObj instanceof Date && !isNaN(dateObj.getTime())
}

export const sanitizeInput = (input: string): string => {
  // Remove potentially harmful characters
  return input.trim().replace(/[<>]/g, '')
}

export const validateClientForm = (data: {
  name: string
  email?: string
  phone?: string
}) => {
  const errors: string[] = []

  if (!validateRequired(data.name)) {
    errors.push('Client name is required')
  }

  if (data.email && !validateEmail(data.email)) {
    errors.push('Please enter a valid email address')
  }

  if (data.phone && !validatePhone(data.phone)) {
    errors.push('Please enter a valid phone number')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateReminderForm = (data: {
  title: string
  date: string
  time: string
}) => {
  const errors: string[] = []

  if (!validateRequired(data.title)) {
    errors.push('Reminder title is required')
  }

  if (!validateDate(data.date)) {
    errors.push('Please enter a valid date')
  }

  if (!data.time) {
    errors.push('Please enter a valid time')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateInvoiceForm = (data: {
  client_id: string
  project: string
  amount: string
  due_date: string
}) => {
  const errors: string[] = []

  if (!data.client_id) {
    errors.push('Please select a client')
  }

  if (!validateRequired(data.project)) {
    errors.push('Project description is required')
  }

  if (!validateAmount(data.amount)) {
    errors.push('Please enter a valid amount')
  }

  if (!validateDate(data.due_date)) {
    errors.push('Please enter a valid due date')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}