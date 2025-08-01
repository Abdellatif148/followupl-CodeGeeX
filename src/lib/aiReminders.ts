import { supabase } from './supabase'
import { remindersApi, clientsApi, invoicesApi, notificationsApi } from './database'

interface AIReminderSuggestion {
  title: string
  message: string
  due_date: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  reminder_type: 'follow_up' | 'payment' | 'project_deadline' | 'custom'
}

export const aiReminders = {
  // Generate AI reminder suggestions based on client activity
  async generateSuggestions(userId: string): Promise<AIReminderSuggestion[]> {
    try {
      const [clients, invoices, reminders] = await Promise.all([
        clientsApi.getAll(userId),
        invoicesApi.getAll(userId),
        remindersApi.getAll(userId)
      ])

      const suggestions: AIReminderSuggestion[] = []
      const now = new Date()

      // Check for unpaid invoices that need follow-up
      for (const invoice of invoices) {
        if (invoice.status === 'unpaid' || invoice.status === 'pending') {
          const dueDate = new Date(invoice.due_date)
          const daysSinceDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          
          // Suggest follow-up for overdue invoices
          if (daysSinceDue > 0) {
            const hasRecentReminder = reminders.some(r => 
              r.client_id === invoice.client_id && 
              r.reminder_type === 'payment' &&
              new Date(r.created_at).getTime() > (now.getTime() - 7 * 24 * 60 * 60 * 1000) // Within last 7 days
            )

            if (!hasRecentReminder) {
              suggestions.push({
                title: `Follow up on overdue payment`,
                message: `Invoice for "${invoice.title}" is ${daysSinceDue} days overdue. Consider following up with the client.`,
                due_date: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
                priority: daysSinceDue > 7 ? 'urgent' : 'high',
                reminder_type: 'payment'
              })
            }
          }
          
          // Suggest reminder for invoices due soon
          else if (daysSinceDue >= -3 && daysSinceDue <= 0) {
            const hasRecentReminder = reminders.some(r => 
              r.client_id === invoice.client_id && 
              r.reminder_type === 'payment' &&
              new Date(r.created_at).getTime() > (now.getTime() - 3 * 24 * 60 * 60 * 1000) // Within last 3 days
            )

            if (!hasRecentReminder) {
              suggestions.push({
                title: `Payment reminder for upcoming due date`,
                message: `Invoice for "${invoice.title}" is due ${daysSinceDue === 0 ? 'today' : `in ${Math.abs(daysSinceDue)} days`}. Send a friendly reminder.`,
                due_date: dueDate.toISOString(),
                priority: 'medium',
                reminder_type: 'payment'
              })
            }
          }
        }
      }

      // Check for clients who haven't been contacted recently
      for (const client of clients.filter(c => c.status === 'active')) {
        const lastContact = client.last_contact ? new Date(client.last_contact) : new Date(client.created_at)
        const daysSinceContact = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysSinceContact > 14) { // No contact for 2+ weeks
          const hasRecentReminder = reminders.some(r => 
            r.client_id === client.id && 
            r.reminder_type === 'follow_up' &&
            new Date(r.created_at).getTime() > (now.getTime() - 7 * 24 * 60 * 60 * 1000) // Within last 7 days
          )

          if (!hasRecentReminder) {
            suggestions.push({
              title: `Follow up with ${client.name}`,
              message: `It's been ${daysSinceContact} days since your last contact with ${client.name}. Consider reaching out to maintain the relationship.`,
              due_date: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
              priority: daysSinceContact > 30 ? 'high' : 'medium',
              reminder_type: 'follow_up'
            })
          }
        }
      }

      return suggestions.slice(0, 5) // Return top 5 suggestions
    } catch (error) {
      console.error('Error generating AI suggestions:', error)
      return []
    }
  },

  // Create AI-suggested reminders
  async createSuggestedReminders(userId: string, suggestions: AIReminderSuggestion[]) {
    try {
      const createdReminders = []

      for (const suggestion of suggestions) {
        // Find the related client based on the suggestion context
        const clients = await clientsApi.getAll(userId)
        const relatedClient = clients.find(c => 
          suggestion.message.includes(c.name) || 
          suggestion.title.includes(c.name)
        )

        const reminderData = {
          user_id: userId,
          client_id: relatedClient?.id || null,
          title: suggestion.title,
          message: suggestion.message,
          due_date: suggestion.due_date,
          priority: suggestion.priority,
          reminder_type: suggestion.reminder_type,
          ai_suggested: true,
          status: 'pending' as const
        }

        const reminder = await remindersApi.create(reminderData)
        createdReminders.push(reminder)

        // Create notification for the user
        await notificationsApi.create({
          user_id: userId,
          title: 'AI Reminder Created',
          message: `AI suggested: ${suggestion.title}`,
          type: 'reminder',
          related_id: reminder.id,
          related_type: 'reminder'
        })
      }

      return createdReminders
    } catch (error) {
      console.error('Error creating AI suggested reminders:', error)
      return []
    }
  },

  // Auto-generate daily AI suggestions
  async runDailyAISuggestions(userId: string) {
    try {
      const suggestions = await this.generateSuggestions(userId)
      
      if (suggestions.length > 0) {
        // Create notification about available suggestions
        await notificationsApi.create({
          user_id: userId,
          title: 'AI Suggestions Available',
          message: `${suggestions.length} new AI-powered reminder suggestions are ready for review.`,
          type: 'info'
        })

        // Optionally auto-create high-priority suggestions
        const urgentSuggestions = suggestions.filter(s => s.priority === 'urgent')
        if (urgentSuggestions.length > 0) {
          await this.createSuggestedReminders(userId, urgentSuggestions)
        }
      }

      return suggestions
    } catch (error) {
      console.error('Error running daily AI suggestions:', error)
      return []
    }
  }
}