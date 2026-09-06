# 🎧 Ear Trainer

Sluchový tréning priamo v prehliadači — bez inštalácie, bez buildu, bez externých knižníc.
Inšpirované mini-hrami z ToneGym. Všetok materiál (tóny, intervaly, akordy) je odvodený
**len z durových a molových (prirodzených) stupníc** a z diatonických akordov, ktoré v nich vznikajú.

## Spustenie

Súbory používajú obyčajné `<script>` tagy, takže stačí:

```bash
cd Ear-Trainer
python -m http.server 8000
# otvor http://localhost:8000
```

Alebo len dvojklik na `index.html` (funguje aj cez `file://`).

## Mini-hry

| Hra | Čo trénuje | Ako odpovedáš |
|---|---|---|
| **Solfège** | Rozoznanie stupňa stupnice podľa sluchu (Do Re Mi Fa Sol La Si). Najprv zaznie tonika, potom hľadaný tón. | tlačidlá |
| **Intervals** | Interval medzi tonikou a iným tónom stupnice (m2 … P8). Na ťažkej obtiažnosti občas súzvuk namiesto melodicky. | tlačidlá |
| **Chordelius** | Typ diatonického kvintakordu — dur / mol / zmenšený (I–VII v dur, i–VII v mol). | tlačidlá |
| **Inversionist** | Základný tvar, 1. alebo 2. obrat kvintakordu. Na ľahkej sa akord najprv rozloží. | tlačidlá |
| **Melody Hunter** | Krátka melódia (3–6 tónov podľa obtiažnosti) — zopakuj ju na klaviatúre v správnom poradí. | klaviatúra |
| **Notationist** | Čítanie nôt: nota v husľovom kľúči → nájdi ju na klaviatúre. Posuvky sa zobrazujú priamo pri note. | klaviatúra |

Po každej odpovedi sa správne tóny zvýraznia na klaviatúre, takže vidíš aj *kde* to bolo.

## Nastavenia (lišta hore)

- **Stupnica** – dur / mol
- **Tónina** – C, G, D, A, E, F, B♭, E♭, A♭ (dur) alebo A, E, H, D, G, C, F, B♭, E♭ (mol)
- **Obtiažnosť** – ľahká / stredná / ťažká (mení rozsah stupňov, dĺžku melódie, rozklad akordov…)
- **Zobraziť názvy tónov** – popisky na bielych klávesoch (pre začiatok; na skutočný ear-training vypni)

Klaviatúra (C3–C6) je vždy dole a dá sa na nej voľne hrať.

## Štatistiky

Séria, najlepšia séria a úspešnosť sa ukladajú per hra do `localStorage` prehliadača.

## Štruktúra

```
Ear-Trainer/
├── index.html
├── css/style.css
└── js/
    ├── theory.js      # stupnice, akordy, intervaly, solfège
    ├── audio.js       # Web Audio syntetizátor (žiadne samply/CDN)
    ├── piano.js       # klikateľná klaviatúra
    ├── staff.js       # SVG notová osnova (husľový kľúč)
    ├── storage.js     # localStorage štatistiky
    ├── gameui.js      # spoločná kostra hry (skóre, feedback, tlačidlá)
    ├── app.js         # menu, nastavenia, prepínanie hier
    └── games/         # jedna mini-hra = jeden súbor
```

Pridanie novej hry = nový súbor v `js/games/`, ktorý zaregistruje `Games.<id> = { id, title, desc, mount }`,
a jeden `<script>` tag v `index.html`.
