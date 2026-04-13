# GitHub Actions: YouTube Videos Auto-Update

This directory contains GitHub Actions workflows that automate YouTube video data fetching and updates.

## Workflow: `workflows/update-videos.yml`

### Purpose
Automatically fetches recent videos from your YouTube channel using the YouTube Data API v3 and updates `data/videos.json` on a schedule or on-demand.

### Schedule
- **Automatic**: Runs daily at **02:00 UTC** (adjust the cron expression in the workflow if needed).
- **Manual**: Trigger anytime via the GitHub Actions UI under "Workflow dispatch".

### How It Works
1. The workflow checks out your repository.
2. Sets up Node.js 18 (which includes native `fetch` support).
3. Runs `node scripts/fetch-youtube.js` with your credentials.
4. If the fetched data differs from the existing `data/videos.json`, commits and pushes the changes.
5. Uses `[skip ci]` in the commit message to avoid triggering other CI runs.

### Required Secrets

You **must** add two secrets to your GitHub repository for this workflow to function:

#### 1. `YT_CHANNEL_ID`
- **Value**: Your YouTube channel ID (e.g., `UCxxxxxxxxxxxxxxx`).
- **How to find it**: 
  - Go to [YouTube Studio](https://studio.youtube.com).
  - Click your profile picture → **Settings** → **Channel** → **Basic info**.
  - Copy the **Channel ID** field.

#### 2. `YT_API_KEY`
- **Value**: Your YouTube Data API v3 key.
- **How to get it**:
  1. Go to [Google Cloud Console](https://console.cloud.google.com/).
  2. Create a new project (or use an existing one).
  3. Enable the **YouTube Data API v3**.
  4. Go to **Credentials** → **Create Credentials** → **API Key**.
  5. Copy the generated API key.
  6. (Recommended) Restrict the API key to **YouTube Data API v3** only to improve security.

#### How to Add Secrets to Your Repository
1. Go to your GitHub repository.
2. Click **Settings** → **Secrets and variables** → **Actions**.
3. Click **New repository secret** and add:
   - Name: `YT_CHANNEL_ID` | Value: `UCxxxxxxxxxxxxxxx`
   - Name: `YT_API_KEY` | Value: `AIza...`
4. Save. The workflow will automatically use these values.

### Customization

#### Change the Schedule
Edit `.github/workflows/update-videos.yml` and modify the `cron` line under `schedule`:

```yaml
schedule:
  - cron: '0 2 * * *'  # Daily at 02:00 UTC
```

Common examples:
- `0 12 * * *` — Noon UTC daily
- `0 0 * * 0` — Every Sunday at midnight UTC
- `0 */6 * * *` — Every 6 hours

#### Change the Maximum Results
Edit `.github/workflows/update-videos.yml` and adjust `MAX_RESULTS`:

```yaml
env:
  ...
  MAX_RESULTS: 12  # Change to 20, 50, etc.
```

### What Gets Committed

After fetching, the workflow only commits if `data/videos.json` has changed. Each commit:
- Message: `chore(ci): update data/videos.json from YouTube API [skip ci]`
- Author: `github-actions[bot]`
- File: `data/videos.json` (normalized video array)

### Handling Secrets Securely

- **Never hardcode** API keys or channel IDs in the repository.
- Use repository secrets (not accessible via logs or exported variables).
- Rotate your YouTube API key periodically for security.
- If an API key is exposed, immediately delete it and generate a new one.

### Troubleshooting

#### Workflow runs but doesn't commit
- Check that `YT_CHANNEL_ID` and `YT_API_KEY` secrets are set in repository settings.
- Verify the YouTube API v3 is enabled in your Google Cloud project.
- Check the workflow logs for error messages (GitHub Actions UI → Actions tab).

#### "Missing YT credentials" message
- The workflow detected missing secrets and skipped the fetch (intentional safeguard).
- Add the required secrets to your repository.

#### API quota exceeded
- YouTube Data API has quota limits. Check [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Quotas.
- If needed, upgrade your Google Cloud project or request additional quota.

### Local Testing

You can also run the fetch script locally without the workflow:

```bash
CHANNEL_ID=UCxxxx API_KEY=AIza... node scripts/fetch-youtube.js
```

See `scripts/README.md` for full documentation.

### Notes

- The script normalizes YouTube API responses into a canonical schema (`id`, `title_en`, `title_ar`, `description_en`, `description_ar`, `thumbnail`, `publishedAt`, `url`).
- Arabic fields are left empty; fill them manually in `data/videos.json` if you want translations.
- The workflow respects GitHub's rate limits and action quota for your account/organization.
