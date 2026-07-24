# Reclame

Monetizarea se face **exclusiv prin reclame**. Implementarea respectă câteva reguli stricte de UX și
confidențialitate.

## Componente

| Componentă | Dimensiune | Poziție |
| --- | --- | --- |
| `AdLeaderboard` | 728×90 | banner sus / după provocări / jos |
| `AdRectangle` | 300×250 | sidebar |
| `AdMobileBanner` | 320×100 | sus pe mobil |
| `AdInContent` | 336×280 | după terminarea unui joc |
| `RewardedHintPlaceholder` | — | reclamă opțională înainte de un indiciu |

## Comportament

- **Dezvoltare / neconfigurat:** se afișează **doar placeholder-e** cu dimensiunile lor (`RECLAMĂ 728 × 90`).
- **Producție:** scriptul de reclame se încarcă **numai dacă**:
  1. `NEXT_PUBLIC_ADS_ENABLED=true`,
  2. `NEXT_PUBLIC_AD_CLIENT` este setat (ex. `ca-pub-…`),
  3. vizitatorul a acceptat cookie-urile de publicitate (banner de consimțământ).
- Dacă reclamele sunt blocate sau consimțământul lipsește, **site-ul funcționează normal** — spațiul rămâne
  rezervat (fără deplasarea interfeței).

## Poziții permise vs. interzise

**Permise:** banner sus, banner după lista provocărilor, dreptunghi în sidebar, reclamă după terminarea jocului,
reclamă opțională înainte de un indiciu.

**Interzise (nu se implementează):** peste tabla jocului, între celule, lângă butoane în mod înșelător, după
fiecare mutare, în ferestre care blochează jocul, în poziții care produc clicuri accidentale.

## Configurare (AdSense, exemplu)

```bash
NEXT_PUBLIC_ADS_ENABLED=true
NEXT_PUBLIC_AD_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_AD_SLOT_LEADERBOARD=1234567890
NEXT_PUBLIC_AD_SLOT_RECTANGLE=2345678901
NEXT_PUBLIC_AD_SLOT_INCONTENT=3456789012
NEXT_PUBLIC_AD_SLOT_MOBILE=4567890123
```

Codul de încărcare a scriptului este în `components/ads/AdUnit.tsx`; consimțământul în `lib/client/consent.ts` și
`components/CookieBanner.tsx` / `components/CookieSettings.tsx`.

## Consimțământ

Implicit **fără** consimțământ ⇒ niciun script de publicitate nu se încarcă. Bannerul oferă „Doar esențiale" și
„Accept toate"; alegerea se poate schimba oricând din pagina `/cookie-uri`. Cookie-urile esențiale (progres,
preferințe) folosesc doar `localStorage` și nu necesită consimțământ.

## Evitarea deplasării interfeței (CLS)

Fiecare slot rezervă dimensiunea (min-height / max-width) chiar și când afișează doar placeholder-ul, astfel
încât activarea reclamelor sau încărcarea lor târzie să nu miște conținutul.
