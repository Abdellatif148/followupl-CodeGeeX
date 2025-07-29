import { supabase } from './supabase'
import type {
  Client, ClientInsert, ClientUpdate,
  Reminder, ReminderInsert, ReminderUpdate,
  Invoice, InvoiceInsert, InvoiceUpdate,
  Profile, ProfileInsert, ProfileUpdate,
  Notification, NotificationInsert, NotificationUpdate,
  Expense, ExpenseInsert, ExpenseUpdate,
  ReminderWithClient, InvoiceWithClient, ExpenseWithClient
} from '../types/database'
import { projectApi } from './database/projectApi'
import { userApi } from './database/userApi'

export { projectApi, userApi }

// Client operations
export const clientsApi = {
  async getAll(userId: string): Promise<Client[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching clients:', error)
        throw error
      }
      return data || []
    } catch (error) {
      console.error('Error in clientsApi.getAll:', error)
      throw error
    }
  },

  async getById(id: string): Promise<Client> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('Error fetching client:', error)
        throw error
      }
      return data
    } catch (error) {
      console.error('Error in clientsApi.getById:', error)
      throw error
    }
  },

  async create(client: ClientInsert): Promise<Client> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          ...client,
          last_contact: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error creating client:', error)
        throw error
      }
      return data
    } catch (error) {
      console.error('Error in clientsApi.create:', error)
      throw error
    }
  },

  async update(id: string, updates: ClientUpdate): Promise<Client> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating client:', error)
        throw error
      }
      return data
    } catch (error) {
      console.error('Error in clientsApi.update:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting client:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in clientsApi.delete:', error)
      throw error
    }
  },

  async search(userId: string, query: string): Promise<Client[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,notes.ilike.%${query}%,company.ilike.%${query}%`)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error searching clients:', error)
        throw error
      }
      return data || []
    } catch (error) {
      console.error('Error in clientsApi.search:', error)
      throw error
    }
  }
}

// Reminder operations
export const remindersApi = {
  async sendPushNotification(reminderId: string) {
    try {
      const reminder = await remindersApi.getById(reminderId)
      if (!reminder) return

      const { data: user } = await supabase.auth.getUser()
      if (!user) return

      // Check if user has enabled push notifications
      const { data: profile } = await supabase
        .from('profiles')
        .select('push_notifications_enabled')
        .eq('user_id', user.id)
        .single()

      if (!profile?.push_notifications_enabled) return

      // Get expo push token
      const { data: pushToken } = await supabase
        .from('user_devices')
        .select('expo_push_token')
        .eq('user_id', user.id)
        .single()

      if (!pushToken?.expo_push_token) return

      // Send push notification
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: pushToken.expo_push_token,
          title: 'Followuply',
          body: `⏰ ${reminder.title} is due soon!`,
          data: { 
            reminderId: reminder.id,
            type: 'reminder'
          }
        }),
      })
    } catch (error) {
      console.error('Error sending push notification:', error)
    }
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
  }
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
  }
}

// Invoice operations
export const invoicesApi = {
  async getAll(userId: string): Promise<InvoiceWithClient[]> {
    try {
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
      
      if (error) {
        console.error('Error fetching invoices:', error)
        throw error
      }
      return data || []
    } catch (error) {
      console.error('Error in invoicesApi.getAll:', error)
      throw error
    }
  },

  async getOverdue(userId: string): Promise<InvoiceWithClient[]> {
    try {
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
        .in('status', ['sent', 'pending', 'unpaid'])
        .lt('due_date', today)
        .order('due_date', { ascending: true })
      
      if (error) {
        console.error('Error fetching overdue invoices:', error)
        throw error
      }
      return data || []
    } catch (error) {
      console.error('Error in invoicesApi.getOverdue:', error)
      throw error
    }
  },

  async create(invoice: InvoiceInsert): Promise<Invoice> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert(invoice)
        .select()
        .single()
      
      if (error) {
        console.error('Error creating invoice:', error)
        throw error
      }
      return data
    } catch (error) {
      console.error('Error in invoicesApi.create:', error)
      throw error
    }
  },

  async update(id: string, updates: InvoiceUpdate): Promise<Invoice> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating invoice:', error)
        throw error
      }
      return data
    } catch (error) {
      console.error('Error in invoicesApi.update:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting invoice:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in invoicesApi.delete:', error)
      throw error
    }
  },

  async markPaid(id: string, paymentMethod?: string): Promise<Invoice> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update({ 
          status: 'paid',
          payment_date: new Date().toISOString(),
          payment_method: paymentMethod,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error marking invoice as paid:', error)
        throw error
      }
      return data
    } catch (error) {
      console.error('Error in invoicesApi.markPaid:', error)
      throw error
    }
  }
}

// Profile operations
export const profilesApi = {
  async get(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      
      if (error) {
        console.error('Error fetching profile:', error)
        throw error
      }
      return data
    } catch (error) {
      console.error('Error in profilesApi.get:', error)
      throw error
    }
  },

  async create(profile: ProfileInsert): Promise<Profile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single()
      
      if (error) {
        console.error('Error creating profile:', error)
        throw error
      }
      return data
    } catch (error) {
      console.error('Error in profilesApi.create:', error)
      throw error
    }
  },

  async update(userId: string, updates: ProfileUpdate): Promise<Profile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating profile:', error)
        throw error
      }
      return data
    } catch (error) {
      console.error('Error in profilesApi.update:', error)
      throw error
    }
  }
}

// Notification operations
export const notificationsApi = {
  async getAll(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching notifications:', error)
        throw error
      }
      return data || []
    } catch (error) {
      console.error('Error in notificationsApi.getAll:', error)
      throw error
    }
  },

  async getUnread(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching unread notifications:', error)
        throw error
      }
      return data || []
    } catch (error) {
      console.error('Error in notificationsApi.getUnread:', error)
      throw error
    }
  },

  async markAsRead(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
      
      if (error) {
        console.error('Error marking notification as read:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in notificationsApi.markAsRead:', error)
      throw error
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)
      
      if (error) {
        console.error('Error marking all notifications as read:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in notificationsApi.markAllAsRead:', error)
      throw error
    }
  },

  async create(notification: NotificationInsert): Promise<Notification> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single()
      
      if (error) {
        console.error('Error creating notification:', error)
        throw error
      }
      return data
    } catch (error) {
      console.error('Error in notificationsApi.create:', error)
      throw error
    }
  }
}

// Expense operations
export const expensesApi = {
  async getAll(userId: string): Promise<ExpenseWithClient[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          clients (
            id,
            name,
            platform
          )
        `)
        .eq('user_id', userId)
        .order('expense_date', { ascending: false })
      
      if (error) {
        console.error('Error fetching expenses:', error)
        throw error
      }
      return data || []
    } catch (error) {
      console.error('Error in expensesApi.getAll:', error)
      return []
    }
  },

  async getById(id: string): Promise<ExpenseWithClient> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          clients (
            id,
            name,
            platform
          )
        `)
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('Error fetching expense:', error)
        throw error
      }
      return data
    } catch (error) {
      console.error('Error in expensesApi.getById:', error)
      throw error
    }
  },

  async create(expense: ExpenseInsert): Promise<Expense> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert(expense)
        .select()
        .single()
      
      if (error) {
        console.error('Error creating expense:', error)
        throw error
      }
      return data
    } catch (error) {
      console.error('Error in expensesApi.create:', error)
      throw error
    }
  },

  async update(id: string, updates: ExpenseUpdate): Promise<Expense> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating expense:', error)
        throw error
      }
      return data
    } catch (error) {
      console.error('Error in expensesApi.update:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting expense:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in expensesApi.delete:', error)
      throw error
    }
  },

  async getByCategory(userId: string, startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('category, amount, currency')
        .eq('user_id', userId)
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
      
      if (error) {
        console.error('Error fetching expenses by category:', error)
        throw error
      }
      
      // Group by category and sum amounts
      const categoryTotals = (data || []).reduce((acc, expense) => {
        const category = expense.category
        if (!acc[category]) {
          acc[category] = 0
        }
        acc[category] += expense.amount
        return acc
      }, {} as Record<string, number>)
      
      return Object.entries(categoryTotals).map(([category, total]) => ({
        category,
        total
      }))
    } catch (error) {
      console.error('Error in expensesApi.getByCategory:', error)
      return []
    }
  },

  async getByClient(userId: string, startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          amount, 
          currency,
          clients (
            id,
            name
          )
        `)
        .eq('user_id', userId)
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
        .not('client_id', 'is', null)
      
      if (error) {
        console.error('Error fetching expenses by client:', error)
        throw error
      }
      
      // Group by client and sum amounts
      const clientTotals = (data || []).reduce((acc, expense) => {
        if (!expense.clients) return acc
        
        const clientId = expense.clients.id
        const clientName = expense.clients.name
        
        if (!acc[clientId]) {
          acc[clientId] = {
            client_id: clientId,
            client_name: clientName,
            total: 0
          }
        }
        acc[clientId].total += expense.amount
        return acc
      }, {} as Record<string, any>)
      
      return Object.values(clientTotals)
    } catch (error) {
      console.error('Error in expensesApi.getByClient:', error)
      return []
    }
  },

  async getMonthlyTotals(userId: string, year: number) {
    try {
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`
      
      const { data, error } = await supabase
        .from('expenses')
        .select('amount, expense_date')
        .eq('user_id', userId)
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
      
      if (error) {
        console.error('Error fetching monthly expense totals:', error)
        throw error
      }
      
      // Initialize array with 12 months
      const monthlyTotals = Array(12).fill(0).map((_, index) => ({
        month: index + 1,
        total: 0
      }))
      
      // Group by month and sum amounts
      ;(data || []).forEach(expense => {
        const month = new Date(expense.expense_date).getMonth()
        monthlyTotals[month].total += expense.amount
      })
      
      return monthlyTotals
    } catch (error) {
      console.error('Error in expensesApi.getMonthlyTotals:', error)
      return Array(12).fill(0).map((_, index) => ({
        month: index + 1,
        total: 0
      }))
    }
  },

  async search(userId: string, query: string): Promise<ExpenseWithClient[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          clients (
            id,
            name,
            platform
          )
        `)
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .order('expense_date', { ascending: false })
      
      if (error) {
        console.error('Error searching expenses:', error)
        throw error
      }
      return data || []
    } catch (error) {
      console.error('Error in expensesApi.search:', error)
      return []
    }
  },

  async getTaxDeductible(userId: string, year: number): Promise<ExpenseWithClient[]> {
    try {
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`
      
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          clients (
            id,
            name,
            platform
          )
        `)
        .eq('user_id', userId)
        .eq('tax_deductible', true)
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
        .order('expense_date', { ascending: false })
      
      if (error) {
        console.error('Error fetching tax deductible expenses:', error)
        throw error
      }
      return data || []
    } catch (error) {
      console.error('Error in expensesApi.getTaxDeductible:', error)
      return []
    }
  }
}

// Dashboard stats
export const dashboardApi = {
  async getStats(userId: string) {
    try {
      const [clients, reminders, invoices, expenses] = await Promise.all([
        clientsApi.getAll(userId),
        remindersApi.getUpcoming(userId),
        invoicesApi.getAll(userId),
        expensesApi.getAll(userId)
      ])

      const activeClients = clients.filter((c: Client) => c.status === 'active').length
      const pendingReminders = reminders.filter((r: any) => ['pending', 'active'].includes(r.status)).length
      const pendingInvoices = invoices.filter((i: any) => ['sent', 'pending', 'unpaid'].includes(i.status))
      const overdueInvoices = invoices.filter((i: any) => {
        const today = new Date().toISOString().split('T')[0]
        return ['sent', 'pending', 'unpaid'].includes(i.status) && i.due_date < today
      })

      const totalPendingAmount = pendingInvoices.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0)
      const totalOverdueAmount = overdueInvoices.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0)
      
      // Calculate expense stats
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth()
      const currentYear = currentDate.getFullYear()
      
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1).toISOString()
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString()
      
      const currentMonthExpenses = expenses.filter((e: any) =>
        e.expense_date >= firstDayOfMonth && e.expense_date <= lastDayOfMonth
      )
      
      const totalMonthlyExpenses = currentMonthExpenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
      
      // Get top expense category
      const categoryTotals: Record<string, number> = {}
      currentMonthExpenses.forEach((expense: any) => {
        if (!categoryTotals[expense.category]) {
          categoryTotals[expense.category] = 0
        }
        categoryTotals[expense.category] += expense.amount || 0
      })
      
      const topExpenseCategory = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .map(([category, amount]) => ({ category, amount }))[0] || null

      return {
        activeClients,
        pendingReminders,
        pendingInvoicesCount: pendingInvoices.length,
        overdueInvoicesCount: overdueInvoices.length,
        totalPendingAmount,
        totalOverdueAmount,
        recentClients: clients.slice(0, 5),
        upcomingReminders: reminders.slice(0, 5),
        recentInvoices: invoices.slice(0, 5),
        totalMonthlyExpenses,
        topExpenseCategory,
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