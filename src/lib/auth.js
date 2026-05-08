import { supabase } from './supabaseClient'

export async function getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
}

export async function requireAuth() {
    const session = await getSession()
    return !!session
}