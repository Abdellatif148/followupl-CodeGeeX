import { supabase } from './supabase'
import type {
  Client, ClientInsert, ClientUpdate,
  Reminder, ReminderInsert, ReminderUpdate,
  Invoice, InvoiceInsert, InvoiceUpdate,
  Profile, ProfileInsert, ProfileUpdate,
  Notification, NotificationInsert, NotificationUpdate,
  Expense, ExpenseInsert, ExpenseUpdate
} from '../types/database'

// Import the new expenses API
import { expensesApi } from './expensesApi'

// Client operations
export const clientsApi = {
  // ... existing code
