import { supabase } from './supabase'
import { secureError, validate, sanitize } from './security'
import type { 
  Client, ClientInsert, ClientUpdate,
  Reminder, ReminderInsert, ReminderUpdate,
  Invoice, InvoiceInsert, InvoiceUpdate,
  Profile, ProfileInsert, ProfileUpdate,
  Notification, NotificationInsert, NotificationUpdate,
  Expense, ExpenseInsert, ExpenseUpdate
} from '../types/database'

// Define types for joined data
interface ReminderWithClient extends Reminder {
  clients?: {
    id: string
    name: string
    platform: string
  } | null
}

interface InvoiceWithClient extends Invoice {
  clients?: {
    id: string
    name: string
    email: string | null
    platform: string
  } | null
}

interface ExpenseWithClient extends Expense {
  clients?: {
    id: string
    name: string
  } | null
}

// Error handling utility
const handleDatabaseError = (error: any, operation: string) => {
  console.error(`Database error in ${operation}:`, error)
  
  // Log security event for database errors
  secureError.logSecurityEvent('database_error', {
    operation,
    code: error?.code,
    message: error?.message
  })
  
  // Log to analytics if available
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'database_error', {
      event_category: 'error',
      event_label: operation,
      custom_parameters: {
        error_code: error?.code,
        error_message: error?.message
      }
    })
  }
  
  throw error
}

// Client operations
export const clientsApi = {
  async getAll(userId: string): Promise<Client[]> {
    try {
      if (!userId || !validate.uuid(userId)) {
        throw new Error('Valid user ID is required')
      }
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1000) // Prevent excessive data loading
      
      if (error) throw error
      return data || []
    } catch (error) {
      return handleDatabaseError(error, 'getAll clients')
    }
  },

  async getById(id: string): Promise<Client> {
    try {
      if (!id || !validate.uuid(id)) {
        throw new Error('Valid client ID is required')
      }
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      return handleDatabaseError(error, 'getById client')
    }
  },

  async create(client: ClientInsert): Promise<Client> {
    try {
      if (!client.user_id || !validate.uuid(client.user_id)) {
        throw new Error('Valid user ID is required')
      }
      if (!client.name?.trim() || !validate.textLength(client.name, 1, 100)) {
        throw new Error('Client name must be between 1 and 100 characters')
      }
      if (client.email && !validate.email(client.email)) {
        throw new Error('Invalid email format')
      }
      
      // Sanitize input data
      const sanitizedClient = {
        ...client,
        name: sanitize.text(client.name),
        email: client.email ? sanitize.email(client.email) : null,
        phone: client.phone ? sanitize.phone(client.phone) : null,
        company: client.company ? sanitize.text(client.company) : null,
        notes: client.notes ? sanitize.text(client.notes) : null
      }
      
      const { data, error } = await supabase
        .from('clients')
        .insert(sanitizedClient)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      return handleDatabaseError(error, 'create client')
    }
  },

  async update(id: string, updates: ClientUpdate): Promise<Client> {
    try {
      if (!id || !validate.uuid(id)) {
        throw new Error('Valid client ID is required')
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
        sanitizedUpdates.tags = updates.tags?.map(tag => sanitize.text(tag)).filter(tag => tag.length > 0)
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
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      return handleDatabaseError(error, 'update client')
    }
  },

  async delete(id: string): Promise<void> {
    try {
      if (!id || !validate.uuid(id)) {
        throw new Error('Valid client ID is required')
      }
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      return handleDatabaseError(error, 'delete client')
    }
  },

  async search(userId: string, query: string): Promise<Client[]> {
    try {
      if (!userId || !validate.uuid(userId)) {
        throw new Error('Valid user ID is required')
      }
      if (!query?.trim() || query.length < 2) return []
      
      const sanitizedQuery = sanitize.text(query).substring(0, 100)
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .or(`name.ilike.%${sanitizedQuery}%,email.ilike.%${sanitizedQuery}%,company.ilike.%${sanitizedQuery}%,notes.ilike.%${sanitizedQuery}%`)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      return data || []
    } catch (error) {
      return handleDatabaseError(error, 'search clients')
    }
  }
}

// Reminder operations
export const remindersApi = {
  async requestBrowserNotificationPermission(): Promise<void> {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification')
      return
    }

    if (Notification.permission === 'granted') return

    try {
      await Notification.requestPermission()
    } catch (error) {
      console.error('Error requesting notification permission:', error)
    }
  },

  async showBrowserNotification(reminder: Reminder): Promise<void> {
    if (Notification.permission !== 'granted') return

    new Notification('FollowUply', {
      body: `⏰ ${reminder.title} is due soon!`,
      icon: '/followuplyImage-removebg-preview.png',
      data: {
        reminderId: reminder.id,
        type: 'reminder'
      }
    })
  },

  async getAll(userId: string): Promise<ReminderWithClient[]> {
    try {
      if (!userId || !validate.uuid(userId)) {
        throw new Error('Valid user ID is required')
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
        .limit(1000)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching reminders:', error)
      throw error
    }
  },

  async getUpcoming(userId: string, days: number = 7): Promise<ReminderWithClient[]> {
    try {
      if (!userId || !validate.uuid(userId)) {
        throw new Error('Valid user ID is required')
      }
      
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + days)
      
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
        .in('status', ['pending', 'active'])
        .lte('due_date', futureDate.toISOString())
        .order('due_date', { ascending: true })
        .limit(100)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching upcoming reminders:', error)
      throw error
    }
  },

  async create(reminder: ReminderInsert): Promise<Reminder> {
    try {
      if (!reminder.user_id || !validate.uuid(reminder.user_id)) {
        throw new Error('Valid user ID is required')
      }
      if (!reminder.title?.trim() || !validate.textLength(reminder.title, 1, 200)) {
        throw new Error('Reminder title must be between 1 and 200 characters')
      }
      if (!reminder.due_date || !validate.date(reminder.due_date)) {
        throw new Error('Valid due date is required')
      }
      
      // Sanitize input data
      const sanitizedReminder = {
        ...reminder,
        title: sanitize.text(reminder.title),
        description: reminder.description ? sanitize.text(reminder.description) : null,
        message: reminder.message ? sanitize.text(reminder.message) : null
      }
      
      const { data, error } = await supabase
        .from('reminders')
        .insert(sanitizedReminder)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating reminder:', error)
      throw error
    }
  },

  async update(id: string, updates: ReminderUpdate): Promise<Reminder> {
    try {
      if (!id || !validate.uuid(id)) {
        throw new Error('Valid reminder ID is required')
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
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating reminder:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      if (!id || !validate.uuid(id)) {
        throw new Error('Valid reminder ID is required')
      }
      
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      console.error('Error deleting reminder:', error)
      throw error
    }
  },

  async markCompleted(id: string): Promise<Reminder> {
    try {
      if (!id || !validate.uuid(id)) {
        throw new Error('Valid reminder ID is required')
      }
      
      const { data, error } = await supabase
        .from('reminders')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error marking reminder as completed:', error)
      throw error
    }
  }
}

// Invoice operations
export const invoicesApi = {
  async getAll(userId: string): Promise<InvoiceWithClient[]> {
    try {
      if (!userId || !validate.uuid(userId)) {
        throw new Error('Valid user ID is required')
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
    } catch (error) {
      console.error('Error fetching invoices:', error)
      throw error
    }
  },

  async getOverdue(userId: string): Promise<InvoiceWithClient[]> {
    try {
      if (!userId || !validate.uuid(userId)) {
        throw new Error('Valid user ID is required')
      }
      
      const today = new Date().toISOString().split('T')[0]
      
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
        .in('status', ['unpaid', 'pending'])
        .lt('due_date', today)
        .order('due_date', { ascending: true })
        .limit(500)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching overdue invoices:', error)
      throw error
    }
  },

  async create(invoice: InvoiceInsert): Promise<Invoice> {
    try {
      if (!invoice.user_id || !validate.uuid(invoice.user_id)) {
        throw new Error('Valid user ID is required')
      }
      if (!invoice.client_id || !validate.uuid(invoice.client_id)) {
        throw new Error('Valid client ID is required')
      }
      if (!invoice.title?.trim()) {
        throw new Error('Invoice title is required')
      }
      if (!invoice.amount || !validate.amount(invoice.amount)) {
        throw new Error('Valid amount is required')
      }
      if (!invoice.due_date || !validate.date(invoice.due_date)) {
        throw new Error('Valid due date is required')
      }
      
      // Sanitize input data
      const sanitizedInvoice = {
        ...invoice,
        title: sanitize.text(invoice.title),
        description: invoice.description ? sanitize.text(invoice.description) : null,
        project: invoice.project ? sanitize.text(invoice.project) : null
      }
      
      const { data, error } = await supabase
        .from('invoices')
        .insert(sanitizedInvoice)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating invoice:', error)
      throw error
    }
  },

  async update(id: string, updates: InvoiceUpdate): Promise<Invoice> {
    try {
      if (!id || !validate.uuid(id)) {
        throw new Error('Valid invoice ID is required')
      }
      
      // Sanitize updates
      const sanitizedUpdates: InvoiceUpdate = {}
      if (updates.title !== undefined) {
        sanitizedUpdates.title = updates.title ? sanitize.text(updates.title) : null
      }
      if (updates.description !== undefined) {
        sanitizedUpdates.description = updates.description ? sanitize.text(updates.description) : null
      }
      if (updates.project !== undefined) {
        sanitizedUpdates.project = updates.project ? sanitize.text(updates.project) : null
      }
      if (updates.amount !== undefined && !validate.amount(updates.amount)) {
        throw new Error('Invalid amount')
      }
      if (updates.due_date !== undefined && !validate.date(updates.due_date)) {
        throw new Error('Invalid due date')
      }
      if (updates.status !== undefined && !['draft', 'sent', 'pending', 'paid', 'overdue', 'cancelled', 'unpaid'].includes(updates.status)) {
        throw new Error('Invalid status value')
      }
      
      const { data, error } = await supabase
        .from('invoices')
        .update({
          ...sanitizedUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating invoice:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      if (!id || !validate.uuid(id)) {
        throw new Error('Valid invoice ID is required')
      }
      
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      console.error('Error deleting invoice:', error)
      throw error
    }
  },

  async markPaid(id: string, paymentMethod?: string): Promise<Invoice> {
    try {
      if (!id || !validate.uuid(id)) {
        throw new Error('Valid invoice ID is required')
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
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error marking invoice as paid:', error)
      throw error
    }
  }
}

// Expense operations
export const expensesApi = {
  async getAll(userId: string): Promise<ExpenseWithClient[]> {
    try {
      if (!userId || !validate.uuid(userId)) {
        throw new Error('Valid user ID is required')
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
    } catch (error) {
      return handleDatabaseError(error, 'getAll expenses')
    }
  },

  async create(expense: ExpenseInsert): Promise<Expense> {
    try {
      if (!expense.user_id || !validate.uuid(expense.user_id)) {
        throw new Error('Valid user ID is required')
      }
      if (!expense.title?.trim() || !validate.textLength(expense.title, 1, 200)) {
        throw new Error('Expense title must be between 1 and 200 characters')
      }
      if (!expense.amount || !validate.amount(expense.amount)) {
        throw new Error('Valid amount is required')
      }
      if (!expense.category?.trim()) {
        throw new Error('Category is required')
      }
      if (!expense.expense_date || !validate.date(expense.expense_date)) {
        throw new Error('Valid expense date is required')
      }
      
      // Sanitize input data
      const sanitizedExpense = {
        ...expense,
        title: sanitize.text(expense.title),
        description: expense.description ? sanitize.text(expense.description) : null,
        category: sanitize.text(expense.category),
        subcategory: expense.subcategory ? sanitize.text(expense.subcategory) : null,
        payment_method: expense.payment_method ? sanitize.text(expense.payment_method) : null,
        tags: expense.tags?.map(tag => sanitize.text(tag)).filter(tag => tag.length > 0)
      }
      
      const { data, error } = await supabase
        .from('expenses')
        .insert(sanitizedExpense)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      return handleDatabaseError(error, 'create expense')
    }
  },

  async update(id: string, updates: ExpenseUpdate): Promise<Expense> {
    try {
      if (!id || !validate.uuid(id)) {
        throw new Error('Valid expense ID is required')
      }
      
      // Sanitize updates
      const sanitizedUpdates: ExpenseUpdate = {}
      if (updates.title !== undefined) {
        sanitizedUpdates.title = sanitize.text(updates.title)
        if (!validate.textLength(sanitizedUpdates.title, 1, 200)) {
          throw new Error('Title must be between 1 and 200 characters')
        }
      }
      if (updates.description !== undefined) {
        sanitizedUpdates.description = updates.description ? sanitize.text(updates.description) : null
      }
      if (updates.amount !== undefined && !validate.amount(updates.amount)) {
        throw new Error('Invalid amount')
      }
      if (updates.expense_date !== undefined && !validate.date(updates.expense_date)) {
        throw new Error('Invalid expense date')
      }
      if (updates.category !== undefined) {
        sanitizedUpdates.category = sanitize.text(updates.category)
      }
      if (updates.subcategory !== undefined) {
        sanitizedUpdates.subcategory = updates.subcategory ? sanitize.text(updates.subcategory) : null
      }
      if (updates.payment_method !== undefined) {
        sanitizedUpdates.payment_method = updates.payment_method ? sanitize.text(updates.payment_method) : null
      }
      if (updates.tags !== undefined) {
        sanitizedUpdates.tags = updates.tags?.map(tag => sanitize.text(tag)).filter(tag => tag.length > 0)
      }
      
      
      const { data, error } = await supabase
        .from('expenses')
        .update({
          ...sanitizedUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      return handleDatabaseError(error, 'update expense')
    }
  },

  async delete(id: string): Promise<void> {
    try {
      if (!id || !validate.uuid(id)) {
        throw new Error('Valid expense ID is required')
      }
      
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      return handleDatabaseError(error, 'delete expense')
    }
  },

  async getByCategory(userId: string, category: string): Promise<Expense[]> {
    try {
      if (!userId || !validate.uuid(userId)) {
        throw new Error('Valid user ID is required')
      }
      if (!category?.trim()) {
        throw new Error('Category is required')
      }
      
      const sanitizedCategory = sanitize.text(category)
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .eq('category', sanitizedCategory)
        .order('expense_date', { ascending: false })
        .limit(500)
      
      if (error) throw error
      return data || []
    } catch (error) {
      return handleDatabaseError(error, 'getByCategory expenses')
    }
  },

  async getTaxDeductible(userId: string): Promise<Expense[]> {
    try {
      if (!userId || !validate.uuid(userId)) {
        throw new Error('Valid user ID is required')
      }
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .eq('tax_deductible', true)
        .order('expense_date', { ascending: false })
        .limit(500)
      
      if (error) throw error
      return data || []
    } catch (error) {
      return handleDatabaseError(error, 'getTaxDeductible expenses')
    }
  }
}

// Profile operations
export const profilesApi = {
  async get(userId: string): Promise<Profile | null> {
    try {
      if (!userId || !validate.uuid(userId)) {
        throw new Error('Valid user ID is required')
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      throw error
    }
  },

  async create(profile: ProfileInsert): Promise<Profile> {
    try {
      if (!profile.id || !validate.uuid(profile.id)) {
        throw new Error('Valid user ID is required')
      }
      if (!profile.email || !validate.email(profile.email)) {
        throw new Error('Valid email is required')
      }
      
      // Sanitize input data
      const sanitizedProfile = {
        ...profile,
        full_name: sanitize.text(profile.full_name || ''),
        email: sanitize.email(profile.email)
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .insert(sanitizedProfile)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating profile:', error)
      throw error
    }
  },

  async update(userId: string, updates: ProfileUpdate): Promise<Profile> {
    try {
      if (!userId || !validate.uuid(userId)) {
        throw new Error('Valid user ID is required')
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
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  },

  async delete(userId: string): Promise<void> {
    try {
      if (!userId || !validate.uuid(userId)) {
        throw new Error('Valid user ID is required')
      }
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
      
      if (error) throw error
    } catch (error) {
      console.error('Error deleting profile:', error)
      throw error
    }
  }
}

// Notification operations
export const notificationsApi = {
  async getAll(userId: string): Promise<Notification[]> {
    try {
      if (!userId || !validate.uuid(userId)) {
        throw new Error('Valid user ID is required')
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(500)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching notifications:', error)
      throw error
    }
  },

  async getUnread(userId: string): Promise<Notification[]> {
    try {
      if (!userId || !validate.uuid(userId)) {
        throw new Error('Valid user ID is required')
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching unread notifications:', error)
      throw error
    }
  },

  async markAsRead(id: string): Promise<void> {
    try {
      if (!id || !validate.uuid(id)) {
        throw new Error('Valid notification ID is required')
      }
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    try {
      if (!userId || !validate.uuid(userId)) {
        throw new Error('Valid user ID is required')
      }
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)
      
      if (error) throw error
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      throw error
    }
  },

  async create(notification: NotificationInsert): Promise<Notification> {
    try {
      if (!notification.user_id || !validate.uuid(notification.user_id)) {
        throw new Error('Valid user ID is required')
      }
      if (!notification.title?.trim()) {
        throw new Error('Notification title is required')
      }
      if (!notification.message?.trim()) {
        throw new Error('Notification message is required')
      }
      
      // Sanitize input data
      const sanitizedNotification = {
        ...notification,
        title: sanitize.text(notification.title),
        message: sanitize.text(notification.message),
        action_url: notification.action_url ? sanitize.text(notification.action_url) : null
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .insert(sanitizedNotification)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }
}

// Dashboard stats
export const dashboardApi = {
  async getStats(userId: string) {
    try {
      if (!userId || !validate.uuid(userId)) {
        throw new Error('Valid user ID is required')
      }
      
      const [clients, reminders, invoices, expenses] = await Promise.all([
        clientsApi.getAll(userId),
        remindersApi.getUpcoming(userId),
        invoicesApi.getAll(userId),
        expensesApi.getAll(userId)
      ])

      const activeClients = clients.filter(c => c.status === 'active').length
      const pendingReminders = reminders.filter(r => ['pending', 'active'].includes(r.status)).length
      const pendingInvoices = invoices.filter(i => ['unpaid', 'pending'].includes(i.status))
      const overdueInvoices = invoices.filter(i => {
        const today = new Date().toISOString().split('T')[0]
        return ['unpaid', 'pending'].includes(i.status) && i.due_date < today
      })

      const totalPendingAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
      const totalOverdueAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
      const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
      const totalRevenue = invoices.filter(i => (i.status || '') === 'paid').reduce((sum, inv) => sum + (inv.amount || 0), 0)

      return {
        activeClients,
        pendingReminders,
        pendingInvoicesCount: pendingInvoices.length,
        overdueInvoicesCount: overdueInvoices.length,
        totalPendingAmount,
        totalOverdueAmount,
        totalExpenses,
        totalRevenue,
        recentClients: clients.slice(0, 5),
        upcomingReminders: reminders.filter(r => ['pending', 'active'].includes(r.status || '')).slice(0, 5),
        recentInvoices: invoices.slice(0, 5),
        recentExpenses: expenses.slice(0, 5)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      throw error
    }
  }
}

// Currency utilities
export const currencyUtils = {
  // Get user's preferred currency from profile
  async getUserCurrency(userId: string): Promise<string> {
    try {
      if (!userId || !validate.uuid(userId)) {
        return 'USD'
      }
      
      const profile = await profilesApi.get(userId)
      return profile?.currency || 'USD'
    } catch (error) {
      console.error('Error getting user currency:', error)
      return 'USD'
    }
  },

  // Format currency based on user preference
  formatCurrency(amount: number, currency: string = 'USD'): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount)
    } catch (error) {
      // Fallback to USD if currency is invalid
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount)
    }
  },

  // Get currency symbol
  getCurrencySymbol(currency: string = 'USD'): string {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CAD': 'C$',
      'AUD': 'A$',
      'JPY': '¥',
      'CHF': 'CHF',
      'CNY': '¥',
      'INR': '₹'
    }
    return symbols[currency] || '$'
  },

  // Available currencies
  getAvailableCurrencies() {
    return [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹' }
    ]
  }
}