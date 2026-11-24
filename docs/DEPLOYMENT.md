# FLOVA: Deployment & Operations Guide

## 1. Overview
FLOVA is deployed across three environments:
1. **Frontend PWA:** Static SPA deployed to Vercel or Cloudflare Pages.
2. **Serverless Functions:** Supabase Edge Functions deployed to Deno runtime (`msjzkylvafuwlkkujxpv`).
3. **STT Microservice:** Python FastAPI service deployed via Docker / systemd daemon.

---

## 2. Frontend Deployment (Vercel / Static Hosting)

The frontend uses Vite SPA routing. A `vercel.json` rewrites client routes to `/index.html`, explicitly excluding `/.well-known/` for Android App Links verification:

```json
{
  "rewrites": [
    {
      "source": "/((?!\\.well-known/).*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/.well-known/assetlinks.json",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/json"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600, s-maxage=3600"
        }
      ]
    }
  ]
}
```

### Build Command
```bash
cd frontend
npm install
npm run build
```
Output directory: `frontend/dist/`.

---

## 3. Supabase Edge Functions Deployment

Deploy functions to the linked Supabase project using Supabase CLI:

```bash
# Deploy process-voice
npx supabase functions deploy process-voice \
  --project-ref msjzkylvafuwlkkujxpv \
  --workdir backend \
  --use-api --yes

# Deploy extract-receipt
npx supabase functions deploy extract-receipt \
  --project-ref msjzkylvafuwlkkujxpv \
  --workdir backend \
  --use-api --yes
```

### Configure Edge Function Secrets
```bash
npx supabase secrets set \
  GROQ_API_KEY="gsk_..." \
  INDICCONFORMER_URL="http://your-stt-host:8001/transcribe" \
  INDICCONFORMER_KEY="your-secure-internal-key" \
  --project-ref msjzkylvafuwlkkujxpv
```

---

## 4. IndicConformer FastAPI Microservice Deployment

### Systemd Service Configuration (`/etc/systemd/system/flova-stt.service`)
```ini
[Unit]
Description=FLOVA AI4Bharat IndicConformer STT Service
After=network.target

[Service]
Type=simple
User=syed-imadulla
WorkingDirectory=/home/syed-imadulla/Desktop/FLOVA/ai-engine
ExecStart=/usr/bin/python3 -m uvicorn stt_service.main:app --host 0.0.0.0 --port 8001
Restart=on-failure
RestartSec=5s
Environment="FLOVA_STT_PORT=8001"
Environment="FLOVA_STT_INTERNAL_KEY=<random value from openssl rand -hex 32>"

[Install]
WantedBy=multi-user.target
```

### Docker Deployment
```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
COPY ai-engine/stt_service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY ai-engine/stt_service ./stt_service
EXPOSE 8001
CMD ["uvicorn", "stt_service.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

---

## 5. Android Native Release & Distribution

FLOVA Android is built with Capacitor and distributed directly via GitHub Releases:

- **Package ID:** `in.flova.app`
- **Distribution Model:** Direct APK sideloading via GitHub Releases (no Google Play store auto-updates).
- **Signing Keystore:** Permanent RSA 4096-bit release keystore (`~/.android/flova-release.keystore`).
- **Signature Schemes:** APK Signature Scheme v2 and v3 enabled.
- **App Links:** Verified against `https://myflova.vercel.app/.well-known/assetlinks.json`.
- **Build Command:**
  ```bash
  cd frontend
  npm run build
  npx cap sync android
  cd android && ./gradlew assembleRelease
  ```
- **Output:** `frontend/android/app/build/outputs/apk/release/app-release.apk`
- **Verification:**
  ```bash
  $ANDROID_HOME/build-tools/35.0.0/apksigner verify --verbose --print-certs frontend/android/app/build/outputs/apk/release/app-release.apk
  ```

