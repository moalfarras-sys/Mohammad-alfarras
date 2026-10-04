# moalfarras.space — Site v3 "Hologram Studio"

Owner feedback on v2 (2026-10-04): pages felt text-only (images removed), his signature hologram
portrait was replaced, sections repeat across pages, the CV lost its Developer/Designer mode switch.
He wants an image-rich, very distinctive, easy-to-understand site with impressive motion on phone and
desktop, nothing fake, something that makes visitors come back.

## Frame

- **Subject:** Mohammad Alfarras — web & product designer/developer in Germany (from Al-Hasakah,
  Syria), Arabic tech YouTuber, ex-logistics operator, builder of MoPlayer and MoOS.
- **Audience:** (1) small/medium business owners in Germany and the Arab world who need a website,
  (2) recruiters reading the CV, (3) YouTube viewers and MoPlayer users who return for new things.
- **Single job:** trust in five seconds → start a project (or download an app), and a reason to return.
- **Art direction thesis:** *Hologram Studio* — his signature portrait shows him conjuring design tools
  out of his hand. The site extends that moment: real images first, with glass panels of live,
  real information floating in depth around them.
- **Signature element:** the hologram hero (`HoloPortrait`): `/images/protofeilnew.jpeg` with glass
  chips (live YouTube subscribers, current MoPlayer version, a live client site, languages) that fly
  out of his hand on load and move in 3D with the pointer (desktop) or device tilt / slow drift (phone).
- **Second motion moment:** the work showreel (`Showreel`): sticky laptop + phone stage that swaps
  real client screenshots as you scroll (desktop), swipeable snap carousel (mobile).
- Everything else stays quiet: one entrance language (`Reveal`, `Stagger`, `SplitHeadline`), depth on
  big images (`ParallaxImage`), pointer tilt on media cards (`TiltCard`).

## Tokens (styles/v3-motion.css, layered on the existing studio tokens)

| Token | Value | Use |
|---|---|---|
| `--v3-ink` | `#060a14` | page background |
| `--v3-deep` | `#0b1324` | raised sections, image backdrops |
| `--v3-panel` / `--v3-panel-strong` | navy glass 62% / 86% | glass cards, chips |
| `--v3-holo` | `#4fe3ff` | primary accent (brand cyan, MoPlayer) |
| `--v3-prism` | `#8c7bff` | secondary accent (gradient partner, Designer mode) |
| `--v3-signal` | `#ffb547` | warm accent (MoPlayer Pro, highlights) — sparingly |
| `--v3-text` / `--v3-muted` | `#f2f6ff` / `#93a4bd` | text |
| radius | 22px cards, 34px hero photo, 16px chips | |
| motion | spring 120/20; entrances 0.7–0.85s `cubic-bezier(.16,1,.3,1)`; micro 150–350ms | |

Typography stays as v2 (Inter UI + serif italic accent word in English; Alexandria headings + Cairo
body in Arabic). Accent words: wrap in `*asterisks*` for `SplitHeadline` (gradient holo→prism).

## Motion kit — components/v3/motion-kit.tsx

`Reveal`, `Stagger`, `SplitHeadline`, `ParallaxImage`, `TiltCard`, `CountUp`, `Marquee`,
`HoloPortrait` (+ `HoloChip`), `Showreel` (+ `ShowreelItem`), `ScrollProgress`. Import
`@/styles/v3-motion.css` once in the site layout. All respect `prefers-reduced-motion`.
Use real data only (site-model / CMS / release constants / live YouTube numbers).

## Imagery map (all files exist in apps/web/public/images)

| Image | Where |
|---|---|
| `protofeilnew.jpeg` (hologram portrait) | Home hero (signature), Contact |
| `portrait.jpg` (studio portrait) | CV hero, About |
| `service_web.png` | Services: business websites; Home services teaser |
| `hero_tech.png` | Services: product/launch surfaces; YouTube reviews |
| `service_tech.png` | Services: tech content; YouTube page |
| `service_logistics.png` | Services: execution/operations; About (logistics chapter) |
| `yt-channel-hero.png` | YouTube hero; Home YouTube band |
| `hero-profile-bg.png` | About hero/background, footer art |
| `projects/*-home.webp`, `*-mobile.webp` | Showreel, Work gallery, case pages |
| `moos/*`, `moplayer/classic-2-5/*`, `moplayer-pro-*.webp` | Home products band |
| YouTube thumbnails (live API / fallback) | Home + YouTube |

No page may be text-only: every page opens with a real image and every major section has imagery.

## De-duplication map (each fact lives in ONE place)

| Content | Lives on | Elsewhere only as |
|---|---|---|
| Career timeline (Al-Hasakah → Germany → logistics → web → products) | **About** (story with photos) | CV: concise experience list (roles/dates), no story timeline |
| YouTube stats (views/subs/videos) | **YouTube** page + hero chip | one line in footer max; never repeated blocks |
| Client projects detail | **Work** + case pages | Home showreel (4 items) |
| Services detail + process | **Services** | Home: 3 large image cards linking to Services |
| Products (MoPlayer, MoOS) | their pages | Home: one products band |
| Contact CTA | one contextual CTA per page | footer: compact (no second big headline) |
| Personal intro/philosophy | **About** | CV: 3-line professional summary |

## Page blueprints

### Home (/[locale])
1. **Hero:** headline (SplitHeadline) + one-line lede + 2 CTAs (Start a project / See the work) beside
   `HoloPortrait` (chips: YouTube subscribers [live], MoPlayer version [release data, links to app],
   "Live client sites: N" [count from projects] with a client screenshot, "AR · DE · EN").
   Mobile: portrait first (full width, ~78vh max), headline below, chips smaller.
2. **Client marquee:** domains of live client sites (real), slow marquee.
3. **Showreel:** 4 projects (real screenshots desktop+mobile).
4. **Services teaser:** 3 large image cards (TiltCard + image zoom on hover), each → Services.
5. **Products band:** MoPlayer (real 2.5 screenshot in TV frame) + MoOS (desktop screenshot), big imagery.
6. **YouTube band:** `yt-channel-hero.png` parallax background, 3 latest real videos as thumbnails.
7. **One CTA** (contextual). No timeline, no repeated stats blocks.

### Services
Hero with a large image collage (service_web + service_tech + hero_tech in layered parallax), then
each service as a **full-width image row** (big image 50–60% width, alternating sides, real copy,
deliverables chips), then a 4-step process with animated line draw, then FAQ-style "basics",
then one CTA.

### Work
Hero with a 3-device collage of real client sites. Filter chips (All / websites / platforms /
products). Gallery cards with desktop screenshot and the mobile screenshot sliding up on hover/tap.
Case pages keep their content; add hero image + device frames.

### About (personal story — NOT a CV)
Hero with `hero-profile-bg.png` and studio portrait. Scroll story in chapters with photos:
Al-Hasakah → Germany 2015 → logistics (service_logistics.png) → web & products → YouTube (yt image).
Values (3), languages (with flags), "now" section (what he is building), CTA to CV and to contact.

### CV (recruiter document, restored concept)
Restore the original **Developer Mode / Designer Mode** switch as the hero's centerpiece (tablist):
mode changes accent (holo vs prism), the hook line, the order/emphasis of skills, highlighted projects,
and the terminal card text. Studio portrait. Sections: summary (3 lines), terminal card
(`> whoami` …, real facts), experience list (real roles and dates from the existing CV data),
skills by mode, languages with flags, selected projects (3, with screenshots), downloads (PDF, DOCX,
German PDF, print view — existing working routes). No invented numbers (no "12+ years").

### YouTube
Hero: `yt-channel-hero.png` + live stats (CountUp, real API values). Featured latest video large, grid of
latest videos (real thumbnails), topics (labelled as topics, not fake playlists), subscribe CTA.

### Contact
Split: hologram portrait (smaller, static tilt) + contact methods (WhatsApp, email — real) + the
existing working project form/wizard. Response promise only if true.

### Footer (global)
Compact: logo + one-line positioning, nav columns, socials, legal, small email line. No big headline
that duplicates page CTAs. Optional thin art strip using `hero-profile-bg.png` at low opacity.

## Quality floor
Mobile 390 first, then 768/1440/1920; no horizontal scroll; AA contrast; visible focus; reduced motion;
Arabic RTL mirrored correctly (chips/positions mirrored); LCP image `priority`; lazy below the fold;
keep framer-motion usage inside client islands; no broken images; every link verified.
