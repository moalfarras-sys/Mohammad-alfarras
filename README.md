# Moalfarras Workspace

Monorepo for the personal website, the unified private admin surface, and the Android app project.

## Projects

```text
C:\Users\Moalfarras\Desktop\Moalfarrasappseit
├── apps
│   ├── web
│   │   ├── public
│   │   └── src
│   │       ├── app
│   │       ├── components
│   │       ├── data
│   │       └── lib
│   └── admin
├── android
│   └── moplayer
├── packages
│   └── shared
└── supabase
```

## Naming

- Web workspace package: `moalfarrasweb`
- Android Studio project name: `MoPlayerapp`
- Android application id: `com.mo.moplayer` (unchanged)
- Primary admin entry: `/admin`

## Public Routes

- `/{locale}`: personal homepage
- `/{locale}/cv`: CV page
- `/{locale}/about`: alias to the same profile/CV surface
- `/{locale}/work`: projects and portfolio
- `/{locale}/work/moplayer`: MoPlayer case study
- `/app`: MoPlayer product and download page
- `/privacy`: privacy policy
- `/support`: app support

## Admin

Primary admin access is unified through:

- `/admin`

From there you can manage:

- Website content
- CV content
- Projects
- Media
- PDFs
- MoPlayer product content
- Releases and APK downloads
- Support requests

Legacy content workspaces still exist under `/{locale}/admin/*`, but they are intended to be entered from `/admin`, not from public navigation.

## Environment

Create `apps/web/.env.local` with the values your deployment uses.

Minimum web/admin env:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

ADMIN_ALLOWLIST=
ADMIN_PASSWORD_HASH=
ADMIN_SESSION_SECRET=
```

## Local Development

From the repo root:

```bash
npm install
```

### Run the website

```bash
npm --prefix apps/web run dev
```

Production build check:

```bash
npm --prefix apps/web run typecheck
npm --prefix apps/web run build
```

### Run the standalone admin workspace

```bash
npm --prefix apps/admin run dev
```

Production build check:

```bash
npm --prefix apps/admin run typecheck
npm --prefix apps/admin run build
```

### Android Studio

Open this folder in Android Studio:

```text
C:\Users\Moalfarras\Desktop\Moalfarrasappseit\android\moplayer
```

The project name shown in Android Studio is now:

```text
MoPlayerapp
```

### Android builds

From the repo root:

```bash
cd android/moplayer
gradlew.bat assembleSideloadDebug
gradlew.bat assembleSideloadRelease
```

Generated APKs are written to:

```text
C:\Users\Moalfarras\Desktop\Moalfarrasappseit\android\moplayer\build-output\app\outputs\apk\sideload\debug
C:\Users\Moalfarras\Desktop\Moalfarrasappseit\android\moplayer\build-output\app\outputs\apk\sideload\release
```

## Branding Assets

Android branding resources live under:

```text
android/moplayer/app/src/main/res/drawable
```

Key resources:

- `moplayer_brand_logo_new.png`
- `logo.xml`
- `icon.xml`
- `tv_banner_image.jpg`

Web branding and app marketing assets live under:

```text
apps/web/public/images
```

## Notes

- `adb` is not currently on the shell PATH in this environment, so CLI install/run was not part of verification.
- Android verification was completed by successful `assembleSideloadDebug` and `assembleSideloadRelease` builds.
- The website and admin were verified locally by running production servers and checking the key routes.
