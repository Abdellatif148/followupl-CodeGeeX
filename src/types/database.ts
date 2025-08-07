export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
      }
      clients: {
        Row: Client
        Insert: ClientInsert
        Update: ClientUpdate
      }
      reminders: {
        Row: Reminder
        Insert: ReminderInsert
        Update: ReminderUpdate
      }
      invoices: {
        Row: Invoice
        Insert: InvoiceInsert
        Update: InvoiceUpdate
      }
      expenses: {
        Row: Expense
        Insert: ExpenseInsert
        Update: ExpenseUpdate
      }
      notifications: {
        Row: Notification
        Insert: NotificationInsert
        Update: NotificationUpdate
      }
    }
  }
}

// Profile types
export interface Profile {
  id: string
  full_name: string
  email: string
  plan: 'free' | 'pro' | 'super_pro'
  currency: string
  language: string
  timezone?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface ProfileInsert {
  id: string
  full_name: string
  email: string
  plan?: 'free' | 'pro' | 'super_pro'
  currency?: string
  language?: string
  timezone?: string
  avatar_url?: string
}

export interface ProfileUpdate {
  full_name?: string
  email?: string
  plan?: 'free' | 'pro' | 'super_pro'
  currency?: string
  language?: string
  timezone?: string
  avatar_url?: string
}

// Client types
export interface Client {
  id: string
  user_id: string
  name: string
  email?: string
  phone?: string
  company?: string
  platform: 'fiverr' | 'upwork' | 'direct' | 'other'
  status: 'active' | 'inactive' | 'archived'
  notes?: string
  tags?: string[]
  last_contact?: string
  created_at: string
  updated_at: string
}

export interface ClientInsert {
  user_id: string
  name: string
  email?: string
  phone?: string
  company?: string
  platform: 'fiverr' | 'upwork' | 'direct' | 'other'
  status?: 'active' | 'inactive' | 'archived'
  notes?: string
  tags?: string[]
  last_contact?: string
}

export interface ClientUpdate {
  name?: string
  email?: string
  phone?: string
  company?: string
  platform?: 'fiverr' | 'upwork' | 'direct' | 'other'
  status?: 'active' | 'inactive' | 'archived'
  notes?: string
  tags?: string[]
  last_contact?: string
}

// Reminder types
export interface Reminder {
  id: string
  user_id: string
  client_id?: string
  title: string
  description?: string
  message?: string
  due_date: string
  datetime?: string
  status: 'active' | 'completed' | 'cancelled' | 'pending'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  reminder_type: 'follow_up' | 'payment' | 'project_deadline' | 'custom'
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface ReminderInsert {
  user_id: string
  client_id?: string
  title: string
  description?: string
  message?: string
  due_date: string
  datetime?: string
  status?: 'active' | 'completed' | 'cancelled' | 'pending'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  reminder_type?: 'follow_up' | 'payment' | 'project_deadline' | 'custom'
}

export interface ReminderUpdate {
  client_id?: string
  title?: string
  description?: string
  message?: string
  due_date?: string
  datetime?: string
  status?: 'active' | 'completed' | 'cancelled' | 'pending'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  reminder_type?: 'follow_up' | 'payment' | 'project_deadline' | 'custom'
  completed_at?: string
}

// Invoice types
export interface Invoice {
  id: string
  user_id: string
  client_id: string
  project?: string
  title?: string
  amount: number
  currency: string
  due_date: string
  status: 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'unpaid'
  payment_date?: string
  payment_method?: string
  created_at: string
  updated_at: string
}

export interface InvoiceInsert {
  user_id: string
  client_id: string
  project?: string
  title?: string
  amount: number
  currency?: string
  due_date: string
  status?: 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'unpaid'
  payment_date?: string
  payment_method?: string
}

export interface InvoiceUpdate {
  client_id?: string
  project?: string
  title?: string
  amount?: number
  currency?: string
  due_date?: string
  status?: 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'unpaid'
  payment_date?: string
  payment_method?: string
}

// Expense types
export interface Expense {
  id: string
  user_id: string
  client_id?: string
  title: string
  description?: string
  amount: number
  currency: string
  category: string
  subcategory?: string
  expense_date: string
  payment_method?: string
  tax_deductible: boolean
  status: 'pending' | 'approved' | 'reimbursed' | 'reconciled'
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface ExpenseInsert {
  user_id: string
  client_id?: string
  title: string
  description?: string
  amount: number
  currency?: string
  category: string
  subcategory?: string
  expense_date: string
  payment_method?: string
  tax_deductible?: boolean
  status?: 'pending' | 'approved' | 'reimbursed' | 'reconciled'
  tags?: string[]
}

export interface ExpenseUpdate {
  client_id?: string
  title?: string
  description?: string
  amount?: number
  currency?: string
  category?: string
  subcategory?: string
  expense_date?: string
  payment_method?: string
  tax_deductible?: boolean
  status?: 'pending' | 'approved' | 'reimbursed' | 'reconciled'
  tags?: string[]
}

// Notification types
export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder'
  is_read: boolean
  action_url?: string
  related_type?: 'client' | 'reminder' | 'invoice'
  related_id?: string
  created_at: string
}

export interface NotificationInsert {
  user_id: string
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error' | 'reminder'
  is_read?: boolean
  action_url?: string
  related_type?: 'client' | 'reminder' | 'invoice'
  related_id?: string
}

export interface NotificationUpdate {
  title?: string
  message?: string
  type?: 'info' | 'success' | 'warning' | 'error' | 'reminder'
  is_read?: boolean
  action_url?: string
  related_type?: 'client' | 'reminder' | 'invoice'
  related_id?: string
}