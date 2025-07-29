import { supabase } from '../supabase'

export interface Project {
  id: string
  name: string
  description: string
  client_id: string
  start_date: string
  end_date: string
  budget: number
  status: 'active' | 'pending' | 'completed'
  user_id: string
  created_at: string
}

export interface ProjectCreate extends Omit<Project, 'id' | 'created_at'> {}

export const projectApi = {
  async create(project: ProjectCreate): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getById(id: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async getAll(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }
}
