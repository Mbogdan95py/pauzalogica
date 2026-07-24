# Dicționare

Sursa de adevăr pentru dicționarul local este în cod (typat, fără fs, izomorf), nu în acest director:

| Fișier | Conținut |
| --- | --- |
| `lib/dictionary/words.data.ts` | lista de cuvinte: `{ w, pos, freq, themes }` (formă cu diacritice) |
| `lib/dictionary/definitions.data.ts` | definiții pentru careuri, cheie = forma normalizată (ASCII, majuscule) |
| `lib/dictionary/blacklist.data.ts` | cuvinte și subșiruri interzise |
| `lib/dictionary/local-themes.ts` | teme locale (fallback fără AI) |
| `lib/dictionary/index.ts` | API: `has`, `isClean`, `byTheme`, `byLength`, `pool`, … |

## De ce în cod și nu JSON?

- **Izomorf**: același modul e folosit la generare (Node) și la validarea din browser (ex. provocarea rapidă
  verifică ghicirile în dicționar) — fără acces la sistemul de fișiere.
- **Typat**: erorile de structură sunt prinse de TypeScript la compilare.
- **Tree-shakeable**: în bundle-ul de client intră doar ce se folosește.

## Cum extinzi dicționarul

1. Adaugă intrări în `lib/dictionary/words.data.ts` (diacritice corecte, `freq` 3–5 pentru cuvinte uzuale).
2. Opțional, adaugă definiții în `lib/dictionary/definitions.data.ts` (definiția **nu** trebuie să conțină
   răspunsul).
3. `npm test` — verifică unicitatea normalizată, absența duplicatelor și că definițiile nu-și dezvăluie
   răspunsul.
4. `npm run typecheck`.

Un dicționar mai mare permite ferestre de anti-repetare mai mari (vezi `docs/content-pipeline.md`).
