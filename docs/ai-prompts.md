# Prompturi și integrarea AI

AI-ul este **editorul automat** al platformei. Produce **doar conținut editorial** — niciodată grile, soluții sau
verificări matematice.

## Ce generează AI-ul

- teme (slug + titlu + descriere);
- titlul și descrierea zilei;
- cuvinte candidate + definiții pentru rebus/careu;
- cuvinte pentru cuvinte ascunse;
- indicii pentru anagrame;
- candidați pentru provocarea rapidă.

## Ce NU generează AI-ul (algoritmi determiniști)

Grile/soluții Sudoku, grile/soluții Kakuro, trasee de labirint, soluții de Nonograme, verificări matematice,
verificarea unicității.

## Fișiere

| Fișier | Rol |
| --- | --- |
| `lib/ai/prompt.ts` | promptul de sistem (versionat) + promptul de utilizator |
| `lib/ai/schema.ts` | schema Zod + **JSON Schema strict** (Structured Outputs) |
| `lib/ai/openai.ts` | client real — OpenAI **Responses API** |
| `lib/ai/mock.ts` | provider mock determinist (dev/teste, fără rețea) |
| `lib/ai/orchestrator.ts` | retry (3× primary, 2× fallback) + backoff exponențial |
| `lib/ai/index.ts` | rezolvă providerii din mediu + intrarea `generateEditorial` |

## Promptul de sistem (rezumat)

Promptul complet e în `lib/ai/prompt.ts`. Reguli cheie:

- scrie **doar** în română, cu diacritice corecte (ă, â, î, ș, ț);
- conținut **original**, fără copiere din publicații;
- interzice: nume de persoane private, conținut ofensator/sexual, politică partizană, tragedii recente,
  informații medicale, acuzații, mărci inutile, cuvinte extrem de rare, abrevieri obscure, regionalisme
  neexplicate, forme gramaticale incorecte;
- pentru definiții: răspuns unic și clar, definiția **nu** conține răspunsul, fără ambiguități, respectă numărul
  de litere;
- returnează **exclusiv JSON** conform schemei.

Promptul este configurabil și testabil (`PROMPT_VERSION`, `SYSTEM_PROMPT`, `buildUserPrompt`).

## Structured Outputs

Se trimite `EDITORIAL_JSON_SCHEMA` (strict, `additionalProperties: false`, toate câmpurile `required`) prin
`text.format = { type: 'json_schema', … }`. Răspunsul este apoi re-validat cu Zod (`editorialPayloadSchema`) —
schema nu e considerată suficientă; conținutul e verificat suplimentar de conducta de validare a jocurilor.

## Robustețe

- `temperature` mică (0.4) + output concis pentru stabilitate;
- `timeout` per cerere; `max_output_tokens` limitat;
- 3 încercări primary + 2 fallback, backoff exponențial;
- oprire imediată la primul rezultat valid (fără apeluri în plus);
- logare structurată **fără** chei sau conținut sensibil (redactare automată în `lib/log.ts`);
- răspuns brut salvat **doar** dacă `CONTENT_SAVE_RAW=true` și nu în producție;
- cost aproximativ calculat și logat per rulare.

## De ce nume de model „gpt-5.6-luna"

Modelele sunt configurabile (`OPENAI_PRIMARY_MODEL` / `OPENAI_FALLBACK_MODEL`). Valorile implicite pot fi
înlocuite cu orice model disponibil în contul tău. Actualizează `MODEL_PRICING` din `lib/config.ts` pentru
estimarea corectă a costului.
