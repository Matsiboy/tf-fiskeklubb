# Tordivelen & Flugua (T&F)

Fiskeklubbens medlemsportal, bygd med React og Vite og publisert med GitHub Pages.

## Nettsidens innhold

Hjem, nyheter, arrangement, fiskevann, toppliste og fangster, merch, regler,
sitater, priser, medlemmer, musikk og fiskespill. All klubbinformasjon og de
nåværende sidene beholdes ved vedlikehold.

## Hvor dataene lagres

- **Cloud Firestore** (`fiskeklubb-588ed`): `news`, `events`, `members`,
  `waters`, `rules`, `catches`, `merch`, `quotes` og `badges`, som
  dokumenter i `data`-samlingen. Foto er foreløpig lagret sammen med dataene.
- **Nettleserens localStorage**: Opplastet musikk og lokale spillrekorder.
  Disse deles **ikke** mellom enheter og er **ikke** inkludert i JSON-backup.
- **GitHub**: Kildekode, design og T&F-logo, **ikke** løpende klubbdata.

Det finnes en manuell eksport/import av JSON-backup for Firestore-data i
adminområdet. Den krever separat Firebase-pålogging med `admin: true`-claim.
**Automatiske sikkerhetskopier er ikke satt opp.** Se [STORAGE-SAFETY.md](STORAGE-SAFETY.md)
for detaljer og nødvendig oppsett av Firebase-sikkerhet.

## Lokal utvikling og testing

Krever Node.js og npm.

```bash
npm ci
npm test
npm run build
npm run dev
```

Det meste av UI, sidene, spillet og admin-redigeringen er samlet i
`src/App.jsx`. Firebase-tilkoblingen ligger i `src/firebase.js`. Kjør
`npm test` og `npm run build` før du endrer `main`; pull requests får
automatiske kontroller i GitHub Actions.

## Publisering og sikkerhet

Push til `main` utløser GitHub Pages-bygg og publisering. En egen
pull request gjør det mulig å inspisere endringer før siden oppdateres.

**Viktig:** Den gamle delte medlems-/admininnloggingen ligger i frontend-koden
og er ikke ekte tilgangskontroll. Firebase Authentication og Firestore-regler
må gjennomgås før prosjektet kan regnes som sikkert mot uautoriserte endringer.
Ikke slå på åpne/test-regler i en produksjonsdatabase.

For den opprinnelige steg-for-steg-oppsettsguiden: [OPPSETT.md](OPPSETT.md).
