# 🚀 Ghid de lansare Careu.ro (varianta gratuită)

Tot codul și configurația sunt gata. Mai jos ai **exact** ce ai de făcut tu.
Pașii marcați cu 🔴 **DOAR TU** cer contul/cardul tău (nu pot fi automatizați).
Timp estimat până e live: **~15 minute**. Cost ca să pornești: **0 lei**.

---

## Ce e deja pregătit (nu trebuie să faci nimic aici)
- ✅ Site complet, testat, build de producție funcțional (`out/`)
- ✅ 42 de zile de conținut + automatizare zilnică (GitHub Actions)
- ✅ Configurare hosting: `wrangler.toml` (Cloudflare), `vercel.json` (Vercel)
- ✅ Consimțământ cookie + pagini legale + `ads.txt` (șablon)
- ✅ Cod comis în git (branch `main`... vezi Pasul 1)

---

## Pasul 1 — GitHub (gratuit) 🔴 DOAR TU: cont + accept
Găzduiește codul și rulează automatizarea zilnică.

1. Fă-ți cont pe **github.com** (dacă n-ai) și creează un **repository nou**, gol, numit `careu` (poate fi privat).
2. În terminal, în folderul proiectului, rulează (înlocuiește `USER`):
   ```bash
   git branch -M main
   git remote add origin https://github.com/USER/careu.git
   git push -u origin main
   ```
   > Dacă `origin` există deja: `git remote set-url origin https://github.com/USER/careu.git` apoi `git push -u origin main`.

---

## Pasul 2 — Cloudflare Pages (gratuit) 🔴 DOAR TU: cont + connect
Publică site-ul și îl reface automat când apare conținut nou.

1. Cont pe **dash.cloudflare.com** (gratuit).
2. *Workers & Pages* → **Create** → **Pages** → **Connect to Git** → alege repo-ul `careu`.
3. Setări de build (exact așa):
   | Câmp | Valoare |
   | --- | --- |
   | Framework preset | **None** |
   | Build command | `npm run build` |
   | Build output directory | `out` |
4. **Environment variables** → adaugă:
   | Nume | Valoare |
   | --- | --- |
   | `NODE_VERSION` | `20` |
   | `NEXT_PUBLIC_SITE_URL` | `https://careu.pages.dev` (îl schimbi în `https://careu.ro` după ce ai domeniul) |
5. **Save and Deploy**.

✅ **Gata — site-ul e LIVE** pe `https://careu-ro.pages.dev` (gratuit, fără domeniu).
De acum, în fiecare zi, GitHub Actions comite conținut nou → Cloudflare reface site-ul singur.

> ⚡ Variantă și mai rapidă (fără GitHub, dar fără automatizare zilnică):
> după `npx wrangler login` (un click în browser), rulează `npm run deploy:cf`.

---

## Pasul 3 — Domeniul `careu.ro` (opțional) 🔴 DOAR TU: plată (~12 €/an)
Poți sări peste asta la început și folosi `careu.pages.dev`.
1. Cumpără `careu.ro` de la **rotld.ro** sau un registrar (domenii.ro, GoDaddy).
2. În Cloudflare Pages → proiectul tău → **Custom domains** → adaugă `careu.ro` și urmează instrucțiunile DNS.
3. Schimbă `NEXT_PUBLIC_SITE_URL` în `https://careu.ro` (env var în Cloudflare) → redeploy.

---

## Pasul 4 — AI real pentru conținut (opțional) 🔴 DOAR TU: cont + plată
Fără asta, conținutul se generează în modul `mock` (tot valid). Pentru teme/definiții scrise de AI:
1. Cheie pe **platform.openai.com** (cost ~1–5 $/lună).
2. GitHub → repo → *Settings → Secrets and variables → Actions* → **New secret**:
   `OPENAI_API_KEY` = cheia ta.
3. Gata — următoarea rulare zilnică folosește AI-ul automat.

---

## Pasul 5 — Reclame / bani (când ești live) 🔴 DOAR TU: cont + accept
1. Cont pe **adsense.google.com** → adaugă `careu.ro` (sau `careu.pages.dev`).
2. Aprobarea durează **zile–săptămâni** (site cu conținut + pagini legale = de obicei ok).
3. După aprobare: creează *ad units* → notează **publisher ID** (`ca-pub-…`) și **slot ID**-urile.
4. Completează **`public/ads.txt`** (înlocuiește `PUB_ID`, decomentează linia) → comite → push.
5. În Cloudflare Pages → **Environment variables** → adaugă și **redeploy**:
   ```
   NEXT_PUBLIC_ADS_ENABLED=true
   NEXT_PUBLIC_AD_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
   NEXT_PUBLIC_AD_SLOT_LEADERBOARD=...
   NEXT_PUBLIC_AD_SLOT_RECTANGLE=...
   NEXT_PUBLIC_AD_SLOT_INCONTENT=...
   NEXT_PUBLIC_AD_SLOT_MOBILE=...
   ```
Reclamele apar **doar după** ce vizitatorul apasă „Accept toate" în banner (GDPR).

---

## Rezumat: ce faci TU, în ordine
1. 🔴 Cont GitHub + `git push` (Pasul 1) — **gratuit**
2. 🔴 Cont Cloudflare + connect + deploy (Pasul 2) — **gratuit** → **LIVE**
3. 🔴 (opțional) Cumperi `careu.ro` — **~12 €/an**
4. 🔴 (opțional) Cheie OpenAI — **~1–5 $/lună**
5. 🔴 (bani) Cont AdSense + variabile — **gratuit, îți aduce venit**

Restul (cod, build, teste, conținut, automatizare, SEO, consimțământ) e **deja făcut**.
