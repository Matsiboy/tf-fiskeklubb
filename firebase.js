// ─────────────────────────────────────────────────────────────────────────────
// FYLL INN DINE FIREBASE-VERDIER HER
// Se OPPSETT.md steg 3 for hvordan du finner disse
// ─────────────────────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "DIN_API_KEY",
  authDomain:        "ditt-prosjekt.firebaseapp.com",
  projectId:         "ditt-prosjekt-id",
  storageBucket:     "ditt-prosjekt.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abcdef123456"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
