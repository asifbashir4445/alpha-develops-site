# Alpha Develops — website

Source of **https://alphadevelops.vercel.app** (Vercel project `alphadevelops`).
Connected to Vercel on 9 Nov 2026: every push to `main` auto-deploys to production.

- `index.html` — studio home (Time Burn + Alpha Pulse)
- `alpha-pulse.html` — Alpha Pulse page: "Now on Google Play" launch edition
- `time-burn.html` — Time Burn page
- `install.html` — how-to-install guide
- `alpha-downloader.html` — redirect to the Alpha Pulse page (old name)
- `alpha-pulse-icon.png` — the real Play Store icon (512)

The Alpha Pulse APK is distributed as a **GitHub Release asset** in this repo
(tag `v1.0`): the site buttons link to
`releases/latest/download/alpha-pulse.apk`, which always resolves to the newest published release and streams it directly as an
attachment — no interstitial pages. (Google Drive hosting was tried first and
dropped the same evening: real browsers got Drive's virus-scan warning page.)
Version 1.0 · 6,883,410 bytes ·
SHA-256 e94734cbb96c871b22f33e9569ce2468e9a41a7394347ea163ff621717048878 ·
signed with the Alpha Develops upload key (same key as Google Play).
