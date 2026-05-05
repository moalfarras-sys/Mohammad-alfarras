import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CheckCircle2, Cloud, KeyRound, Link2, Monitor, RefreshCw, Shield, Tv, Wifi } from 'lucide-react'
import { supabase, type DeviceActivationRow } from './lib/supabase'
import './styles.css'

function clean(value: string) {
  return value.trim()
}

function safeError(message: string) {
  return message
    .replace(/username=[^&\s]+/gi, 'username=***')
    .replace(/password=[^&\s]+/gi, 'password=***')
    .replace(/\/\/([^/\s:]+):([^@\s]+)@/g, '//***:***@')
}

function parseDeviceCode() {
  const params = new URLSearchParams(window.location.search)
  return clean(params.get('device_code') ?? '')
}

function maskEndpoint(value: string) {
  try {
    const url = new URL(value)
    return `${url.protocol}//${url.host}/...`
  } catch {
    return value ? 'configured' : 'not set'
  }
}

function App() {
  const deviceCode = useMemo(parseDeviceCode, [])
  const [activation, setActivation] = useState<DeviceActivationRow | null>(null)
  const [status, setStatus] = useState(!supabase ? 'Supabase is not configured for this dashboard.' : 'Ready.')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    server_name: 'Premium IPTV',
    server_type: 'xtream' as 'm3u' | 'xtream',
    base_url: '',
    username: '',
    password: '',
    playlist_url: '',
  })

  useEffect(() => {
    void loadActivation()
  }, [])

  async function loadActivation() {
    if (!supabase) return
    if (!deviceCode) {
      setStatus('Open this page from the QR code on your TV.')
      return
    }
    const { data, error } = await supabase
      .from('device_activation_codes')
      .select('*')
      .eq('device_code', deviceCode)
      .limit(1)
      .maybeSingle()
    if (error) {
      setStatus(safeError(error.message))
      return
    }
    if (!data) {
      setStatus('This activation code was not found or has expired.')
      return
    }
    const row = data as DeviceActivationRow
    setActivation(row)
    if (new Date(row.expires_at).getTime() <= Date.now() && row.status === 'pending') {
      setStatus('This QR code has expired. Refresh the QR code on the TV.')
    } else {
      setStatus(row.status === 'pending' ? 'Confirm the device and attach an IPTV profile.' : `Activation status: ${row.status}`)
    }
  }

  const canSubmit = form.server_type === 'xtream'
    ? clean(form.server_name) && clean(form.base_url) && clean(form.username) && clean(form.password)
    : clean(form.server_name) && clean(form.playlist_url)

  async function activateDevice() {
    if (!supabase || !activation || !canSubmit) return
    setSaving(true)
    setStatus('Activating TV...')
    const payload = {
      status: 'activated',
      server_name: clean(form.server_name),
      server_type: form.server_type,
      base_url: clean(form.base_url),
      username: clean(form.username),
      password: form.password,
      playlist_url: clean(form.playlist_url),
      activated_at: new Date().toISOString(),
      error_message: '',
    }
    const { error } = await supabase
      .from('device_activation_codes')
      .update(payload)
      .eq('device_code', activation.device_code)
      .eq('status', 'pending')
    if (error) setStatus(safeError(error.message))
    else {
      setStatus('Activated. The TV will sync automatically.')
      await loadActivation()
      setForm({ ...form, password: '' })
    }
    setSaving(false)
  }

  const expired = activation ? new Date(activation.expires_at).getTime() <= Date.now() : false

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><img src="/mo-logo.png" alt="" /><span>MoPlayer Control</span></div>
        <nav>
          <a className="active"><KeyRound size={18}/>Activation</a>
          <a><Cloud size={18}/>Profiles</a>
          <a><Monitor size={18}/>Devices</a>
          <a><Shield size={18}/>Security</a>
        </nav>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>TV Activation</h1>
            <p><Wifi size={15}/>{status}</p>
          </div>
          <button onClick={loadActivation}><RefreshCw size={17}/>Refresh</button>
        </header>

        <section className="hero">
          <div>
            <h2>Pair this Android TV without typing passwords on the TV.</h2>
            <p>Confirm the device name, choose Xtream or M3U, and MoPlayer will receive only the activated profile through the short-lived device code.</p>
          </div>
          <div className="tv-card">
            <Tv size={44}/>
            <strong>{activation?.user_code ?? 'NO CODE'}</strong>
            <span>{activation ? activation.device_name : 'Scan the TV QR code'}</span>
          </div>
        </section>

        <section className="grid">
          <div className="panel form-panel">
            <h3>Attach IPTV profile</h3>
            <label>Device<input readOnly value={activation ? `${activation.device_name} (${activation.app_version || 'app'})` : 'Waiting for QR'} /></label>
            <label>Server name<input value={form.server_name} onChange={e => setForm({ ...form, server_name: e.target.value })}/></label>
            <label>Type<select value={form.server_type} onChange={e => setForm({ ...form, server_type: e.target.value as 'm3u' | 'xtream' })}><option value="xtream">Xtream</option><option value="m3u">M3U</option></select></label>
            {form.server_type === 'xtream' ? (
              <>
                <label>Portal URL<input value={form.base_url} onChange={e => setForm({ ...form, base_url: e.target.value })}/></label>
                <div className="split"><label>User<input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}/></label><label>Password<input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}/></label></div>
              </>
            ) : (
              <label>M3U URL<input value={form.playlist_url} onChange={e => setForm({ ...form, playlist_url: e.target.value })}/></label>
            )}
            <button onClick={activateDevice} disabled={!activation || expired || activation.status !== 'pending' || !canSubmit || saving}><CheckCircle2 size={18}/>{saving ? 'Activating' : 'Activate TV'}</button>
          </div>

          <div className="panel">
            <h3>Device status</h3>
            <div className="list">
              <div className="row"><div><strong>User code</strong><span>{activation?.user_code ?? '-'}</span></div><KeyRound size={18}/></div>
              <div className="row"><div><strong>Status</strong><span>{activation?.status ?? 'not loaded'}</span></div><Shield size={18}/></div>
              <div className="row"><div><strong>Expires</strong><span>{activation ? new Date(activation.expires_at).toLocaleString() : '-'}</span></div><RefreshCw size={18}/></div>
              <div className="row"><div><strong>Endpoint</strong><span>{maskEndpoint(form.base_url || form.playlist_url)}</span></div><Link2 size={18}/></div>
            </div>
          </div>

          <div className="panel wide">
            <h3>Security notes</h3>
            <p className="muted">The TV never displays IPTV passwords. Device codes are short-lived and the TV marks a successful activation as consumed after it receives the profile.</p>
          </div>
        </section>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
