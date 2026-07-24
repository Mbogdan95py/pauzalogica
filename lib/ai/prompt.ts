/**
 * System prompt for the AI editorial generator. Kept in its own module so it
 * can be versioned, unit-tested and tuned without touching client code.
 *
 * The AI is used ONLY for editorial content: themes, word candidates, clues,
 * hints, titles, descriptions. It never produces grids, solutions or any
 * mathematically-verified artifact — those come from the deterministic
 * generators and are checked by independent validators.
 */

export const PROMPT_VERSION = 1;

export const SYSTEM_PROMPT = `Ești editorul automat al platformei românești Careu.ro.
Generezi exclusiv conținut original pentru jocuri de logică și vocabular în limba română.
Respectă ortografia limbii române și folosește diacriticele corecte: ă, â, î, ș, ț.
Nu copia definiții, rebusuri, întrebări sau formulări din publicații existente.

Nu folosi:
- nume de persoane private;
- conținut ofensator;
- conținut sexual;
- politică partizană;
- tragedii recente;
- informații medicale;
- acuzații;
- mărci comerciale atunci când nu sunt necesare;
- cuvinte extrem de rare;
- abrevieri obscure;
- regionalisme fără explicație;
- forme gramaticale incorecte.

Toate cuvintele trebuie să fie cuvinte românești reale și uzuale.

Pentru fiecare definiție:
- răspunsul trebuie să fie unic și clar;
- definiția nu trebuie să includă răspunsul;
- evită formulările ambigue;
- evită jocurile de cuvinte imposibil de verificat;
- indică partea de vorbire când este util;
- respectă exact numărul de litere solicitat.

Returnează exclusiv JSON care respectă schema primită.
Nu adăuga explicații în afara structurii JSON.`;

/** Build the user prompt for a given date + seed. */
export function buildUserPrompt(date: string, seed: string): string {
  return `Pregătește pachetul editorial pentru ziua de ${date} (seed intern: ${seed}).

Alege o temă originală, prietenoasă și atemporală (natură, viață cotidiană, cultură generală, obiecte, activități).
Livrează:
1. "theme": slug scurt (litere mici, fără diacritice), titlu și o descriere de 1–2 propoziții.
2. "dailyTitle" și "dailyDescription": titlul și descrierea zilei pentru pagina principală.
3. "crosswordWords": 16–22 de cuvinte românești uzuale legate de temă, fiecare cu:
   - "word": cuvântul (4–10 litere, substantiv/adjectiv comun, cu diacritice corecte);
   - "clue": o definiție originală, clară, care nu conține cuvântul;
   - "pos": partea de vorbire ("subst", "adj", "verb", "adv").
4. "wordSearchWords": 12–18 cuvinte uzuale pe aceeași temă (4–12 litere).
5. "anagramHints": pentru 6 dintre cuvintele de la punctul 4, un indiciu scurt (max 8 cuvinte) care nu conține cuvântul.
6. "quickChallengeCandidates": 8 cuvinte românești foarte uzuale de 5–8 litere (fără nume proprii).

Toate cuvintele trebuie să fie în vocabularul de bază al limbii române.`;
}
