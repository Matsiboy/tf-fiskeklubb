import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "AIzaSyC6ApDhT_BQObrhbq_l9SQ-EQGsddduidw",
  authDomain:        "fiskeklubb-588ed.firebaseapp.com",
  projectId:         "fiskeklubb-588ed",
  storageBucket:     "fiskeklubb-588ed.firebasestorage.app",
  messagingSenderId: "416234961607",
  appId:             "1:416234961607:web:afef0e342c7b5ff53f1ce2"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
