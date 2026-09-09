# 🎣 Tordivelen & Flugua — Oppsettguide

Følg disse stegene én gang, så er siden live for alle klubbmedlemmer.
Tar ca. 20–30 minutter totalt.

---

## Steg 1 — Lag en GitHub-konto (gratis)

1. Gå til **https://github.com** og klikk **Sign up**
2. Velg et brukernavn, skriv inn e-post og passord
3. Bekreft e-postadressen din

---

## Steg 2 — Lag et nytt repository

1. Logg inn på GitHub og klikk **+** øverst til høyre → **New repository**
2. Gi det navnet: `tf-fiskeklubb`
3. Sett det til **Public** (kreves for gratis GitHub Pages)
4. Klikk **Create repository**
5. GitHub viser deg en side med instruksjoner — la den stå åpen

---

## Steg 3 — Lag Firebase-database (gratis)

Firebase er Googles gratis database som lar alle klubbmedlemmer se samme data i sanntid.

1. Gå til **https://console.firebase.google.com**
2. Logg inn med en Google-konto
3. Klikk **Add project** (legg til prosjekt)
4. Gi det et navn, f.eks. `tf-fiskeklubb`
5. Skru **av** Google Analytics (ikke nødvendig) → klikk **Create project**
6. Vent til prosjektet er klart, klikk **Continue**

### Sett opp databasen:
7. I menyen til venstre, klikk **Firestore Database**
8. Klikk **Create database**
9. Velg **Start in test mode** → **Next**
10. Velg en plassering nær Norge, f.eks. `europe-west1` → **Enable**

### Hent konfigurasjonsnøklene dine:
11. Klikk på tannhjulet ⚙️ øverst til venstre → **Project settings**
12. Scroll ned til **Your apps** → klikk **</>** (Web-ikonet)
13. Gi appen et navn (f.eks. `tf-web`) → klikk **Register app**
14. Du ser nå en kodeblokk med `firebaseConfig`. **Kopier disse verdiene:**

```
apiKey: "..."
authDomain: "..."
projectId: "..."
storageBucket: "..."
messagingSenderId: "..."
appId: "..."
```

15. Åpne filen **`src/firebase.js`** i prosjektmappen og lim inn dine verdier:

```js
const firebaseConfig = {
  apiKey:            "din-api-key-her",
  authDomain:        "ditt-prosjekt.firebaseapp.com",
  projectId:         "ditt-prosjekt-id",
  storageBucket:     "ditt-prosjekt.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abcdef"
}
```

---

## Steg 4 — Last opp filene til GitHub

### Alternativ A: Via nettleseren (enklest, ingen installasjon)

1. Gå til ditt nye repository på GitHub
2. Klikk **uploading an existing file** (eller dra filer direkte inn)
3. Last opp **alle filene og mappene** fra `tf-fiskeklubb`-mappen:
   - `src/` (hele mappen med `App.jsx`, `main.jsx`, `firebase.js`)
   - `.github/` (hele mappen med `workflows/deploy.yml`)
   - `index.html`
   - `package.json`
   - `vite.config.js`

> ⚠️ **Viktig:** Husk å lagre `firebase.js` med dine egne nøkler FØR du laster opp!

4. Scroll ned, skriv en commit-melding f.eks. `Første versjon` → klikk **Commit changes**

### Alternativ B: Via terminal (for de som er komfortable med det)

```bash
cd tf-fiskeklubb
git init
git add .
git commit -m "Første versjon"
git branch -M main
git remote add origin https://github.com/DITT-BRUKERNAVN/tf-fiskeklubb.git
git push -u origin main
```

---

## Steg 5 — Aktiver GitHub Pages

1. Gå til ditt repository på GitHub
2. Klikk **Settings** (tannhjul-fanen øverst)
3. Klikk **Pages** i menyen til venstre
4. Under **Source**, velg **GitHub Actions**
5. Klikk **Save**

---

## Steg 6 — Vent på bygging (2–3 minutter)

1. Klikk på **Actions**-fanen i repositoryet ditt
2. Du ser en jobb som kjører (gul sirkel = pågår, grønn hake = ferdig)
3. Når den er grønn: gå til **Settings → Pages**
4. Du ser en lenke: `https://DITT-BRUKERNAVN.github.io/tf-fiskeklubb/`

**Det er den lenken du deler med klubbmedlemmene!** 🎉

---

## Innlogging

Standard innlogging for alle:
- Brukernavn: `medlem`
- Passord: `stangfisker`

For å endre passord eller legge til brukere: rediger `CREDENTIALS`-objektet i `src/App.jsx` og push på nytt.

---

## Fremtidige oppdateringer

Hver gang du endrer en fil og laster den opp til GitHub, bygges og deployes siden automatisk innen 2–3 minutter.

---

## Hjelp?

Sitter du fast? Be ChatGPT eller Claude om hjelp med det spesifikke steget — lim inn eventuelle feilmeldinger du ser.
