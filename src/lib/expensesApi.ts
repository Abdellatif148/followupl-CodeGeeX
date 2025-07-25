// Expense operations
export const expensesApi = {
  async getAll(userId: string) {
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
        console.error("Error fetching expenses:", error)
        throw error
      }

      // Ensure data is properly formatted before returning
      return (Array.isArray(data) ? data : []) as Expense[]
    } catch (err) {
      console.error("Exception in expenses.getAll:", err)
      return [] as Expense[]
    }
  },

  async getById(id: string) {
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
        console.error("Error fetching expense by ID:", error)
        throw error
      }

      return data as Expense
    } catch (err) {
      console.error("Exception in expenses.getById:", err)
      throw err
    }
  },

  async create(expense: ExpenseInsert) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert(expense)
        .select()
        .single()

      if (error) {
        console.error("Error creating expense:", error)
        throw error
      }

      return data as Expense
    } catch (err) {
      console.error("Exception in expenses.create:", err)
      throw err
    }
  },

  async update(id: string, updates: ExpenseUpdate) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error("Error updating expense:", error)
        throw error
      }

      return data as Expense
    } catch (err) {
      console.error("Exception in expenses.update:", err)
      throw err
    }
  },

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

      if (error) {
        console.error("Error deleting expense:", error)
        throw error
      }
    } catch (err) {
      console.error("Exception in expenses.delete:", err)
      throw err
    }
  },

  async getByCategory(userId: string, startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .rpc('get_expense_totals_by_category', {
          user_id_param: userId,
          start_date_param: startDate,
          end_date_param: endDate
        })

      if (error) {
        console.error("Error fetching expenses by category:", error)
        throw error
      }

      return data || []
    } catch (err) {
      console.error("Exception in expenses.getByCategory:", err)
      return []
    }
  },

  async getByClient(userId: string, startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .rpc('get_expense_totals_by_client', {
          user_id_param: userId,
          start_date_param: startDate,
          end_date_param: endDate
        })

      if (error) {
        console.error("Error fetching expenses by client:", error)
        throw error
      }

      return data || []
    } catch (err) {
      console.error("Exception in expenses.getByClient:", err)
      return []
    }
  },

  async getMonthlyTotals(userId: string, year: number) {
    try {
      const { data, error } = await supabase
        .rpc('get_monthly_expense_totals', {
          user_id_param: userId,
          year_param: year
        })

      if (error) {
        console.error("Error fetching monthly expense totals:", error)
        throw error
      }

      return data || []
    } catch (err) {
      console.error("Exception in expenses.getMonthlyTotals:", err)
      return []
    }
  },

  async search(userId: string, query: string) {
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
        console.error("Error searching expenses:", error)
        throw error
      }

      return (Array.isArray(data) ? data : []) as Expense[]
    } catch (err) {
      console.error("Exception in expenses.search:", err)
      return [] as Expense[]
    }
  },

  async getTaxDeductible(userId: string, year: number) {
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
        console.error("Error fetching tax deductible expenses:", error)
        throw error
      }

      return (Array.isArray(data) ? data : []) as Expense[]
    } catch (err) {
      console.error("Exception in expenses.getTaxDeductible:", err)
      return [] as Expense[]
    }
  }
}