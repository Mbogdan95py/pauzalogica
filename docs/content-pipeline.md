# Conducta de conținut

Cum ajunge o zi de la „nimic" la un pachet publicat.

## Prezentare

```
cron 02:10 Europe/Bucharest
   │
   ▼
scripts/generate-daily-content.ts
   │   pentru fiecare dată țintă (azi + lookahead):
   │
   ├─ 1. Editorial (lib/ai) ── primary ×3 → fallback ×2 → temă locală
   │        (doar teme, cuvinte, definiții, indicii, titluri)
   │
   ├─ 2. Asamblare (lib/content/build-daily.ts)
   │        Sudoku, Rebus, Cuvinte ascunse, Nonogramă, Provocare rapidă
   │        + un joc rotativ (Kakuro/Anagrame/Labirint/Integrame/Secvențe/Cuvânt misterios)
   │        Grilele & soluțiile = generatoare DETERMINISTE (generators/)
   │
   ├─ 3. Validare (validators/package.ts) ── 14 etape
   │
   ├─ 4. Dacă pică doar dedup → re-roll seed (până la 6 variante)
   │
   └─ 5. Publicare atomică (writePackageAtomic) + index dedup + index arhivă + status
```

## Reproductibilitate

Totul pornește dintr-un **seed stabil**: `careu:<DATA>:v<variantă>`. Același seed ⇒ aceleași puzzle-uri pe orice
mașină. Generatoarele folosesc un PRNG seedabil (`lib/rng.ts`, mulberry32 + cyrb128).

## Idempotență

- Un pachet **valid** existent nu este recreat (se sare).
- Un pachet invalid/corupt este regenerat.
- Rularea de mai multe ori nu produce duplicate și nu are efecte secundare.

## Planul săptămânal

`lib/content/plan.ts` decide determinist, în funcție de dată:

- **dificultatea** fiecărui joc (curbă săptămânală + offset per joc, ca o zi să amestece dificultăți);
- **jocul rotativ** al zilei (ciclu de 6, ancorat la o epocă fixă);
- **timpul estimat** per joc/dificultate.

## Anti-repetare (dedup)

Indexul `content/index/dedup-index.json` reține, pe categorii, datele la care a fost folosit fiecare *fingerprint*
(`lib/content/fingerprint.ts`):

| Categorie | Ce | Fereastră spec (producție) | Implicit (dicționar local) |
| --- | --- | --- | --- |
| `grid` | hash grilă/soluție | 365 | 365 |
| `seed` | seed joc | 365 | 365 |
| `answer` | cuvânt „secret" zilnic (provocare/mister/anagramă) | 180 | 7 |
| `definition` | text definiție rebus | 180 | 0 (dezactivat) |
| `theme` | tema pachetului | 60 | 6 |
| `wordset` | combinația de cuvinte | 60 | 10 |

**De ce implicit mai mic?** Dicționarul livrat este un set *finit* (~130 definiții, ~18 teme locale). Cu ~9
definiții/zi, un careu epuizează definițiile unice în ~2 săptămâni — deci regula „aceeași definiție la ≥180 zile"
e imposibilă fără vocabularul practic nelimitat pe care îl aduce AI-ul zilnic. În producție (cu AI), setează
ferestrele la valorile din specificație prin variabile de mediu:

```bash
CAREU_DEDUP_DEFINITION=180 CAREU_DEDUP_ANSWER=180 CAREU_DEDUP_THEME=60 CAREU_DEDUP_WORDSET=60
```

(Workflow-ul de producție le setează deja.) Grilele și seed-urile sunt oricum unice, deci fereastra lor rămâne 365
și în local.

## Variație de dificultate pe săptămână

`plan.ts` asigură o curbă (ușor→mediu→greu) pe parcursul săptămânii; validarea confirmă că fiecare joc are o
dificultate validă și că jocurile obligatorii sunt prezente.

## Ce se întâmplă la eșec total

- Bufferul existent **nu** este atins (publicare atomică — se scrie într-un fișier temporar și se redenumește).
- Ziua eșuată este logată; workflow-ul iese cu cod ≠ 0 (eșec vizibil).
- `content/index/status.json` marchează `lastRunOk: false`.
- Reia cu `npm run generate -- --fill-buffer`.
