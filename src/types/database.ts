export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          currency: string
          timezone: string
          language: string
          plan: 'free' | 'pro' | 'super_pro'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          currency?: string
          timezone?: string
          language?: string
          plan?: 'free' | 'pro' | 'super_pro'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          currency?: string
          timezone?: string
          language?: string
          plan?: 'free' | 'pro' | 'super_pro'
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string | null
          phone: string | null
          platform: 'fiverr' | 'upwork' | 'direct' | 'other'
          platform_profile: string | null
          contact_method: 'email' | 'whatsapp' | 'telegram' | 'discord' | 'other'
          notes: string | null
          tags: string[]
          status: 'active' | 'inactive' | 'archived'
          total_projects: number
          total_earned: number
          last_contact: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email?: string | null
          phone?: string | null
          platform?: 'fiverr' | 'upwork' | 'direct' | 'other'
          platform_profile?: string | null
          contact_method?: 'email' | 'whatsapp' | 'telegram' | 'discord' | 'other'
          notes?: string | null
          tags?: string[]
          status?: 'active' | 'inactive' | 'archived'
          total_projects?: number
          total_earned?: number
          last_contact?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          platform?: 'fiverr' | 'upwork' | 'direct' | 'other'
          platform_profile?: string | null
          contact_method?: 'email' | 'whatsapp' | 'telegram' | 'discord' | 'other'
          notes?: string | null
          tags?: string[]
          status?: 'active' | 'inactive' | 'archived'
          total_projects?: number
          total_earned?: number
          last_contact?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reminders: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          title: string
          message: string | null
          due_date: string
          reminder_type: 'follow_up' | 'payment' | 'project_deadline' | 'custom'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          status: 'pending' | 'completed' | 'snoozed' | 'cancelled'
          is_recurring: boolean
          recurring_interval: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          ai_suggested: boolean
          completed_at: string | null
          snoozed_until: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          title: string
          message?: string | null
          due_date: string
          reminder_type?: 'follow_up' | 'payment' | 'project_deadline' | 'custom'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'pending' | 'completed' | 'snoozed' | 'cancelled'
          is_recurring?: boolean
          recurring_interval?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          ai_suggested?: boolean
          completed_at?: string | null
          snoozed_until?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          title?: string
          message?: string | null
          due_date?: string
          reminder_type?: 'follow_up' | 'payment' | 'project_deadline' | 'custom'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'pending' | 'completed' | 'snoozed' | 'cancelled'
          is_recurring?: boolean
          recurring_interval?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          ai_suggested?: boolean
          completed_at?: string | null
          snoozed_until?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          client_id: string
          invoice_number: string | null
          title: string
          description: string | null
          amount: number
          currency: string
          due_date: string
          status: 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled'
          payment_method: string | null
          payment_date: string | null
          late_fee: number
          notes: string | null
          reminder_sent_count: number
          last_reminder_sent: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id: string
          invoice_number?: string | null
          title: string
          description?: string | null
          amount: number
          currency?: string
          due_date: string
          status?: 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled'
          payment_method?: string | null
          payment_date?: string | null
          late_fee?: number
          notes?: string | null
          reminder_sent_count?: number
          last_reminder_sent?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string
          invoice_number?: string | null
          title?: string
          description?: string | null
          amount?: number
          currency?: string
          due_date?: string
          status?: 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled'
          payment_method?: string | null
          payment_date?: string | null
          late_fee?: number
          notes?: string | null
          reminder_sent_count?: number
          last_reminder_sent?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error' | 'reminder'
          is_read: boolean
          action_url: string | null
          related_id: string | null
          related_type: 'client' | 'reminder' | 'invoice' | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: 'info' | 'success' | 'warning' | 'error' | 'reminder'
          is_read?: boolean
          action_url?: string | null
          related_id?: string | null
          related_type?: 'client' | 'reminder' | 'invoice' | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'info' | 'success' | 'warning' | 'error' | 'reminder'
          is_read?: boolean
          action_url?: string | null
          related_id?: string | null
          related_type?: 'client' | 'reminder' | 'invoice' | null
          created_at?: string
        }
      }
    }
  }
}

export type Client = Database['public']['Tables']['clients']['Row']
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type ClientUpdate = Database['public']['Tables']['clients']['Update']

export type Reminder = Database['public']['Tables']['reminders']['Row']
export type ReminderInsert = Database['public']['Tables']['reminders']['Insert']
export type ReminderUpdate = Database['public']['Tables']['reminders']['Update']

export type Invoice = Database['public']['Tables']['invoices']['Row']
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']