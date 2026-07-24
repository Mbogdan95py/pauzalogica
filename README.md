# Careu.ro

Platformă gratuită, în limba română, cu **jocuri zilnice de logică și cuvinte**: Sudoku, rebus, cuvinte
ascunse, nonograme, Kakuro, labirinturi, anagrame, integrame, secvențe logice, cuvânt misterios și o
provocare rapidă (tip Wordle).

- **Fără cont, fără abonament, fără plăți.** Intri și joci.
- **Conținut generat, validat și publicat automat** — proprietarul site-ului nu creează manual jocuri.
- **Static-first**: se exportă în HTML/JS și se poate găzdui pe Vercel, Cloudflare Pages, Netlify sau orice
  host static. Site-ul funcționează **fără OpenAI la runtime** (AI-ul e folosit doar la generare).

---

## Cuprins

- [Arhitectură](#arhitectură)
- [Instalare](#instalare)
- [Variabile de mediu](#variabile-de-mediu)
- [Rulare locală](#rulare-locală)
- [Generarea conținutului](#generarea-conținutului)
- [Validare](#validare)
- [Teste](#teste)
- [Build & deployment](#build--deployment)
- [GitHub Actions (automatizare zilnică)](#github-actions-automatizare-zilnică)
- [Reclame](#reclame)
- [Actualizarea dicționarului](#actualizarea-dicționarului)
- [Schimbarea modelelor AI](#schimbarea-modelelor-ai)
- [Strategia de fallback](#strategia-de-fallback)
- [Estimarea apelurilor AI](#estimarea-apelurilor-ai)
- [Backup și recuperare](#backup-și-recuperare)
- [Depanare](#depanare)

---

## Arhitectură

| Strat | Tehnologie |
| --- | --- |
| Framework | Next.js 14 (App Router), export static |
| Limbaj | TypeScript strict |
| UI | React, Tailwind CSS, componente accesibile |
| Validare date | Zod + JSON Schema strict (Structured Outputs) |
| AI (doar la generare) | OpenAI Responses API (`gpt-5.6-luna` / `gpt-5.6-terra`) |
| Conținut | fișiere JSON versionate în `content/daily/` |
| Teste | Vitest (unit + integrare), Playwright (E2E) |
| Automatizare | GitHub Actions |

Structura directoarelor:

```
app/                 pagini (App Router) + rute [date], sitemap, robots
components/           UI: header/footer, carduri, componente de joc, reclame
games/               logica de joc pură: solvere, modele (Sudoku, Nonogramă, Kakuro, Labirint…)
generators/          generatoare deterministe pentru fiecare joc
validators/          validatoare INDEPENDENTE (module separate de generatoare)
lib/
  ai/                prompt, scheme, provider mock + real, orchestrator retry/fallback
  content/           asamblare pachet zilnic, plan săptămânal, fingerprint, render-check
  dictionary/        dicționar RO, listă neagră, definiții locale, teme locale
  schema/            tipuri + scheme Zod (pachet zilnic, jocuri)
  storage/           citire/scriere conținut, index dedup, arhivă, status
  client/            stocare locală (progres, preferințe), share, hook de sesiune
content/
  daily/             YYYY-MM-DD.json — un pachet pe zi (sursa de adevăr)
  index/             index arhivă + index anti-repetare (dedup)
scripts/             generate-daily-content, validate-all-content, content-status, demo
tests/               unit, integration, e2e
docs/                documentație detaliată
.github/workflows/   generate-daily.yml (cron), ci.yml
```

**Principiu cheie:** generatorul nu este niciodată singurul validator al propriului rezultat. Fiecare joc are
un validator independent (`validators/`) care re-rezolvă puzzle-ul, confirmă unicitatea soluției și verifică
vocabularul cu dicționarul, fără să se bazeze pe metadatele generatorului.

**AI-ul generează doar conținut editorial** (teme, cuvinte, definiții, indicii, titluri). Grilele, soluțiile
și verificările matematice sunt produse exclusiv de algoritmi determiniști.

---

## Instalare

Cerințe: **Node.js ≥ 20** și npm.

```bash
npm install
cp .env.example .env.local   # opțional; valorile implicite funcționează fără AI
```

---

## Variabile de mediu

Aplicația web **nu are nevoie de niciun secret**. Secretele AI sunt folosite doar de scriptul de generare.

| Variabilă | Implicit | Rol |
| --- | --- | --- |
| `CONTENT_AI_MODE` | `mock` | `mock` (fără rețea) sau `real` (apelează OpenAI) |
| `OPENAI_API_KEY` | — | cheia OpenAI (doar la generare, niciodată în browser) |
| `OPENAI_PRIMARY_MODEL` | `gpt-5.6-luna` | modelul principal |
| `OPENAI_FALLBACK_MODEL` | `gpt-5.6-terra` | modelul de rezervă |
| `CONTENT_LOOKAHEAD_DAYS` | `14` | câte zile în avans se generează (buffer) |
| `CONTENT_TZ` | `Europe/Bucharest` | fusul orar pentru „azi” |
| `CONTENT_SAVE_RAW` | `false` | salvează răspunsul AI brut pe disc (doar în dev) |
| `NEXT_PUBLIC_SITE_URL` | `https://careu.ro` | URL canonic pentru SEO |
| `NEXT_PUBLIC_ADS_ENABLED` | `false` | activează scriptul de reclame |
| `NEXT_PUBLIC_AD_CLIENT` | — | id-ul publisher AdSense (`ca-pub-…`) |
| `CAREU_DEDUP_*` | vezi mai jos | ferestre anti-repetare (zile) |

Ferestrele de anti-repetare implicite sunt calibrate pentru **dicționarul local** (finit). În producție, cu AI,
crește-le la valorile din specificație — vezi [docs/content-pipeline.md](docs/content-pipeline.md).

---

## Rulare locală

```bash
# 1. Generează conținut demo (30 zile în urmă + 14 în avans, fără apeluri reale)
npm run generate:demo

# 2. Pornește serverul de dezvoltare
npm run dev
# → http://localhost:3000
```

---

## Generarea conținutului

Tot conținutul e produs de `scripts/generate-daily-content.ts`. Rulările sunt **idempotente**: un pachet valid
existent nu este recreat.

```bash
# Comportamentul cron: generează exact ziua de azi + lookahead (implicit +14)
npm run generate

# Completează tot bufferul (azi … azi+14), sărind zilele deja valide
npm run generate -- --fill-buffer

# O singură zi
npm run generate -- --date=2026-08-15

# Un interval
npm run generate -- --from=2026-08-01 --to=2026-08-07

# Regenerează forțat (suprascrie)
npm run generate -- --date=2026-08-15 --force
```

În mod implicit se folosește providerul **mock** (fără rețea, determinist). Pentru AI real:

```bash
CONTENT_AI_MODE=real OPENAI_API_KEY=sk-... npm run generate -- --date=2026-08-15
```

---

## Validare

```bash
npm run validate                 # re-validează toate pachetele (stadiile 1–14)
npm run validate -- --with-dedup # include verificarea anti-repetare
npm run content:status           # afișează starea bufferului (JSON)
```

Conducta de validare are 15 etape (schema JSON, Zod, ortografie, dicționar, duplicate, listă neagră, lungimi,
intersecții, solver independent, soluție unică, dificultate, hash, arhivă/dedup, test de randare, publicare
atomică). Detalii: [docs/puzzle-validation.md](docs/puzzle-validation.md).

---

## Teste

```bash
npm test          # Vitest: unit + integrare
npm run test:e2e  # Playwright: E2E (necesită `npx playwright install chromium`)
npm run typecheck # tsc --noEmit
npm run lint      # eslint (next/core-web-vitals)
```

---

## Build & deployment

```bash
npm run build     # produce ./out (site static complet)
```

Site-ul este exportat static (`output: 'export'`). Găzduiește directorul `out/` pe orice host static.
Vezi [docs/deployment.md](docs/deployment.md) pentru Vercel, Cloudflare Pages și Netlify.

> **Notă:** conținutul zilnic este „înghețat” la momentul build-ului. De aceea site-ul se **rebuilds zilnic**
> (după ce workflow-ul comite pachete noi), astfel încât „azi” să fie mereu actual.

---

## GitHub Actions (automatizare zilnică)

Workflow: [`.github/workflows/generate-daily.yml`](.github/workflows/generate-daily.yml). Rulează zilnic la
**02:10 Europe/Bucharest**, poate fi pornit manual, generează + validează + testează + comite doar conținut nou
și declanșează redeploy-ul.

**Configurarea secretelor** (Settings → Secrets and variables → Actions):

| Secret | Necesitate | Descriere |
| --- | --- | --- |
| `OPENAI_API_KEY` | opțional | dacă lipsește, workflow-ul rulează în mod `mock` |
| `OPENAI_PRIMARY_MODEL` | opțional | implicit `gpt-5.6-luna` |
| `OPENAI_FALLBACK_MODEL` | opțional | implicit `gpt-5.6-terra` |
| `CONTENT_GENERATION_SECRET` | opțional | secret partajat pentru declanșări externe |
| `DEPLOY_HOOK_URL` | opțional | webhook de redeploy (dacă host-ul nu ascultă push-uri) |

Fără `OPENAI_API_KEY`, automatizarea produce conținut valid folosind **generatoarele algoritmice + temele
locale** — pagina zilei nu rămâne niciodată goală.

---

## Reclame

Componentele de reclamă (`AdLeaderboard`, `AdRectangle`, `AdMobileBanner`, `AdInContent`,
`RewardedHintPlaceholder`) afișează **doar placeholder-e cu dimensiuni** în dezvoltare. În producție, scriptul
de reclame se încarcă **numai** dacă `NEXT_PUBLIC_ADS_ENABLED=true`, `NEXT_PUBLIC_AD_CLIENT` este setat **și**
vizitatorul și-a dat consimțământul. Dimensiunile sunt rezervate pentru a evita deplasarea interfeței.
Detalii: [docs/advertising.md](docs/advertising.md).

---

## Actualizarea dicționarului

Dicționarul local (sursa de adevăr pentru validare, jocuri de cuvinte și fallback) este în:

- `lib/dictionary/words.data.ts` — lista de cuvinte (formă cu diacritice, parte de vorbire, frecvență, teme)
- `lib/dictionary/definitions.data.ts` — definiții pentru rebus/careu (cheie = forma normalizată)
- `lib/dictionary/blacklist.data.ts` — cuvinte și subșiruri interzise
- `lib/dictionary/local-themes.ts` — temele locale pentru fallback

Pentru a adăuga cuvinte: editează `words.data.ts` (fiecare intrare `{ w, pos, freq, themes }`), adaugă definiții
în `definitions.data.ts` dacă vrei să apară în careuri, apoi rulează `npm test` (verifică unicitatea și absența
duplicatelor) și `npm run typecheck`.

---

## Schimbarea modelelor AI

Setează `OPENAI_PRIMARY_MODEL` și `OPENAI_FALLBACK_MODEL` (în `.env.local` sau ca secrete GitHub). Prețurile
aproximative pentru estimarea costului sunt în `lib/config.ts` (`MODEL_PRICING`) — actualizează-le dacă schimbi
modelele. Clientul folosește **OpenAI Responses API** cu **Structured Outputs** (schemă strictă) — vezi
`lib/ai/openai.ts`.

---

## Strategia de fallback

1. până la **3 încercări** cu modelul principal (backoff exponențial);
2. până la **2 încercări** cu modelul de rezervă;
3. **temă locală** dintr-o colecție internă (fără AI);
4. dacă un joc individual eșuează, se înlocuiește cu un joc algoritmic sigur (ex. labirint);
5. pachetul se publică și se marchează în metadate (`fallbacks.used`, `fallbacks.aiSource`).

Pachetul de rezervă conține întotdeauna cel puțin: Sudoku, Nonogramă, Kakuro, labirint, anagramă și cuvinte
ascunse din dicționarul local.

---

## Estimarea apelurilor AI

- **Un singur apel editorial pe zi** (nu unul per joc): modelul principal e chemat o dată; retry-urile și
  fallback-ul se activează doar la eșec.
- La `lookahead = 14`, cronul generează **1 zi nouă / rulare** ⇒ **~1 apel / zi** ⇒ ~30 apeluri/lună.
- Fiecare apel are `max_output_tokens` limitat (implicit 4000). Costul aproximativ este logat la fiecare rulare
  (`estimatedCostUsd`), calculat din `MODEL_PRICING`.
- Dezvoltarea și testele folosesc providerul mock ⇒ **0 apeluri reale**.

---

## Backup și recuperare

- **Sursa de adevăr** este directorul `content/` (versionat în git). Fiecare pachet valid e un fișier JSON
  imuabil; istoricul git este backup-ul.
- **Recuperare după o rulare eșuată:** bufferul existent nu este atins la eșec (publicare atomică). Reia cu
  `npm run generate -- --fill-buffer` sau regenerează o zi anume cu `--date=… --force`.
- **Reconstrucția indexului dedup** (dacă `content/index/dedup-index.json` se pierde): se reconstruiește implicit
  din pachetele existente pe măsură ce se generează; poți șterge fișierul în siguranță.
- **Verificarea integrității:** `npm run validate` re-validează tot; `npm run content:status` arată bufferul.

---

## Depanare

| Simptom | Cauză probabilă / soluție |
| --- | --- |
| `npm run generate` eșuează pe o zi | conflict dedup pe dicționarul mic — rulează cu `--force` sau vezi docs/content-pipeline.md |
| Pagina „azi" arată o dată veche | site static „înghețat" — rebuild (cronul face asta zilnic) |
| Build-ul eșuează la `generateStaticParams` | nu există conținut — rulează `npm run generate:demo` întâi |
| Reclamele nu apar | normal în dev; setează `NEXT_PUBLIC_ADS_ENABLED=true` + consimțământ |
| E2E nu pornește | rulează `npx playwright install chromium` și `npm run build` |

---

## Licență

UNLICENSED — cod proprietar Careu.ro.
