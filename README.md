# Zentro — Personal Media Downloader

Paste a social media link → the backend downloads it with `yt-dlp` → the file
streams to your iPhone and saves to your Camera Roll. History is logged in
Supabase. Free tier everything.

```
Zentro/
├── render.yaml            # Render blueprint (deploy from repo root)
├── backend/               # Node + Express + yt-dlp
│   ├── server.js
│   ├── build.sh           # downloads yt-dlp + ffmpeg binaries on Render
│   ├── routes/            # download.js, history.js
│   ├── utils/             # platformDetector, ytdlp, mime
│   └── config/            # supabase.js
├── supabase/
│   └── schema.sql         # run in Supabase SQL editor
└── mobile/                # Expo (React Native) iOS app
    ├── App.js
    └── src/               # screens, components, navigation, store, api
```

---

## How a download flows

1. App `POST /download` with `{ url, quality }`.
2. Backend detects platform, runs `yt-dlp` into a temp dir, logs to Supabase,
   and returns metadata + a short-lived `GET /download/file/:id` URL.
3. App streams that URL with `expo-file-system` (real progress bar) and saves
   the result to the Camera Roll with `expo-media-library`.

> Why two steps instead of streaming straight from the POST? Expo's file
> downloader (the thing that gives you progress bars + writes to disk) works
> over GET. POST does the heavy `yt-dlp` work; GET does the byte transfer.

---

## 1) Supabase setup (~3 min)

1. Create a free project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query** → paste all of [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   This creates the `downloads` table and the private `media-cache` storage bucket.
3. **Project Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** secret key → `SUPABASE_SERVICE_ROLE_KEY`
     (server-side only — never put this in the mobile app)

---

## 2) Run the backend locally (Windows) — optional but recommended first

```powershell
# Install yt-dlp + ffmpeg once (using winget):
winget install yt-dlp.yt-dlp
winget install Gyan.FFmpeg

cd C:\Users\ADMIN\Desktop\Zentro\backend
npm install
copy .env.example .env       # then edit .env with your Supabase values
npm run dev
```

Test it:

```powershell
curl http://localhost:3000/health
```

To download from your phone over local Wi-Fi, find your PC's LAN IP
(`ipconfig` → IPv4 Address, e.g. `192.168.1.23`) and use
`http://192.168.1.23:3000` as the mobile API URL.

---

## 3) Deploy backend to Render (free)

1. Push this repo to GitHub.
2. [Render Dashboard](https://dashboard.render.com) → **New → Blueprint** →
   pick your repo. Render reads [`render.yaml`](render.yaml).
3. When prompted, fill the secret env vars:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - (optional) set `ENABLE_CACHE=true` to cache files in Supabase Storage.
4. Click **Apply**. The build runs `build.sh`, which downloads standalone
   `yt-dlp` + static `ffmpeg` into `backend/bin` (no system packages needed).
5. After deploy you get a URL like `https://zentro-backend.onrender.com`.
   Test: open `…/health` in a browser.

> **Free-tier note:** the service sleeps after ~15 min idle, so the *first*
> request after a nap takes ~30–60s to wake. Subsequent downloads are normal.

---

## 4) Run the Expo app on your iPhone

```powershell
cd C:\Users\ADMIN\Desktop\Zentro\mobile
npm install

# Align native module versions with the installed Expo SDK:
npx expo install expo-blur expo-clipboard expo-file-system expo-haptics ^
  expo-linear-gradient expo-media-library expo-sharing expo-status-bar ^
  react-native-gesture-handler react-native-reanimated react-native-safe-area-context ^
  react-native-screens

copy .env.example .env   # set EXPO_PUBLIC_API_URL (LAN IP locally, or your Render URL)

npx expo start
```

On your iPhone:
1. Install **Expo Go** from the App Store.
2. Scan the QR code shown in the terminal (phone + PC on the same Wi-Fi).
3. Paste a link, pick quality, hit **Download**. Approve the Photos permission
   the first time. Videos land in Camera Roll; audio (mp3) is saved to app
   files with a Share button.

> If you change `.env`, restart with `npx expo start -c` to clear the cache.

---

## 5) Environment variables — full list

### Backend (`backend/.env` locally, Render dashboard in prod)

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `PORT` | no | `3000` | Local port (Render injects its own). |
| `YTDLP_PATH` | no | `yt-dlp` / `./bin/yt-dlp` | Path to yt-dlp. `./bin/yt-dlp` on Render. |
| `FFMPEG_LOCATION` | no | *(blank)* / `./bin` | Folder with ffmpeg/ffprobe. Blank = use PATH. |
| `SUPABASE_URL` | for history | `https://abc.supabase.co` | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | for history | `eyJ…` | Service role key (server only). |
| `SUPABASE_BUCKET` | no | `media-cache` | Storage bucket name. |
| `ENABLE_CACHE` | no | `false` | `true` = cache files in Storage for 24h. |

### Mobile (`mobile/.env`)

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `EXPO_PUBLIC_API_URL` | **yes** | `https://zentro-backend.onrender.com` | Backend base URL. Use your PC's LAN IP for local testing. |

---

## 6) Later: sideload a real app (no Expo Go)

When you're ready to install Zentro as a standalone app via MacInCloud:

```powershell
npm install -g eas-cli
cd mobile
eas build -p ios --profile preview   # produces an .ipa you can sideload
```

(You'll need a free Apple ID; the EAS free tier covers personal builds.)

---

## API reference

| Method | Path | Body / Query | Returns |
|---|---|---|---|
| `GET` | `/health` | — | `{ status, uptime }` |
| `POST` | `/download` | `{ url, quality }` | `{ id, title, platform, fileName, fileSize, mime, downloadUrl }` |
| `GET` | `/download/file/:id` | — | the media file (streamed) |
| `GET` | `/history?limit=50` | — | `{ items: [...] }` |

`quality` ∈ `best | 1080p | 720p | 480p | audio`.

---

## Personal-use disclaimer

Zentro is for downloading your own content or content you have the right to
save. Respect each platform's Terms of Service and copyright law.
