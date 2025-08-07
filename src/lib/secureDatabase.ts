/**
 * Secure database operations with enhanced validation and protection
 */

import { supabase } from './supabase'
import { sanitize, validate, authSecurity, securityMiddleware, auditLog, dbSecurity } from './security'
import type { 
  Client, ClientInsert, ClientUpdate,
  Reminder, ReminderInsert, ReminderUpdate,
  Invoice, InvoiceInsert, InvoiceUpdate,
  Profile, ProfileInsert, ProfileUpdate,
  Notification, NotificationInsert, NotificationUpdate,
  Expense, ExpenseInsert, ExpenseUpdate
} from '../types/database'

// Enhanced client operations with security
export const secureClientsApi = {
  async getAll(userId: string): Promise<Client[]> {
    return securityMiddleware.secureApiCall(
      async () => {
        // Validate user ID
        if (!validate.uuid(userId)) {
          throw new Error('Invalid user ID format')
        }

        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        return data || []
      },
      {
        requireAuth: true,
        rateLimit: { key: `clients:getAll:${userId}`, limit: 60, windowMs: 60000 },
        auditLog: { action: 'list_clients', resourceType: 'client' }
      }
    )
  },

  async getById(id: string, userId: string): Promise<Client> {
    return securityMiddleware.secureApiCall(
      async () => {
        // Validate IDs
        if (!validate.uuid(id) || !validate.uuid(userId)) {
          throw new Error('Invalid ID format')
        }

        // Check permission
        const hasPermission = await authSecurity.hasPermission(userId, id, 'client')
        if (!hasPermission) {
          throw new Error('Access denied')
        }

        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId) // Additional security check
          .single()
        
        if (error) throw error
        return data
      },
      {
        requireAuth: true,
        rateLimit: { key: `clients:getById:${userId}`, limit: 100, windowMs: 60000 },
        auditLog: { action: 'view_client', resourceType: 'client' }
      }
    )
  },

  async create(client: ClientInsert): Promise<Client> {
    return securityMiddleware.secureApiCall(
      async () => {
        // Validate and sanitize input
        const sanitizedClient = {
          ...client,
          name: sanitize.text(client.name),
          email: client.email ? sanitize.email(client.email) : null,
          phone: client.phone ? sanitize.phone(client.phone) : null,
          company: client.company ? sanitize.text(client.company) : null,
          notes: client.notes ? sanitize.text(client.notes) : null,
          tags: client.tags?.map(tag => sanitize.text(tag)).filter(tag => tag.length > 0) || []
        }

        // Validate required fields
        if (!validate.textLength(sanitizedClient.name, 1, 100)) {
          throw new Error('Client name must be between 1 and 100 characters')
        }

        if (sanitizedClient.email && !validate.email(sanitizedClient.email)) {
          throw new Error('Invalid email format')
        }

        // Validate user ID
        if (!validate.uuid(sanitizedClient.user_id)) {
          throw new Error('Invalid user ID')
        }

        const { data, error } = await supabase
          .from('clients')
          .insert(sanitizedClient)
          .select()
          .single()
        
        if (error) throw error
        return data
      },
      {
        requireAuth: true,
        rateLimit: { key: `clients:create:${client.user_id}`, limit: 10, windowMs: 60000 },
        validateInput: () => dbSecurity.validateQueryParams(client),
        auditLog: { action: 'create_client', resourceType: 'client' }
      }
    )
  },

  async update(id: string, updates: ClientUpdate, userId: string): Promise<Client> {
    return securityMiddleware.secureApiCall(
      async () => {
        // Validate IDs
        if (!validate.uuid(id) || !validate.uuid(userId)) {
          throw new Error('Invalid ID format')
        }

        // Check permission
        const hasPermission = await authSecurity.hasPermission(userId, id, 'client')
        if (!hasPermission) {
          throw new Error('Access denied')
        }

        // Sanitize updates
        const sanitizedUpdates: ClientUpdate = {}
        
        if (updates.name !== undefined) {
          sanitizedUpdates.name = sanitize.text(updates.name)
          if (!validate.textLength(sanitizedUpdates.name, 1, 100)) {
            throw new Error('Client name must be between 1 and 100 characters')
          }
        }

        if (updates.email !== undefined) {
          sanitizedUpdates.email = updates.email ? sanitize.email(updates.email) : null
          if (sanitizedUpdates.email && !validate.email(sanitizedUpdates.email)) {
            throw new Error('Invalid email format')
          }
        }

        if (updates.phone !== undefined) {
          sanitizedUpdates.phone = updates.phone ? sanitize.phone(updates.phone) : null
        }

        if (updates.company !== undefined) {
          sanitizedUpdates.company = updates.company ? sanitize.text(updates.company) : null
        }

        if (updates.notes !== undefined) {
          sanitizedUpdates.notes = updates.notes ? sanitize.text(updates.notes) : null
        }

        if (updates.tags !== undefined) {
          sanitizedUpdates.tags = updates.tags?.map(tag => sanitize.text(tag)).filter(tag => tag.length > 0) || []
        }

        if (updates.status !== undefined) {
          if (!['active', 'inactive', 'archived'].includes(updates.status)) {
            throw new Error('Invalid status value')
          }
          sanitizedUpdates.status = updates.status
        }

        if (updates.platform !== undefined) {
          if (!['fiverr', 'upwork', 'direct', 'other'].includes(updates.platform)) {
            throw new Error('Invalid platform value')
          }
          sanitizedUpdates.platform = updates.platform
        }

        const { data, error } = await supabase
          .from('clients')
          .update({
            ...sanitizedUpdates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', userId) // Additional security check
          .select()
          .single()
        
        if (error) throw error
        return data
      },
      {
        requireAuth: true,
        rateLimit: { key: `clients:update:${userId}`, limit: 30, windowMs: 60000 },
        validateInput: () => dbSecurity.validateQueryParams(updates),
        auditLog: { action: 'update_client', resourceType: 'client' }
      }
    )
  },

  async delete(id: string, userId: string): Promise<void> {
    return securityMiddleware.secureApiCall(
      async () => {
        // Validate IDs
        if (!validate.uuid(id) || !validate.uuid(userId)) {
          throw new Error('Invalid ID format')
        }

        // Check permission
        const hasPermission = await authSecurity.hasPermission(userId, id, 'client')
        if (!hasPermission) {
          throw new Error('Access denied')
        }

        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', id)
          .eq('user_id', userId) // Additional security check
        
        if (error) throw error
      },
      {
        requireAuth: true,
        rateLimit: { key: `clients:delete:${userId}`, limit: 10, windowMs: 60000 },
        auditLog: { action: 'delete_client', resourceType: 'client' }
      }
    )
  },

  async search(userId: string, query: string): Promise<Client[]> {
    return securityMiddleware.secureApiCall(
      async () => {
        // Validate user ID and sanitize query
        if (!validate.uuid(userId)) {
          throw new Error('Invalid user ID format')
        }

        const sanitizedQuery = sanitize.text(query)
        if (sanitizedQuery.length < 2) {
          throw new Error('Search query must be at least 2 characters')
        }

        if (sanitizedQuery.length > 100) {
          throw new Error('Search query too long')
        }

        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', userId)
          .or(`name.ilike.%${sanitizedQuery}%,email.ilike.%${sanitizedQuery}%,company.ilike.%${sanitizedQuery}%,notes.ilike.%${sanitizedQuery}%`)
          .order('created_at', { ascending: false })
          .limit(50) // Limit results to prevent abuse
        
        if (error) throw error
        return data || []
      },
      {
        requireAuth: true,
        rateLimit: { key: `clients:search:${userId}`, limit: 30, windowMs: 60000 },
        auditLog: { action: 'search_clients', resourceType: 'client' }
      }
    )
  }
}

// Enhanced reminder operations with security
export const secureRemindersApi = {
  async getAll(userId: string): Promise<any[]> {
    return securityMiddleware.secureApiCall(
      async () => {
        if (!validate.uuid(userId)) {
          throw new Error('Invalid user ID format')
        }

        const { data, error } = await supabase
          .from('reminders')
          .select(`
            *,
            clients (
              id,
              name,
              platform
            )
          `)
          .eq('user_id', userId)
          .order('due_date', { ascending: true })
          .limit(1000) // Prevent excessive data loading
        
        if (error) throw error
        return data || []
      },
      {
        requireAuth: true,
        rateLimit: { key: `reminders:getAll:${userId}`, limit: 60, windowMs: 60000 },
        auditLog: { action: 'list_reminders', resourceType: 'reminder' }
      }
    )
  },

  async create(reminder: ReminderInsert): Promise<any> {
    return securityMiddleware.secureApiCall(
      async () => {
        // Validate and sanitize input
        const sanitizedReminder = {
          ...reminder,
          title: sanitize.text(reminder.title),
          description: reminder.description ? sanitize.text(reminder.description) : null,
          message: reminder.message ? sanitize.text(reminder.message) : null
        }

        // Validate required fields
        if (!validate.textLength(sanitizedReminder.title, 1, 200)) {
          throw new Error('Reminder title must be between 1 and 200 characters')
        }

        if (!validate.uuid(sanitizedReminder.user_id)) {
          throw new Error('Invalid user ID')
        }

        if (sanitizedReminder.client_id && !validate.uuid(sanitizedReminder.client_id)) {
          throw new Error('Invalid client ID')
        }

        if (!validate.date(sanitizedReminder.due_date)) {
          throw new Error('Invalid due date')
        }

        // Validate enum values
        if (sanitizedReminder.status && !['active', 'completed', 'cancelled', 'pending'].includes(sanitizedReminder.status)) {
          throw new Error('Invalid status value')
        }

        if (sanitizedReminder.priority && !['low', 'medium', 'high', 'urgent'].includes(sanitizedReminder.priority)) {
          throw new Error('Invalid priority value')
        }

        if (sanitizedReminder.reminder_type && !['follow_up', 'payment', 'project_deadline', 'custom'].includes(sanitizedReminder.reminder_type)) {
          throw new Error('Invalid reminder type')
        }

        const { data, error } = await supabase
          .from('reminders')
          .insert(sanitizedReminder)
          .select()
          .single()
        
        if (error) throw error
        return data
      },
      {
        requireAuth: true,
        rateLimit: { key: `reminders:create:${reminder.user_id}`, limit: 20, windowMs: 60000 },
        validateInput: () => dbSecurity.validateQueryParams(reminder),
        auditLog: { action: 'create_reminder', resourceType: 'reminder' }
      }
    )
  },

  async update(id: string, updates: ReminderUpdate, userId: string): Promise<any> {
    return securityMiddleware.secureApiCall(
      async () => {
        // Validate IDs
        if (!validate.uuid(id) || !validate.uuid(userId)) {
          throw new Error('Invalid ID format')
        }

        // Check permission
        const hasPermission = await authSecurity.hasPermission(userId, id, 'reminder')
        if (!hasPermission) {
          throw new Error('Access denied')
        }

        // Sanitize updates
        const sanitizedUpdates: ReminderUpdate = {}
        
        if (updates.title !== undefined) {
          sanitizedUpdates.title = sanitize.text(updates.title)
          if (!validate.textLength(sanitizedUpdates.title, 1, 200)) {
            throw new Error('Title must be between 1 and 200 characters')
          }
        }

        if (updates.description !== undefined) {
          sanitizedUpdates.description = updates.description ? sanitize.text(updates.description) : null
        }

        if (updates.message !== undefined) {
          sanitizedUpdates.message = updates.message ? sanitize.text(updates.message) : null
        }

        if (updates.due_date !== undefined && !validate.date(updates.due_date)) {
          throw new Error('Invalid due date')
        }

        if (updates.status !== undefined && !['active', 'completed', 'cancelled', 'pending'].includes(updates.status)) {
          throw new Error('Invalid status value')
        }

        if (updates.priority !== undefined && !['low', 'medium', 'high', 'urgent'].includes(updates.priority)) {
          throw new Error('Invalid priority value')
        }

        const { data, error } = await supabase
          .from('reminders')
          .update({
            ...sanitizedUpdates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', userId) // Additional security check
          .select()
          .single()
        
        if (error) throw error
        return data
      },
      {
        requireAuth: true,
        rateLimit: { key: `reminders:update:${userId}`, limit: 30, windowMs: 60000 },
        auditLog: { action: 'update_reminder', resourceType: 'reminder' }
      }
    )
  },

  async delete(id: string, userId: string): Promise<void> {
    return securityMiddleware.secureApiCall(
      async () => {
        if (!validate.uuid(id) || !validate.uuid(userId)) {
          throw new Error('Invalid ID format')
        }

        const hasPermission = await authSecurity.hasPermission(userId, id, 'reminder')
        if (!hasPermission) {
          throw new Error('Access denied')
        }

        const { error } = await supabase
          .from('reminders')
          .delete()
          .eq('id', id)
          .eq('user_id', userId)
        
        if (error) throw error
      },
      {
        requireAuth: true,
        rateLimit: { key: `reminders:delete:${userId}`, limit: 10, windowMs: 60000 },
        auditLog: { action: 'delete_reminder', resourceType: 'reminder' }
      }
    )
  }
}

// Enhanced invoice operations with security
export const secureInvoicesApi = {
  async getAll(userId: string): Promise<any[]> {
    return securityMiddleware.secureApiCall(
      async () => {
        if (!validate.uuid(userId)) {
          throw new Error('Invalid user ID format')
        }

        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            clients (
              id,
              name,
              email,
              platform
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1000)
        
        if (error) throw error
        return data || []
      },
      {
        requireAuth: true,
        rateLimit: { key: `invoices:getAll:${userId}`, limit: 60, windowMs: 60000 },
        auditLog: { action: 'list_invoices', resourceType: 'invoice' }
      }
    )
  },

  async create(invoice: InvoiceInsert): Promise<any> {
    return securityMiddleware.secureApiCall(
      async () => {
        // Validate and sanitize input
        const sanitizedInvoice = {
          ...invoice,
          title: invoice.title ? sanitize.text(invoice.title) : null,
          project: invoice.project ? sanitize.text(invoice.project) : null
        }

        // Validate required fields
        if (!validate.uuid(sanitizedInvoice.user_id)) {
          throw new Error('Invalid user ID')
        }

        if (!validate.uuid(sanitizedInvoice.client_id)) {
          throw new Error('Invalid client ID')
        }

        if (!validate.amount(sanitizedInvoice.amount)) {
          throw new Error('Invalid amount')
        }

        if (!validate.date(sanitizedInvoice.due_date)) {
          throw new Error('Invalid due date')
        }

        // Validate currency
        const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR']
        if (sanitizedInvoice.currency && !validCurrencies.includes(sanitizedInvoice.currency)) {
          throw new Error('Invalid currency')
        }

        // Validate status
        if (sanitizedInvoice.status && !['draft', 'sent', 'pending', 'paid', 'overdue', 'cancelled', 'unpaid'].includes(sanitizedInvoice.status)) {
          throw new Error('Invalid status')
        }

        const { data, error } = await supabase
          .from('invoices')
          .insert(sanitizedInvoice)
          .select()
          .single()
        
        if (error) throw error
        return data
      },
      {
        requireAuth: true,
        rateLimit: { key: `invoices:create:${invoice.user_id}`, limit: 20, windowMs: 60000 },
        validateInput: () => dbSecurity.validateQueryParams(invoice),
        auditLog: { action: 'create_invoice', resourceType: 'invoice' }
      }
    )
  },

  async update(id: string, updates: InvoiceUpdate, userId: string): Promise<any> {
    return securityMiddleware.secureApiCall(
      async () => {
        if (!validate.uuid(id) || !validate.uuid(userId)) {
          throw new Error('Invalid ID format')
        }

        const hasPermission = await authSecurity.hasPermission(userId, id, 'invoice')
        if (!hasPermission) {
          throw new Error('Access denied')
        }

        // Sanitize and validate updates
        const sanitizedUpdates: InvoiceUpdate = {}

        if (updates.title !== undefined) {
          sanitizedUpdates.title = updates.title ? sanitize.text(updates.title) : null
        }

        if (updates.project !== undefined) {
          sanitizedUpdates.project = updates.project ? sanitize.text(updates.project) : null
        }

        if (updates.amount !== undefined) {
          if (!validate.amount(updates.amount)) {
            throw new Error('Invalid amount')
          }
          sanitizedUpdates.amount = updates.amount
        }

        if (updates.due_date !== undefined && !validate.date(updates.due_date)) {
          throw new Error('Invalid due date')
        }

        if (updates.status !== undefined && !['draft', 'sent', 'pending', 'paid', 'overdue', 'cancelled', 'unpaid'].includes(updates.status)) {
          throw new Error('Invalid status')
        }

        const { data, error } = await supabase
          .from('invoices')
          .update({
            ...sanitizedUpdates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single()
        
        if (error) throw error
        return data
      },
      {
        requireAuth: true,
        rateLimit: { key: `invoices:update:${userId}`, limit: 30, windowMs: 60000 },
        auditLog: { action: 'update_invoice', resourceType: 'invoice' }
      }
    )
  },

  async delete(id: string, userId: string): Promise<void> {
    return securityMiddleware.secureApiCall(
      async () => {
        if (!validate.uuid(id) || !validate.uuid(userId)) {
          throw new Error('Invalid ID format')
        }

        const hasPermission = await authSecurity.hasPermission(userId, id, 'invoice')
        if (!hasPermission) {
          throw new Error('Access denied')
        }

        const { error } = await supabase
          .from('invoices')
          .delete()
          .eq('id', id)
          .eq('user_id', userId)
        
        if (error) throw error
      },
      {
        requireAuth: true,
        rateLimit: { key: `invoices:delete:${userId}`, limit: 10, windowMs: 60000 },
        auditLog: { action: 'delete_invoice', resourceType: 'invoice' }
      }
    )
  },

  async markPaid(id: string, userId: string, paymentMethod?: string): Promise<any> {
    return securityMiddleware.secureApiCall(
      async () => {
        if (!validate.uuid(id) || !validate.uuid(userId)) {
          throw new Error('Invalid ID format')
        }

        const hasPermission = await authSecurity.hasPermission(userId, id, 'invoice')
        if (!hasPermission) {
          throw new Error('Access denied')
        }

        const sanitizedPaymentMethod = paymentMethod ? sanitize.text(paymentMethod) : null

        const { data, error } = await supabase
          .from('invoices')
          .update({ 
            status: 'paid',
            payment_date: new Date().toISOString(),
            payment_method: sanitizedPaymentMethod,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single()
        
        if (error) throw error
        return data
      },
      {
        requireAuth: true,
        rateLimit: { key: `invoices:markPaid:${userId}`, limit: 20, windowMs: 60000 },
        auditLog: { action: 'mark_invoice_paid', resourceType: 'invoice' }
      }
    )
  }
}

// Enhanced expense operations with security
export const secureExpensesApi = {
  async getAll(userId: string): Promise<any[]> {
    return securityMiddleware.secureApiCall(
      async () => {
        if (!validate.uuid(userId)) {
          throw new Error('Invalid user ID format')
        }

        const { data, error } = await supabase
          .from('expenses')
          .select(`
            *,
            clients (
              id,
              name
            )
          `)
          .eq('user_id', userId)
          .order('expense_date', { ascending: false })
          .limit(1000)
        
        if (error) throw error
        return data || []
      },
      {
        requireAuth: true,
        rateLimit: { key: `expenses:getAll:${userId}`, limit: 60, windowMs: 60000 },
        auditLog: { action: 'list_expenses', resourceType: 'expense' }
      }
    )
  },

  async create(expense: ExpenseInsert): Promise<any> {
    return securityMiddleware.secureApiCall(
      async () => {
        // Validate and sanitize input
        const sanitizedExpense = {
          ...expense,
          title: sanitize.text(expense.title),
          description: expense.description ? sanitize.text(expense.description) : null,
          category: sanitize.text(expense.category),
          subcategory: expense.subcategory ? sanitize.text(expense.subcategory) : null,
          payment_method: expense.payment_method ? sanitize.text(expense.payment_method) : null,
          tags: expense.tags?.map(tag => sanitize.text(tag)).filter(tag => tag.length > 0) || null
        }

        // Validate required fields
        if (!validate.textLength(sanitizedExpense.title, 1, 200)) {
          throw new Error('Expense title must be between 1 and 200 characters')
        }

        if (!validate.uuid(sanitizedExpense.user_id)) {
          throw new Error('Invalid user ID')
        }

        if (!validate.amount(sanitizedExpense.amount)) {
          throw new Error('Invalid amount')
        }

        if (!validate.date(sanitizedExpense.expense_date)) {
          throw new Error('Invalid expense date')
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
        
        if (!validCategories.includes(sanitizedExpense.category)) {
          throw new Error('Invalid category')
        }

        const { data, error } = await supabase
          .from('expenses')
          .insert(sanitizedExpense)
          .select()
          .single()
        
        if (error) throw error
        return data
      },
      {
        requireAuth: true,
        rateLimit: { key: `expenses:create:${expense.user_id}`, limit: 30, windowMs: 60000 },
        validateInput: () => dbSecurity.validateQueryParams(expense),
        auditLog: { action: 'create_expense', resourceType: 'expense' }
      }
    )
  }
}

// Enhanced profile operations with security
export const secureProfilesApi = {
  async get(userId: string): Promise<Profile | null> {
    return securityMiddleware.secureApiCall(
      async () => {
        if (!validate.uuid(userId)) {
          throw new Error('Invalid user ID format')
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()
        
        if (error) throw error
        return data
      },
      {
        requireAuth: true,
        rateLimit: { key: `profiles:get:${userId}`, limit: 100, windowMs: 60000 }
      }
    )
  },

  async update(userId: string, updates: ProfileUpdate): Promise<Profile> {
    return securityMiddleware.secureApiCall(
      async () => {
        if (!validate.uuid(userId)) {
          throw new Error('Invalid user ID format')
        }

        // Sanitize updates
        const sanitizedUpdates: ProfileUpdate = {}

        if (updates.full_name !== undefined) {
          sanitizedUpdates.full_name = sanitize.text(updates.full_name)
          if (!validate.textLength(sanitizedUpdates.full_name, 0, 100)) {
            throw new Error('Full name must be less than 100 characters')
          }
        }

        if (updates.currency !== undefined) {
          const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR']
          if (!validCurrencies.includes(updates.currency)) {
            throw new Error('Invalid currency')
          }
          sanitizedUpdates.currency = updates.currency
        }

        if (updates.language !== undefined) {
          const validLanguages = ['en', 'fr', 'es', 'de', 'it', 'hi']
          if (!validLanguages.includes(updates.language)) {
            throw new Error('Invalid language')
          }
          sanitizedUpdates.language = updates.language
        }

        if (updates.plan !== undefined) {
          if (!['free', 'pro', 'super_pro'].includes(updates.plan)) {
            throw new Error('Invalid plan')
          }
          sanitizedUpdates.plan = updates.plan
        }

        const { data, error } = await supabase
          .from('profiles')
          .update({
            ...sanitizedUpdates,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single()
        
        if (error) throw error
        return data
      },
      {
        requireAuth: true,
        rateLimit: { key: `profiles:update:${userId}`, limit: 10, windowMs: 60000 },
        auditLog: { action: 'update_profile', resourceType: 'profile' }
      }
    )
  }
}

// Export secure APIs
export {
  secureClientsApi as clientsApi,
  secureRemindersApi as remindersApi,
  secureInvoicesApi as invoicesApi,
  secureExpensesApi as expensesApi,
  secureProfilesApi as profilesApi
}