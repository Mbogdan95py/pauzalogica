# Deployment

Site-ul este exportat static (`next.config.mjs` → `output: 'export'`), deci directorul `out/` poate fi găzduit
oriunde. Conținutul zilnic e „înghețat" la build, așa că se face **rebuild zilnic** după ce workflow-ul comite
pachete noi.

## Fluxul general

```
GitHub Actions (02:10) ──generează+comite content/── push ──▶ host ──rebuild+deploy──▶ site static
```

## Vercel

1. Importă repo-ul în Vercel.
2. Framework preset: **Next.js**. Build command: `npm run build`. Output: detectat automat (`out`).
3. Adaugă variabilele publice necesare (`NEXT_PUBLIC_SITE_URL`, eventual cele de reclame).
4. **Deploy Hook** (opțional): creează un hook și pune-l în secretul `DEPLOY_HOOK_URL`, apoi decomentează pasul
   „Trigger redeploy" din workflow. Altfel, push-ul cu conținut nou declanșează redeploy-ul automat.

> Notă: pe Vercel poți rula și non-static, dar `output: 'export'` menține costurile minime și e recomandat aici.

## Cloudflare Pages

1. Conectează repo-ul. Build command: `npm run build`. Build output directory: `out`.
2. Node 20 (`NODE_VERSION=20`).
3. Redeploy automat la push; sau folosește un Deploy Hook în `DEPLOY_HOOK_URL`.

## Netlify

1. Build command: `npm run build`. Publish directory: `out`.
2. Node 20 (`.nvmrc` sau `NODE_VERSION`).
3. Build Hook în `DEPLOY_HOOK_URL` dacă vrei declanșare explicită din workflow.

## Static generic (Nginx / S3 / orice)

```bash
npm ci
npm run generate -- --fill-buffer   # asigură bufferul
npm run build                        # produce ./out
# copiază ./out pe server (ex. rsync out/ user@host:/var/www/pauzalogica)
```

Recomandări:

- servește `out/` cu compresie (gzip/brotli);
- `Cache-Control` lung pentru `/_next/static/*` (fingerprinted), scurt pentru HTML;
- headere de securitate de bază (CSP, `X-Content-Type-Options: nosniff`).

## Rebuild zilnic

Deoarece „azi" e fixat la build, programează un rebuild după rularea de generare (ex. un al doilea job în
workflow care apelează Deploy Hook-ul, sau cronul de deploy al host-ului). Bufferul de 14 zile asigură că, și
dacă un rebuild e ratat, paginile rămân disponibile.

## Verificare post-deploy

- `/status-content` — buffer, ultima rulare, jocuri validate;
- `/sitemap.xml`, `/robots.txt` — generate automat;
- deschide un joc și verifică că funcționează fără rețea către OpenAI.
