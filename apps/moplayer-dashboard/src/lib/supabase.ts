import { createClient } from '@supabase/supabase-js'

const env = import.meta.env as ImportMetaEnv & Record<string, string | undefined>
const url = env.VITE_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const key = env.VITE_SUPABASE_ANON_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

export const supabase = url && key ? createClient(url, key) : null

export type ServerRow = {
  id: string
  name: string
  server_type: 'm3u' | 'xtream'
  base_url: string
  username: string
  password: string
  playlist_url: string
  notes: string
}

export type AeCodeRow = {
  code: string
  server_name: string
  server_type: 'm3u' | 'xtream'
  base_url: string
  username: string
  password: string
  playlist_url: string
  device_label: string
  max_devices: number
  activated_count: number
  expires_at: string | null
  revoked: boolean
  created_at: string
}

export type DeviceActivationRow = {
  device_code: string
  user_code: string
  verification_url: string
  verification_url_complete: string
  device_name: string
  device_label: string
  app_version: string
  status: 'pending' | 'activated' | 'consumed' | 'expired' | 'error'
  server_name: string
  server_type: '' | 'm3u' | 'xtream'
  base_url: string
  username: string
  password: string
  playlist_url: string
  poll_interval_seconds: number
  error_message: string
  expires_at: string
  activated_at: string | null
  consumed_at: string | null
  created_at: string
  updated_at: string
}
