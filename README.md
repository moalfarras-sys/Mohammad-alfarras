# moalfarras.space

Monorepo موحد للموقع العام، صفحة التطبيق، لوحة الإدارة، وتطبيق Android تحت نفس البراند.

## الهيكل النهائي

- `apps/web`
  الموقع الرئيسي على `moalfarras.space`
  ويشمل:
  - `/`
  - `/app`
  - `/privacy`
  - `/support`
  - `public APIs` الخاصة بالتنزيل والدعم
- `apps/admin`
  لوحة الإدارة على `admin.moalfarras.space`
- `android/moplayer`
  مشروع Android / Android TV
- `packages/shared`
  الأنواع المشتركة بين `web` و`admin`
- `supabase`
  المهاجرات والسياسات والبنية المشتركة

## الدومينات

- `https://moalfarras.space`
  الموقع العام والبورتفوليو
- `https://moalfarras.space/app`
  صفحة MoPlayer والتنزيل والإصدارات وFAQ
- `https://moalfarras.space/privacy`
  سياسة الخصوصية
- `https://moalfarras.space/support`
  صفحة الدعم العامة
- `https://admin.moalfarras.space`
  لوحة الإدارة

## التشغيل المحلي

من جذر المشروع:

```bash
npm run build:web
npm run build:admin
npm run build:android
npm run typecheck:web
npm run typecheck:admin
```

للتشغيل التطويري:

```bash
npm run dev:web
npm run dev:admin
```

## البيئة

### `apps/web` و `apps/admin`

المتغيرات العامة:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_WEB_APP_URL`
- `NEXT_PUBLIC_ADMIN_APP_URL`

المتغيرات الحساسة على الخادم فقط:

- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- أي مفاتيح بريد أو تكاملات خادمية إضافية

### Android

يجب استخدام:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

ولا يجب استخدام `service role key` داخل التطبيق إطلاقاً.

## Vercel

يوصى بمشروعين داخل Vercel من نفس الـ monorepo:

1. مشروع `web`
   - Root Directory: `apps/web`
   - Domain: `moalfarras.space`

2. مشروع `admin`
   - Root Directory: `apps/admin`
   - Domain: `admin.moalfarras.space`

الموقع العام يحتوي redirects انتقالية من `/admin` و`/[locale]/admin*` إلى `admin.moalfarras.space`.

## Supabase

مشروع Supabase واحد مشترك يستخدم لـ:

- Auth
- Database
- Storage
- RLS Policies
- بيانات التطبيق والإصدارات والدعم

ملفات المهاجرات موجودة داخل:

- `supabase/migrations`

## نشر إصدار Android جديد

1. ابنِ النسخة الجديدة من:
   - `android/moplayer`
2. حدّث ملف الـ APK المعتمد أو ارفعه إلى Storage حسب flow الإدارة
3. حدّث release metadata من الإدارة
4. أعد نشر `apps/web` إذا لزم

## قواعد النظافة

- لا تحفظ أي `.env*` أو مفاتيح حساسة داخل المستودع
- لا تحفظ keystores أو `local.properties`
- لا تحفظ build artifacts أو screenshots المؤقتة أو XML dumps
- أي ملفات مؤقتة محلية يجب أن تبقى خارج Git
