# MoPlayer PC — removing the Windows "Unknown Publisher" warning (free options)

The installer (`MoPlayer-PC-Setup.exe`, Electron + NSIS) is currently **unsigned**, so
Windows SmartScreen shows *"Windows protected your PC"* and Microsoft Defender may
quarantine/delete it. There is **no public free certificate** trusted by SmartScreen the
way paid OV/EV certs are. Realistic paths, cheapest first:

## 1. SignPath Foundation — FREE code signing for open-source (recommended free route)
- Real **OV certificate**, free for qualifying **open-source** projects. It genuinely
  removes the SmartScreen warning (reputation builds over time).
- Requirement: the **PC app source must live in a public repo** with an OSI license and a
  reproducible build (GitHub Actions). Publisher shows as **"SignPath Foundation"**.
- Action: extract `apps/moplayer-pro-windows` into its own public repo (or make a public
  mirror that only contains the PC app), add an OSS license + GitHub Actions build, then
  apply at https://signpath.org/ . Wire electron-builder to sign with the SignPath step.

## 2. Azure Artifact Signing (formerly Trusted Signing) — cheapest PAID (~$10/mo)
- Removes SmartScreen (reputation builds over downloads). As of Apr 2026 self-employed
  individuals can apply without 3-year history — **but US/Canada only**. Owner is in
  Germany → **likely ineligible** today.

## 3. Free mitigations applied / to apply now (don't remove the warning, but help a lot)
- **"Safe install" guide on the PC page** (done): tells users to click *More info → Run
  anyway*, and how to restore the file if Defender quarantines it. Stops abandonment.
- **Submit the .exe to Microsoft Defender** (free, fixes the *deletion*): upload each new
  release at https://www.microsoft.com/en-us/wdsi/filesubmission as a "false positive" so
  Defender stops removing it. Do this for every new version.
- **Host on GitHub Releases** (already done) — trusted origin, not flagged as a bad URL.
- **Publish a SHA-256 checksum** next to each release so users can verify integrity
  (`Get-FileHash file -Algorithm SHA256`).
- **Submit to winget** (free): a winget manifest adds legitimacy and an alternate install
  path. https://github.com/microsoft/winget-pkgs
- **Build reputation**: keep the same publisher/cert and let downloads accumulate — the
  warning fades over time per Microsoft's current SmartScreen model.

## Bottom line
A Germany-based individual's only **free** way to actually remove the warning is **SignPath
(open-source the PC app)**. Otherwise it's ~$10/mo Azure (geo-restricted) or a paid OV/EV
cert (~$200+/yr). Until then, the in-app guide + Defender submission keep users installing
without losing the app.
