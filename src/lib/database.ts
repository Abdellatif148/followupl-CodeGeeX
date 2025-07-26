import { supabase } from './supabase'
import type {
  Client, ClientInsert, ClientUpdate,
  Reminder, ReminderInsert, ReminderUpdate,
  Invoice, InvoiceInsert, InvoiceUpdate,
  Profile, ProfileInsert, ProfileUpdate,
  Notification, NotificationInsert, NotificationUpdate,
  Expense, ExpenseInsert, ExpenseUpdate
} from '../types/database'

// Client operations
export const clientsApi = {
  async getAll(userId: string): Promise<Client[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching clients:', error)
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
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching client:', error)
      throw error
    }
  },

  async create(client: ClientInsert): Promise<Client> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert(client)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating client:', error)
      throw error
    }
  },

  async update(id: string, updates: ClientUpdate): Promise<Client> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating client:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      console.error('Error deleting client:', error)
      throw error
    }
  },

  async search(userId: string, query: string): Promise<Client[]> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,notes.ilike.%${query}%`)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error searching clients:', error)
      throw error
    }
  }
}

// Reminder operations
export const remindersApi = {
  async getAll(userId: string) {
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
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching reminders:', error)
      throw error
    }
  },

  async getUpcoming(userId: string, days: number = 7) {
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
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching upcoming reminders:', error)
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
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating reminder:', error)
      throw error
    }
  },

  async update(id: string, updates: ReminderUpdate): Promise<Reminder> {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .update(updates)
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
      const { data, error } = await supabase
        .from('reminders')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
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
  async getAll(userId: string) {
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
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching invoices:', error)
      throw error
    }
  },

  async getOverdue(userId: string) {
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
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching overdue invoices:', error)
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
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating invoice:', error)
      throw error
    }
  },

  async update(id: string, updates: InvoiceUpdate): Promise<Invoice> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
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
      return data
    } catch (error) {
      console.error('Error marking invoice as paid:', error)
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
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
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
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating profile:', error)
      throw error
    }
  },

  async update(userId: string, updates: ProfileUpdate): Promise<Profile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating profile:', error)
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
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching notifications:', error)
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
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching unread notifications:', error)
      throw error
    }
  },

  async markAsRead(id: string): Promise<void> {
    try {
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
      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
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

// Expense operations
export const expensesApi = {
  async getAll(userId: string): Promise<Expense[]> {
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
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching expenses:', error)
      return []
    }
  },

  async getById(id: string): Promise<Expense> {
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
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching expense:', error)
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
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating expense:', error)
      throw error
    }
  },

  async update(id: string, updates: ExpenseUpdate): Promise<Expense> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating expense:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      console.error('Error deleting expense:', error)
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
      
      if (error) throw error
      
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
      console.error('Error fetching expenses by category:', error)
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
      
      if (error) throw error
      
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
      console.error('Error fetching expenses by client:', error)
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
      
      if (error) throw error
      
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
      console.error('Error fetching monthly expense totals:', error)
      return Array(12).fill(0).map((_, index) => ({
        month: index + 1,
        total: 0
      }))
    }
  },

  async search(userId: string, query: string): Promise<Expense[]> {
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
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error searching expenses:', error)
      return []
    }
  },

  async getTaxDeductible(userId: string, year: number): Promise<Expense[]> {
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
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching tax deductible expenses:', error)
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
      
      const currentMonthExpenses = expenses.filter((e: Expense) =>
        e.expense_date >= firstDayOfMonth && e.expense_date <= lastDayOfMonth
      )
      
      const totalMonthlyExpenses = currentMonthExpenses.reduce((sum: number, exp: Expense) => sum + (exp.amount || 0), 0)
      
      // Get top expense category
      const categoryTotals: Record<string, number> = {}
      currentMonthExpenses.forEach((expense: Expense) => {
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