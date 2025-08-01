import { supabase } from './supabase'
import type { 
  Client, ClientInsert, ClientUpdate,
  Reminder, ReminderInsert, ReminderUpdate,
  Invoice, InvoiceInsert, InvoiceUpdate,
  Profile, ProfileInsert, ProfileUpdate,
  Notification, NotificationInsert, NotificationUpdate
} from '../types/database'

// Client operations
export const clientsApi = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Client[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Client
  },

  async create(client: ClientInsert) {
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single()
    
    if (error) throw error
    return data as Client
  },

  async update(id: string, updates: ClientUpdate) {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Client
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async search(userId: string, query: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,notes.ilike.%${query}%`)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Client[]
  }
}

// Reminder operations
export const remindersApi = {
  async getAll(userId: string) {
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
    
    if (error) throw error
    return data
  },

  async getUpcoming(userId: string, days: number = 7) {
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
      .eq('status', 'pending')
      .lte('due_date', futureDate.toISOString())
      .order('due_date', { ascending: true })
    
    if (error) throw error
    return data
  },

  async create(reminder: ReminderInsert) {
    const { data, error } = await supabase
      .from('reminders')
      .insert(reminder)
      .select()
      .single()
    
    if (error) throw error
    return data as Reminder
  },

  async update(id: string, updates: ReminderUpdate) {
    const { data, error } = await supabase
      .from('reminders')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Reminder
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async markCompleted(id: string) {
    const { data, error } = await supabase
      .from('reminders')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })

  },

  async requestBrowserNotificationPermission() {
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

  async showBrowserNotification(reminder: Reminder) {
    if (Notification.permission !== 'granted') return

    new Notification('Followuply', {
      body: `⏰ ${reminder.title} is due soon!`,
      icon: '/logo192.png',
      data: {
        reminderId: reminder.id,
        type: 'reminder'
      }
    })
  },

  async getAll(userId: string): Promise<ReminderWithClient[]> {
    try {
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
      
      if (error) {
        console.error('Error fetching reminders:', error)
        throw error
      }
      return data || []
    } catch (error) {
      console.error('Error in remindersApi.getAll:', error)
      throw error
    }
  },

  async getUpcoming(userId: string, days: number = 7): Promise<ReminderWithClient[]> {
    try {
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
      
      if (error) {
        console.error('Error fetching upcoming reminders:', error)
        throw error
      }
      return data || []
    } catch (error) {
      console.error('Error in remindersApi.getUpcoming:', error)
      throw error
    }
  },

  async create(reminder: ReminderInsert): Promise<Reminder> {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .insert(reminder)
        .select()
        .single()
      
      if (error) {
        console.error('Error creating reminder:', error)
        throw error
      }
      return data
    } catch (error) {
      console.error('Error in remindersApi.create:', error)
      throw error
    }
  },

  async update(id: string, updates: ReminderUpdate): Promise<Reminder> {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating reminder:', error)
        throw error
      }
      return data
    } catch (error) {
      console.error('Error in remindersApi.update:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting reminder:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in remindersApi.delete:', error)
      throw error
    }
  },

  async markCompleted(id: string): Promise<Reminder> {
    try {
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
      
      if (error) {
        console.error('Error marking reminder as completed:', error)
        throw error
      }
      return data
    } catch (error) {
      console.error('Error in remindersApi.markCompleted:', error)
      throw error
    }

      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Reminder

  }
}

// Invoice operations
export const invoicesApi = {
  async getAll(userId: string) {
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
    
    if (error) throw error
    return data
  },

  async getOverdue(userId: string) {
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
      .in('status', ['sent', 'pending'])
      .lt('due_date', today)
      .order('due_date', { ascending: true })
    
    if (error) throw error
    return data
  },

  async create(invoice: InvoiceInsert) {
    const { data, error } = await supabase
      .from('invoices')
      .insert(invoice)
      .select()
      .single()
    
    if (error) throw error
    return data as Invoice
  },

  async update(id: string, updates: InvoiceUpdate) {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Invoice
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async markPaid(id: string, paymentMethod?: string) {
    const { data, error } = await supabase
      .from('invoices')
      .update({ 
        status: 'paid',
        payment_date: new Date().toISOString(),
        payment_method: paymentMethod
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Invoice
  }
}

// Profile operations
export const profilesApi = {
  async get(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    
    if (error) throw error
    return data as Profile | null
  },

  async create(profile: ProfileInsert) {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single()
    
    if (error) throw error
    return data as Profile
  },

  async update(userId: string, updates: ProfileUpdate) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data as Profile
  }
}

// Notification operations
export const notificationsApi = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Notification[]
  },

  async getUnread(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Notification[]
  },

  async markAsRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    
    if (error) throw error
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    
    if (error) throw error
  },

  async create(notification: NotificationInsert) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()
    
    if (error) throw error
    return data as Notification
  }
}

// Dashboard stats
export const dashboardApi = {
  async getStats(userId: string) {
    const [clients, reminders, invoices] = await Promise.all([
      clientsApi.getAll(userId),
      remindersApi.getUpcoming(userId),
      invoicesApi.getAll(userId)
    ])

    const activeClients = clients.filter(c => c.status === 'active').length
    const pendingReminders = reminders.filter(r => r.status === 'pending').length
    const pendingInvoices = invoices.filter(i => ['sent', 'pending'].includes(i.status))
    const overdueInvoices = invoices.filter(i => {
      const today = new Date().toISOString().split('T')[0]
      return ['sent', 'pending'].includes(i.status) && i.due_date < today
    })

    const totalPendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0)
    const totalOverdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0)

    return {
      activeClients,
      pendingReminders,
      pendingInvoicesCount: pendingInvoices.length,
      overdueInvoicesCount: overdueInvoices.length,
      totalPendingAmount,
      totalOverdueAmount,
      recentClients: clients.slice(0, 5),
      upcomingReminders: reminders.slice(0, 5),
      recentInvoices: invoices.slice(0, 5)
    }
  }
}

// Currency utilities
export const currencyUtils = {
  // Get user's preferred currency from profile
  async getUserCurrency(userId: string): Promise<string> {
    try {
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