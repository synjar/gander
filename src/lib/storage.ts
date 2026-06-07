import { supabase, isSupabaseConfigured } from './supabase'

/** True when Supabase Storage is available for real uploads. */
export const storageEnabled = isSupabaseConfigured

const BUCKET = 'photos'

/**
 * Upload an image to the public `photos` bucket and return its public URL.
 * Requires Supabase to be configured and the user to be signed in (per the
 * storage policies in supabase/schema.sql).
 */
export async function uploadImage(file: File, folder = 'reviews'): Promise<string> {
  if (!supabase) throw new Error('Storage is not configured.')
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  })
  if (error) throw error
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}
