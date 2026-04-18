# Moalfarras Ecosystem
**The Digital Visionary Studio & Product Landscape**

A comprehensive, production-grade monorepo acting as the central hub for the `Moalfarras` brand. This ecosystem manages the premium bilingual portfolio, the MoPlayer Android/Android TV product presence, a deep-integrated admin CMS, and secure backend operations via Supabase.

---

## 🏗 Architecture & Stack
This project runs as a heavily optimized Next.js 16 (App Router) execution, coupled to a headless Supabase backend, styled with Tailwind CSS v4.

- **Framework:** Next.js 16.2.3 (React 19)
- **Styling:** Tailwind CSS v4, Framer Motion, fully custom Light/Dark premium theme system.
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Language:** TypeScript
- **Deployment:** Vercel (Edge computing for fast i18n routing).

## 🗂 Folder Structure
```text
/
├── apps/
│   └── web/                # The main Next.js App Router application
│       ├── src/app/        # Core Routing (App Admin, App Product, Site locales)
│       ├── src/components/ # Reusable UI components & Layout wrappers
│       ├── src/data/       # Static/CMS mock data layers
│       └── src/lib/        # Utilities, API wrappers, internal core logic
├── packages/
│   └── shared/             # Shared typescript definitions and constants
├── android/                # Mobile references / MoPlayer App hooks
└── supabase/               # Backend definitions, migrations, schema backups
```

## 🚀 Setup Instructions

1. **Clone & Install**
   ```bash
   git clone https://github.com/moalfarras-sys/moalfarras-ecosystem.git
   cd moalfarras-ecosystem
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file inside `apps/web/` containing:
   ```env
   # SUPABASE
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role

   # ADMIN CMS AUTHENTICATION
   ADMIN_PASSWORD_HASH=your_bcrypt_hash
   ADMIN_SESSION_SECRET=your_32_byte_secret
   ADMIN_ALLOWLIST=admin@domain.com
   ```

3. **Development**
   Launch the development server:
   ```bash
   cd apps/web
   npm run dev
   ```
   *The main site will run at `http://localhost:3000`.*

## 🔒 Administrative Zones (Hidden & Protected)

The project utilizes two distinct, highly secured dashboard areas:
- **Control Center (`/[locale]/admin`):** The primary CMS for deploying portfolio updates, media management, and CV translations. Protected by AES session cookies and strict email allowlists.
- **MoPlayer Admin (`/admin`):** Separate sub-system strictly managing the backend release processes, download metrics, and support requests for Android / Android TV applications. Controlled by Supabase Admin policies.

## 📱 Android Integration (MoPlayer)
The web application seamlessly bridges the download, update, and API operations for the MoPlayer Android application. 
- APKs and release notes are indexed dynamically.
- Support interfaces route directly from mobile to the `/admin` backend interface.

## ☁️ Deployment

This project is built and optimized for continuous deployment over Vercel. 
- **Build Command:** `npm run build`
- **Output:** Next.js deployment.
- **Domain:** Production deployments are automatically pushed to `moalfarras.space`.

---
*Maintained with strict precision by Mohammad Alfarras.*
