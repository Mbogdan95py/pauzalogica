# Validarea puzzle-urilor

Un răspuns nu este valid doar pentru că respectă schema JSON. Fiecare pachet trece printr-o conductă de validare
în mai multe etape, iar fiecare joc are un **validator independent** (`validators/`), separat de generatorul lui.

## Cele 15 etape

Implementate în `validators/package.ts` (etapele 1–14) + publicarea atomică (etapa 15) în scriptul de generare.

| # | Etapă | Ce verifică |
| --- | --- | --- |
| 1 | Structură JSON | serializabil, obiect valid |
| 2 | Schema Zod | `dailyPackageSchema` (toate câmpurile, tipuri) |
| 3 | Ortografie | diacritice corecte (fără cedilă ş/ţ), fără spații duble, text nevid |
| 4 | Dicționar | fiecare cuvânt-răspuns există în dicționarul local |
| 5 | Duplicate în pachet | id-uri unice; același răspuns nu apare în două careuri |
| 6 | Listă neagră | niciun cuvânt/subșir interzis în textele expuse |
| 7 | Lungimi | lungimea răspunsurilor = lungimea declarată/grilă |
| 8 | Intersecții | careurile sunt conectate, fără zone izolate, cu prag de intersecție |
| 9 | Solver independent | Sudoku/Nonogramă/Kakuro/Labirint re-rezolvate de la zero |
| 10 | Soluție unică | Sudoku/Nonogramă/Kakuro au exact o soluție |
| 11 | Dificultate | dificultăți valide; jocurile obligatorii prezente; ≥6 jocuri |
| 12 | Hash conținut | `contentHash` corespunde conținutului |
| 13 | Arhivă/dedup | fără repetări în ferestrele configurate |
| 14 | Test de randare | fiecare joc se „randează" în text fără excepții |
| 15 | Publicare atomică | scriere temp + rename (doar conținut validat) |

## Independență generator ↔ validator

- Generatorul de Sudoku produce grila și verifică unicitatea **în timpul** generării.
- Validatorul de Sudoku (`validators/sudoku.ts`) **re-rezolvă** grila publicată de la zero, numără soluțiile
  (`countSolutions`), confirmă că soluția publicată corespunde și că fiecare indiciu e consistent — fără să se
  bazeze pe metadatele generatorului.

Ambele pot folosi biblioteca comună de solver (`games/*/solver.ts`) — „independent" înseamnă o **verificare
separată**, nu o reimplementare a algoritmului.

## Ce garantează fiecare joc

| Joc | Garanție de validare |
| --- | --- |
| Sudoku | 9×9, valori 1–9, fără contradicții, **soluție unică**, indicii ⊆ soluție |
| Nonogramă | indicii recalculate = cele publicate, **soluție unică** (line-solvable) |
| Kakuro | serii 2–9 fără repetiții, sume corecte, **soluție unică** |
| Labirint | pereți simetrici, cale start→ieșire există, traseul-soluție e contiguu |
| Cuvinte ascunse | fiecare cuvânt e în dicționar & plasat; niciun cuvânt interzis pe nicio linie |
| Rebus/Careu/Integrame | răspunsuri în dicționar, definiția nu conține răspunsul, fără duplicate, conectat |
| Anagrame | amestecarea e o permutare ≠ original; soluție (aproape) unică; ≤3 indicii |
| Provocare rapidă | cuvânt real 5–8 litere; 6 încercări; rezultat fără dezvăluirea răspunsului |

## Notă despre densitatea careurilor

Careurile folosesc o arhitectură *criss-cross fără adiacențe* (fiecare celulă goală a unui cuvânt nu poate avea
vecini perpendiculari ocupați, ca să nu se formeze secvențe accidentale invalide). Această regulă garantează
corectitudinea, dar limitează densitatea intersecțiilor la ~15–25%. Validatorul cere deci un prag realist de
intersecție **plus** conectivitate completă (fiecare cuvânt se intersectează cel puțin o dată; toate cuvintele
formează o singură componentă). Dacă un careu de calitate nu se obține în 5 încercări, se recurge la un joc de
rezervă (cuvinte ascunse), conform specificației.
