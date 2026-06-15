# AI And Automation Handoff

## Security Boundary

Provider keys must stay server-side. Do not put OpenAI, Gemini, Anthropic, n8n, or automation secrets in Android APKs, public JavaScript, docs, or committed files.

Required server-side environment variable names:

- `AI_ASSISTANT_PROVIDER`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `REQUEST_GUARD_SECRET`
- `ASSISTANT_OTP_SECRET`
- `AUTOMATION_API_KEY`
- `N8N_WEBHOOK_URL`
- `N8N_WEBHOOK_SECRET`

Any key exposed in chat, logs, screenshots, or committed files should be rotated before use.

## Current Assistant Flow

- Website widget calls `/api/ai/site-assistant`. The public standalone AI page is retired; `/en/ai` and `/ar/ai` redirect to the localized home pages and are not in the sitemap.
- Android apps should call `/api/app/assistant` for in-app assistant behavior.
- The app endpoint should receive product/app/screen context and return a short TV-safe answer.
- Conversations, messages, OTP, and feedback are stored server-side in Supabase when configured.

## Automation Flow

- External trusted automation clients post to `/api/automation/events` with `AUTOMATION_API_KEY`.
- The route stores `automation_events`, creates `automation_runs`, writes `automation_inbox`, and dispatches to `N8N_WEBHOOK_URL` when configured.
- n8n callbacks post to `/api/automation/n8n/callback` with `N8N_WEBHOOK_SECRET`.
- Admin reads AI and automation operations from `/ai`.

## Android Assistant Contract

Android apps must not embed model provider keys. Use this request shape when adding in-app assistant UI:

```json
{
  "locale": "en",
  "message": "How do I activate MoPlayer Pro?",
  "history": [],
  "product": "moplayer2",
  "appVersion": "2.3.3",
  "screen": "home",
  "publicDeviceId": "hashed-or-public-device-id"
}
```

The server route should answer with:

```json
{
  "ok": true,
  "provider": "gemini",
  "fallback": false,
  "reply": "Open /activate?product=moplayer2 and enter the device code."
}
```

## Production Checklist

Before publishing any AI/automation change:

```powershell
npm run verify:web
npm run verify:admin
npm run verify:android:classic
npm run verify:android:pro
```

Then smoke check:

- `/api/ai/site-assistant`
- `/api/app/assistant`
- `/api/automation/health`
- `/api/automation/events`
- `/api/automation/n8n/callback`
- `/api/app/config?product=moplayer2`
- Admin `/ai`

## Pending Manual Steps

- Rotate any exposed provider tokens.
- Add fresh secrets to local `.env.local` and Vercel environment variables.
- Review and apply `supabase/migrations/20260526090000_ai_automation_security_hardening.sql` only after database advisor review.
- Confirm n8n workflow accepts `event_id` and returns callback payloads with `event_id`, `status`, and optional `n8n_execution_id`.
