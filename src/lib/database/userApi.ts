import { supabase } from '../supabase'

export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'user' | 'client'
  phone?: string
  company?: string
  created_at: string
}

export interface UserCreate extends Omit<User, 'id' | 'created_at'> {}

export const userApi = {
  async create(user: UserCreate): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getById(id: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }
}
