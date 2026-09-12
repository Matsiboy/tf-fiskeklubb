import { useState, useEffect, useRef } from 'react'
import { db } from './firebase.js'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'

// ─── Auth ─────────────────────────────────────────────────────────────────────
const CREDENTIALS = { medlem: 'stangfisker', admin: 'leder2025' }

// ─── Colors ───────────────────────────────────────────────────────────────────
const CO = {
  forest: '#1a2e1a', deep: '#0f1d0f', river: '#2d6a8f',
  gold: '#c8922a', goldLt: '#e0b050', cream: '#f5f0e8',
  creamDk: '#e8e0d0', mist: '#d6e8d6', muted: '#6b7c6b',
  white: '#ffffff', text: '#2a2a2a',
}

// ─── Seed data (only used if Firebase is completely empty) ────────────────────
const SEED = {
  news: [
    { id: 1, date: '2025-05-14', badge: 'Fangst', title: 'Årsrekord ørret fanget på Steinelva', text: 'Lars Holm satte ny klubbrekord med en 2,3 kg storvokst ørret. Fanget på en hjemmelaget caddis-flue i kveldstimene.', color: '#2d6a8f' },
    { id: 2, date: '2025-05-02', badge: 'Kurs', title: 'Fluebinderkurs 7. juni — meld deg på nå', text: 'Kjell Andersen holder kurs i tradisjonell fluebinding. Maks 12 plasser. Inkludert materiell og kaffe.', color: '#1a2e1a' },
    { id: 3, date: '2025-04-28', badge: 'Info', title: 'Ny parkeringsordning ved Langvann', text: 'Fra 1. juni innføres ny parkeringsordning. Parkering kun tillatt i merket område.', color: '#2d6a8f' },
  ],
  events: [
    { id: 1, day: '07', month: 'Jun', date: '2025-06-07', title: 'Fluebinderkurs med Kjell Andersen', location: 'Klubbhuset, Lillehammer', time: '10:00–16:00', note: 'Maks 12 plasser', tag: 'Kurs' },
    { id: 2, day: '14', month: 'Jun', date: '2025-06-14', title: 'Sesongåpningsfiske — Steinelva', location: 'Steinelva, nedre del', time: 'Start 07:00', note: 'Felles grillmat etterpå', tag: 'Sosialt' },
    { id: 3, day: '06', month: 'Sep', date: '2025-09-06', title: 'Høstkonkurranse — Tordivelen Cup', location: 'Steinelva', time: 'Start 06:00', note: 'Premieutdeling kl. 19:00', tag: 'Konkurranse' },
  ],
  members: [
    { id: 1, name: 'Erik Haugen', role: 'Leder', badge: 'Styre', photo: '' },
    { id: 2, name: 'Ola Berget', role: 'Kasserer', badge: 'Styre', photo: '' },
    { id: 3, name: 'Marte Nygård', role: 'Sekretær', badge: 'Styre', photo: '' },
    { id: 4, name: 'Kjell Andersen', role: 'Sportsleder', badge: 'Styre', photo: '' },
    { id: 5, name: 'Lars Holm', role: 'Medlem siden 2010', badge: 'Rekordinnehaver', photo: '' },
    { id: 6, name: 'Anne Bråten', role: 'Medlem siden 2018', badge: '', photo: '' },
    { id: 7, name: 'Tor Svendsen', role: 'Medlem siden 1995', badge: 'Æresmedlem', photo: '' },
    { id: 8, name: 'Gunnar Fjeld', role: 'Juniorkontakt', badge: 'Styre', photo: '' },
    { id: 9, name: 'Ingrid Korsmo', role: 'Miljøkontakt', badge: '', photo: '' },
  ],
  waters: [
    { id: 1, name: 'Steinelva', location: 'Gausdal · 4,2 km', desc: 'Klubbens flaggskip. Rik bestand av storvokst ørret og harr.', tags: ['Ørret', 'Harr', 'Flue + sluk'] },
    { id: 2, name: 'Langvann', location: 'Øyer · 1,8 km²', desc: 'Stille fjellvann med god ørretbestand. Ideelt for båtfiske og flue fra land.', tags: ['Ørret', 'Båt tillatt', 'Flue'] },
    { id: 3, name: 'Håpetjernet', location: 'Lillehammer · 0,4 km²', desc: 'Nylig kalket og gjenopprettet. Åpner forventet sesong 2027.', tags: ['Ørret', 'Stengt til 2027'] },
    { id: 4, name: 'Raudalselva', location: 'Ringebu · 2,8 km', desc: 'Villmarkspreget elv. Laks i nedre del i august.', tags: ['Laks', 'Ørret', 'Kun flue'] },
    { id: 5, name: 'Bjørntjernet', location: 'Fåvang · 0,6 km²', desc: 'Lavlandssjø med stor abbor og noe gjedde. God for nybegynnere.', tags: ['Abbor', 'Gjedde', 'Alle metoder'] },
  ],
  rules: [
    { id: 1, icon: '🎣', title: 'Fiskeregler', items: ['Gyldig fiskekort og statsavgift kreves', 'Minste tillatte størrelse: 25 cm (ørret), 30 cm (harr)', 'Maks 3 fisk per dag per person', 'Fang & slipp anbefales sterkt', 'Kun flue tillatt på Steinelva øvre del og Raudalselva', 'Levende agn er ikke tillatt'] },
    { id: 2, icon: '🌿', title: 'Naturhensyn', items: ['Ingen forsøpling — tar med alt man tar med seg ut', 'Bål kun på anviste plasser', 'Respekter ferdselsretten og nærliggende landbruk', 'Bruk vasket og desinfisert utstyr mellom vann', 'Meld fra om ulovlig fiske til lensmann eller styre'] },
    { id: 3, icon: '👥', title: 'Medlemsforpliktelser', items: ['Kontingent betales innen 31. januar', 'Alle medlemmer bidrar på én dugnadsdag per år', 'Nye medlemmer må godkjennes av styret', 'Brudd på reglene kan medføre utelukkelse', 'Juniormedlemmer under 16 år: gratis innmelding'] },
    { id: 4, icon: '🏆', title: 'Konkurranseregler', items: ['Tordivelen Cup: poengbasert, kun flue tillatt', 'All fisk veies i live og slippes ut igjen', 'Dommer må bekrefte fangst for å gi poeng', 'Juniorer (under 18) konkurrerer i egen klasse', 'Ingen bruk av ekkolodd eller elektronisk hjelpemiddel'] },
  ],
  catches: [
    { id: 1, angler: 'Lars Holm', species: 'Ørret', weight: 2.3, length: 54, water: 'Steinelva', method: 'Flue', date: '2025-05-14', note: 'Caddis-flue, kveldsfiske' },
    { id: 2, angler: 'Tor Svendsen', species: 'Laks', weight: 4.1, length: 72, water: 'Raudalselva', method: 'Sluk', date: '2025-08-08', note: 'Sluppet ut igjen' },
    { id: 3, angler: 'Marte Nygård', species: 'Ørret', weight: 1.8, length: 49, water: 'Langvann', method: 'Flue', date: '2025-07-03', note: 'Fanget fra båt' },
    { id: 4, angler: 'Erik Haugen', species: 'Harr', weight: 1.4, length: 46, water: 'Steinelva', method: 'Flue', date: '2025-06-20', note: '' },
  ],
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
// Format ISO date (2025-05-14) to Norwegian display (14. mai 2025)
const NO_MONTHS = ['januar','februar','mars','april','mai','juni','juli','august','september','oktober','november','desember']
function formatDate(iso) {
  if (!iso) return ''
  // already formatted (legacy data like "14. mai 2025")
  if (iso.includes('.')) return iso
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${parseInt(d)}. ${NO_MONTHS[parseInt(m) - 1]} ${y}`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name) => name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
const nextId = (arr) => (arr.length ? Math.max(...arr.map((x) => x.id)) + 1 : 1)

// ─── Firebase helpers ─────────────────────────────────────────────────────────
async function fbGet(key) {
  try {
    const snap = await getDoc(doc(db, 'data', key))
    return snap.exists() ? snap.data().items : null
  } catch { return null }
}
async function fbSet(key, value) {
  try { await setDoc(doc(db, 'data', key), { items: value }) } catch (e) { console.error(e) }
}
function fbListen(key, cb) {
  return onSnapshot(doc(db, 'data', key), (snap) => {
    if (snap.exists()) cb(snap.data().items)
  }, (err) => console.error('Listen error:', err))
}

// ─── Image to base64 ─────────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    // Resize before storing to keep Firebase doc small
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX = 200
        let w = img.width, h = img.height
        if (w > h) { if (w > MAX) { h = h * MAX / w; w = MAX } }
        else { if (h > MAX) { w = w * MAX / h; h = MAX } }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=Inter:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #f5f0e8; color: #2a2a2a; -webkit-tap-highlight-color: transparent; }
  button, input, textarea, select { font-family: inherit; }
  button { cursor: pointer; border: none; background: none; }
  .tf-input { width: 100%; padding: 9px 12px; border: 1px solid #d0c8b8; border-radius: 6px; font-size: 14px; background: #fff; color: #2a2a2a; outline: none; box-sizing: border-box; }
  .tf-input:focus { border-color: #c8922a; }
  textarea.tf-input { resize: vertical; min-height: 72px; }
  input[type="date"].tf-input { cursor: pointer; }
  .tf-btn { display: inline-flex; align-items: center; gap: 5px; padding: 7px 14px; border-radius: 6px; font-weight: 600; font-size: 13px; border: 1px solid transparent; transition: opacity .15s, transform .1s; cursor: pointer; }
  .tf-btn:active { transform: scale(.97); }
  .tf-primary { background: #c8922a; color: #0f1d0f; border-color: #c8922a; }
  .tf-primary:hover { opacity: .9; }
  .tf-ghost { background: transparent; color: #6b7c6b; border-color: #ddd; }
  .tf-ghost:hover { background: #f0ebe0; }
  .tf-danger { background: rgba(220,60,60,.08); color: #c0392b; border-color: rgba(220,60,60,.2); }
  .tf-forest { background: #1a2e1a; color: #f5f0e8; }
  .tf-sm { padding: 4px 9px; font-size: 12px; }
  .tf-card { background: #fff; border: 1px solid #e8e0d0; border-radius: 10px; overflow: hidden; }
  .tf-wrap { max-width: 1100px; margin: 0 auto; padding: 1.75rem 1rem; }
  .tf-ph { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem; flex-wrap: wrap; gap: .75rem; }
  .tf-label { font-size: 11px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: #c8922a; margin-bottom: 4px; }
  .tf-title { font-family: 'Playfair Display', serif; font-size: clamp(1.5rem, 4vw, 2.1rem); font-weight: 700; color: #1a2e1a; line-height: 1.15; }
  .tf-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
  .tf-grid-sm { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 1rem; }
  .tf-flabel { display: block; font-size: 12px; font-weight: 600; color: #6b7c6b; margin-bottom: 5px; text-transform: uppercase; letter-spacing: .06em; }
  .tf-frow { margin-bottom: 1rem; }
  .tf-badge { display: inline-flex; align-items: center; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; padding: 2px 8px; border-radius: 20px; }
  .tf-badge-gold { background: rgba(200,146,42,.15); color: #c8922a; border: 1px solid rgba(200,146,42,.3); }
  .tf-badge-blue { background: rgba(45,106,143,.12); color: #1a5070; border: 1px solid rgba(45,106,143,.25); }
  .tf-modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 600; display: flex; align-items: center; justify-content: center; padding: 1rem; }
  .tf-modal { background: #f5f0e8; border-radius: 12px; padding: 1.5rem; width: 100%; max-width: 460px; max-height: 90dvh; overflow-y: auto; }
  .tf-nav-desktop { display: flex; gap: 1px; }
  .tf-hamburger { display: none !important; }
  .photo-upload { width: 80px; height: 80px; border-radius: 50%; border: 2px dashed #d0c8b8; display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; position: relative; transition: border-color .2s; }
  .photo-upload:hover { border-color: #c8922a; }
  .photo-upload input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
  @media (max-width: 640px) {
    .tf-wrap { padding: 1.25rem .75rem; }
    .tf-nav-desktop { display: none !important; }
    .tf-hamburger { display: flex !important; }
    .tf-grid { grid-template-columns: 1fr; }
    .tf-grid-sm { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
    .tf-ev-tag { display: none !important; }
    .tf-modal { padding: 1.25rem; }
    .tf-home-cols { grid-template-columns: 1fr !important; }
    .tf-podium { grid-template-columns: 1fr 1fr !important; }
  }
`

// ─── Shared UI ────────────────────────────────────────────────────────────────
function TFBtn({ children, variant = 'ghost', small = false, onClick, style = {} }) {
  const cls = ['tf-btn',
    variant === 'primary' ? 'tf-primary' : variant === 'danger' ? 'tf-danger' : variant === 'forest' ? 'tf-forest' : 'tf-ghost',
    small ? 'tf-sm' : ''
  ].join(' ')
  return <button className={cls} onClick={onClick} style={style}>{children}</button>
}

function TFInput({ value, onChange, placeholder, multiline = false, type = 'text', style = {} }) {
  if (multiline) return <textarea className="tf-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={style} />
  return <input className="tf-input" type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={style} />
}

function TFSelect({ value, onChange, options }) {
  return (
    <select className="tf-input" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => {
        const val = typeof o === 'object' ? o.value : o
        const lbl = typeof o === 'object' ? o.label : o
        return <option key={val} value={val}>{lbl}</option>
      })}
    </select>
  )
}

function FormRow({ label, children }) {
  return <div className="tf-frow"><label className="tf-flabel">{label}</label>{children}</div>
}

function Modal({ title, onClose, children }) {
  return (
    <div className="tf-modal-bg" onClick={onClose}>
      <div className="tf-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <strong style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: CO.forest }}>{title}</strong>
          <button onClick={onClose} style={{ fontSize: 22, color: CO.muted, lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <Modal title="Bekreft sletting" onClose={onCancel}>
      <p style={{ fontSize: 14, marginBottom: '1.5rem', color: CO.text }}>{message}</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <TFBtn onClick={onCancel}>Avbryt</TFBtn>
        <TFBtn variant="danger" onClick={onConfirm}>Slett</TFBtn>
      </div>
    </Modal>
  )
}

function Toast({ message }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: CO.forest, color: CO.cream, padding: '10px 22px', borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 9999, border: `1px solid ${CO.gold}`, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
      ✓ {message}
    </div>
  )
}

function TagPill({ label, onRemove }) {
  return (
    <span className="tf-badge tf-badge-blue" style={{ gap: 4, marginRight: 4, marginBottom: 4 }}>
      {label}
      {onRemove && <span onClick={onRemove} style={{ cursor: 'pointer', marginLeft: 2, opacity: .7, fontWeight: 700, fontSize: 13 }}>×</span>}
    </span>
  )
}

// Member avatar — shows photo if available, else initials
function MemberAvatar({ name, photo, size = 48 }) {
  if (photo) {
    return <img src={photo} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `linear-gradient(135deg, ${CO.forest}, ${CO.river})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display', serif", fontSize: size * 0.33, color: CO.gold, fontWeight: 700, flexShrink: 0 }}>
      {getInitials(name)}
    </div>
  )
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const attempt = () => {
    if (CREDENTIALS[username.trim().toLowerCase()] === password) { onLogin() }
    else { setError(true); setPassword('') }
  }
  return (
    <div style={{ minHeight: '100dvh', background: CO.deep, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ background: CO.forest, border: `1px solid rgba(200,146,42,.3)`, borderRadius: 14, padding: '2.5rem 2rem', width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <svg width="60" height="60" viewBox="0 0 80 80" fill="none" style={{ marginBottom: '1rem' }}>
          <circle cx="40" cy="40" r="38" stroke={CO.gold} strokeWidth="1.5" strokeDasharray="4 3" />
          <ellipse cx="40" cy="30" rx="12" ry="5" fill={CO.river} opacity=".9" />
          <path d="M40 25 Q44 18 50 20" stroke={CO.gold} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M40 35 L40 52 Q40 60 47 60 Q54 60 54 53" stroke={CO.gold} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M54 53 L50 56" stroke={CO.gold} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M32 28 Q28 24 30 20" stroke={CO.goldLt} strokeWidth="1" fill="none" opacity=".7" />
          <path d="M48 28 Q52 24 50 20" stroke={CO.goldLt} strokeWidth="1" fill="none" opacity=".7" />
          <ellipse cx="40" cy="65" rx="18" ry="3" stroke="#4a8fb5" strokeWidth="1" fill="none" opacity=".5" />
        </svg>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: CO.cream, marginBottom: '.2rem' }}>
          Tordivelen <span style={{ color: CO.gold }}>&</span> Flugua
        </h1>
        <p style={{ fontStyle: 'italic', color: CO.mist, marginBottom: '1.75rem', opacity: .8, fontSize: 14 }}>Fiskeklubb — Medlemsportal</p>
        <div style={{ textAlign: 'left', marginBottom: '.85rem' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: CO.mist, marginBottom: 4 }}>Brukernavn</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && attempt()}
            style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: `1px solid ${error ? 'rgba(220,80,80,.5)' : 'rgba(200,146,42,.25)'}`, borderRadius: 6, padding: '10px 13px', color: CO.cream, fontSize: 15, outline: 'none', fontFamily: 'inherit' }} />
        </div>
        <div style={{ textAlign: 'left', marginBottom: '.85rem' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: CO.mist, marginBottom: 4 }}>Passord</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && attempt()}
            style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: `1px solid ${error ? 'rgba(220,80,80,.5)' : 'rgba(200,146,42,.25)'}`, borderRadius: 6, padding: '10px 13px', color: CO.cream, fontSize: 15, outline: 'none', fontFamily: 'inherit' }} />
        </div>
        {error && <p style={{ color: '#e07070', fontSize: 13, marginBottom: 8 }}>Feil brukernavn eller passord.</p>}
        <button onClick={attempt} style={{ width: '100%', background: CO.gold, color: CO.deep, border: 'none', borderRadius: 6, padding: 12, fontWeight: 700, fontSize: 14, marginTop: 4, fontFamily: 'inherit', cursor: 'pointer' }}>
          Logg inn
        </button>
        <p style={{ marginTop: '1.25rem', fontSize: 12, color: 'rgba(245,240,232,.35)', borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: '1rem' }}>
          Kontakt styret for innloggingsinfo
        </p>
      </div>
    </div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'hjem', label: 'Hjem' }, { id: 'nyheter', label: 'Nyheter' },
  { id: 'arrangement', label: 'Arrangement' }, { id: 'fiskevann', label: 'Fiskevann' },
  { id: 'toppliste', label: 'Toppliste' }, { id: 'regler', label: 'Regler' },
  { id: 'medlemmer', label: 'Medlemmer' },
]

function SiteNav({ currentPage, onNavigate, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <nav style={{ background: CO.forest, borderBottom: `2px solid ${CO.gold}`, position: 'sticky', top: 0, zIndex: 200 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <button onClick={() => { onNavigate('hjem'); setMobileOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="17" stroke={CO.gold} strokeWidth="1.2" />
            <ellipse cx="18" cy="14" rx="7" ry="3" fill={CO.river} opacity=".9" />
            <path d="M18 17 L18 27 Q18 31 22 31 Q26 31 26 27" stroke={CO.gold} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', color: CO.cream }}>T<span style={{ color: CO.gold }}>&</span>F</span>
        </button>
        <div className="tf-nav-desktop">
          {NAV_ITEMS.map((n) => (
            <button key={n.id} onClick={() => onNavigate(n.id)}
              style={{ color: currentPage === n.id ? CO.gold : CO.mist, fontWeight: 500, fontSize: 13, padding: '6px 9px', borderRadius: 5 }}>
              {n.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={onLogout} style={{ border: `1px solid rgba(200,146,42,.4)`, color: CO.gold, fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 6 }}>Logg ut</button>
          <button className="tf-hamburger" onClick={() => setMobileOpen((o) => !o)}
            style={{ color: CO.mist, fontSize: 22, lineHeight: 1, padding: '4px 2px' }}>
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div style={{ background: CO.forest, borderTop: `1px solid rgba(200,146,42,.2)`, padding: '.5rem 1rem 1rem' }}>
          {NAV_ITEMS.map((n) => (
            <button key={n.id} onClick={() => { onNavigate(n.id); setMobileOpen(false) }}
              style={{ display: 'block', width: '100%', textAlign: 'left', color: currentPage === n.id ? CO.gold : CO.mist, fontWeight: 500, fontSize: 15, padding: '10px 8px', borderRadius: 6, borderBottom: `1px solid rgba(255,255,255,.05)` }}>
              {n.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ memberCount, waterCount }) {
  return (
    <div style={{ background: CO.forest, position: 'relative', minHeight: 340, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 70% 0%, rgba(45,106,143,.25) 0%, transparent 60%), linear-gradient(180deg, #0f1d0f 0%, #1a2e1a 50%, #142814 100%)' }} />
      <svg style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, opacity: .35 }} viewBox="0 0 1200 100" preserveAspectRatio="none">
        <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2d6a8f" stopOpacity=".6" /><stop offset="100%" stopColor="#2d6a8f" stopOpacity="0" /></linearGradient></defs>
        <path d="M0 40 Q150 10 300 40 Q450 70 600 30 Q750 0 900 35 Q1050 70 1200 25 L1200 100 L0 100Z" fill="url(#wg)" />
      </svg>
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto', padding: '3.5rem 1rem 2.5rem', width: '100%' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: CO.gold, marginBottom: '.75rem' }}>Stiftet 1987 — Innlandet, Norge</p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 6vw, 3.8rem)', fontWeight: 900, color: CO.cream, lineHeight: 1.05, marginBottom: '1rem' }}>
          Der stangen møter<br /><em style={{ color: CO.gold }}>stille vann.</em>
        </h1>
        <p style={{ fontSize: 'clamp(.9rem, 2.5vw, 1.05rem)', color: CO.mist, maxWidth: 440, lineHeight: 1.65, marginBottom: '1.5rem' }}>
          Tordivelen & Flugua er en fiskeklubb for de som elsker elva, fjellet og kunsten å presentere en flue.
        </p>
        <div style={{ display: 'flex', gap: '1.75rem', flexWrap: 'wrap' }}>
          {[[memberCount, 'Aktive medlemmer'], [waterCount, 'Fiskevann'], ['38', 'År med tradisjon']].map(([n, l]) => (
            <div key={l}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', fontWeight: 700, color: CO.gold, display: 'block' }}>{n}</span>
              <span style={{ fontSize: 11, color: CO.mist, textTransform: 'uppercase', letterSpacing: '.08em' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Home ─────────────────────────────────────────────────────────────────────
function HomePage({ news, events, members, waters, catches, onNavigate }) {
  const topCatch = [...catches].sort((a, b) => b.weight - a.weight)[0]
  return (
    <>
      <Hero memberCount={members.length} waterCount={waters.length} />
      <div className="tf-wrap">
        <div style={{ background: 'rgba(200,146,42,.1)', border: `1px solid rgba(200,146,42,.3)`, borderRadius: 8, padding: '.85rem 1.1rem', fontSize: 13.5, display: 'flex', gap: 10, marginBottom: '1.75rem' }}>
          <span style={{ color: CO.gold, flexShrink: 0 }}>📣</span>
          <span><b>Sesongstart:</b> Fisket åpner 1. juni. Husk å fornye fiskekortavtalen innen 15. mai via kasserer.</span>
        </div>
        {topCatch && (
          <div style={{ background: CO.forest, borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.75rem' }}>🏆</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: CO.gold, marginBottom: 2 }}>Sesongens rekord</p>
              <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: CO.cream, fontSize: '1rem' }}>{topCatch.angler} — {topCatch.weight} kg {topCatch.species}</p>
              <p style={{ fontSize: 12, color: CO.mist, opacity: .8 }}>{topCatch.water} · {formatDate(topCatch.date)}</p>
            </div>
            <button onClick={() => onNavigate('toppliste')} style={{ border: `1px solid rgba(200,146,42,.4)`, color: CO.gold, fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 6, whiteSpace: 'nowrap' }}>
              Se toppliste →
            </button>
          </div>
        )}
        <div className="tf-home-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, color: CO.forest }}>Siste nyheter</h2>
              <button onClick={() => onNavigate('nyheter')} style={{ color: CO.river, fontWeight: 600, fontSize: 13 }}>Se alle →</button>
            </div>
            {[...news].sort((a, b) => new Date(b.date || '0') - new Date(a.date || '0')).slice(0, 3).map((n) => (
              <div key={n.id} style={{ borderBottom: `1px solid ${CO.creamDk}`, paddingBottom: '.85rem', marginBottom: '.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ background: CO.gold, color: CO.deep, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', padding: '2px 7px', borderRadius: 3 }}>{n.badge}</span>
                  <span style={{ fontSize: 11, color: CO.muted }}>{formatDate(n.date)}</span>
                </div>
                <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: CO.forest, marginBottom: 2, fontSize: '.93rem' }}>{n.title}</p>
                <p style={{ fontSize: 13, color: CO.muted, lineHeight: 1.6 }}>{n.text}</p>
              </div>
            ))}
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, color: CO.forest }}>Kommende arrangement</h2>
              <button onClick={() => onNavigate('arrangement')} style={{ color: CO.river, fontWeight: 600, fontSize: 13 }}>Se alle →</button>
            </div>
            {[...events].sort((a, b) => new Date(a.date || '9999') - new Date(b.date || '9999')).slice(0, 4).map((ev) => (
              <div key={ev.id} style={{ display: 'flex', gap: '.8rem', borderBottom: `1px solid ${CO.creamDk}`, paddingBottom: '.85rem', marginBottom: '.85rem', alignItems: 'flex-start' }}>
                <div style={{ background: CO.forest, color: CO.cream, borderRadius: 7, textAlign: 'center', padding: '5px 7px', lineHeight: 1, flexShrink: 0, minWidth: 44 }}>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700, color: CO.gold, display: 'block' }}>{ev.day}</span>
                  <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.08em', opacity: .8 }}>{ev.month}</span>
                </div>
                <div>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: CO.forest, marginBottom: 2, fontSize: '.9rem' }}>{ev.title}</p>
                  <p style={{ fontSize: 12, color: CO.muted }}>📍 {ev.location} · {ev.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── News ─────────────────────────────────────────────────────────────────────
const NEWS_BADGES = ['Nyhet', 'Fangst', 'Kurs', 'Styre', 'Miljø', 'Info', 'Sesong', 'Arrangement']
const NEWS_COLORS = [CO.forest, CO.river, '#3a5a3a', '#6b4a1a']

function NewsPage({ news, setNews, showToast }) {
  const empty = { date: '', badge: 'Nyhet', title: '', text: '', color: CO.river }
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(empty)
  const [confirmId, setConfirmId] = useState(null)
  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }))
  const sortedNews = [...news].sort((a, b) => new Date(b.date || '0') - new Date(a.date || '0'))
  const openNew = () => { setEditId(null); setForm(empty); setOpen(true) }
  const openEdit = (item) => { setEditId(item.id); setForm({ ...item }); setOpen(true) }
  const save = () => {
    if (!form.title.trim()) return
    const updated = editId ? news.map((n) => n.id === editId ? { ...form, id: editId } : n) : [{ ...form, id: nextId(news) }, ...news]
    setNews(updated); setOpen(false); showToast(editId ? 'Nyhet oppdatert' : 'Nyhet publisert')
  }
  const remove = (id) => { setNews(news.filter((n) => n.id !== id)); setConfirmId(null); showToast('Nyhet slettet') }
  return (
    <div className="tf-wrap">
      <div className="tf-ph">
        <div><p className="tf-label">Aktuelt</p><h2 className="tf-title">Nyheter & meldinger</h2></div>
        <TFBtn variant="primary" onClick={openNew}>+ Ny nyhet</TFBtn>
      </div>
      <div className="tf-grid">
        {sortedNews.map((n) => (
          <div key={n.id} className="tf-card">
            <div style={{ height: 110, background: `linear-gradient(135deg, ${n.color || CO.forest} 0%, ${CO.river} 100%)`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ position: 'absolute', top: 9, left: 9, background: CO.gold, color: CO.deep, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', padding: '2px 8px', borderRadius: 3 }}>{n.badge}</span>
              <svg width="45" height="45" viewBox="0 0 80 80" fill="none" opacity=".2"><path d="M15 60 Q30 30 50 45 Q65 55 70 35" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" /><circle cx="50" cy="45" r="5" fill={CO.gold} /></svg>
            </div>
            <div style={{ padding: '1rem' }}>
              <p style={{ fontSize: 12, color: CO.muted, marginBottom: 3 }}>{formatDate(n.date)}</p>
              <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: CO.forest, marginBottom: 5, lineHeight: 1.3, fontSize: '.95rem' }}>{n.title}</p>
              <p style={{ fontSize: 13, color: CO.muted, lineHeight: 1.6, marginBottom: 10 }}>{n.text}</p>
              <div style={{ display: 'flex', gap: 5 }}>
                <TFBtn small onClick={() => openEdit(n)}>✏ Rediger</TFBtn>
                <TFBtn small variant="danger" onClick={() => setConfirmId(n.id)}>🗑 Slett</TFBtn>
              </div>
            </div>
          </div>
        ))}
      </div>
      {open && (
        <Modal title={editId ? 'Rediger nyhet' : 'Ny nyhet'} onClose={() => setOpen(false)}>
          <FormRow label="Dato"><TFInput value={form.date} onChange={(v) => f('date', v)} type="date" /></FormRow>
          <FormRow label="Badge"><TFSelect value={form.badge} onChange={(v) => f('badge', v)} options={NEWS_BADGES} /></FormRow>
          <FormRow label="Tittel"><TFInput value={form.title} onChange={(v) => f('title', v)} placeholder="Overskrift…" /></FormRow>
          <FormRow label="Ingress"><TFInput value={form.text} onChange={(v) => f('text', v)} placeholder="Kort beskrivelse…" multiline /></FormRow>
          <FormRow label="Kortfarge">
            <div style={{ display: 'flex', gap: 8 }}>
              {NEWS_COLORS.map((col) => <div key={col} onClick={() => f('color', col)} style={{ width: 30, height: 30, borderRadius: 6, background: col, cursor: 'pointer', border: form.color === col ? `3px solid ${CO.gold}` : '2px solid transparent' }} />)}
            </div>
          </FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '.5rem' }}>
            <TFBtn onClick={() => setOpen(false)}>Avbryt</TFBtn>
            <TFBtn variant="primary" onClick={save}>{editId ? 'Lagre' : 'Publiser'}</TFBtn>
          </div>
        </Modal>
      )}
      {confirmId && <ConfirmDialog message="Vil du slette denne nyheten?" onConfirm={() => remove(confirmId)} onCancel={() => setConfirmId(null)} />}
    </div>
  )
}

// ─── Events ───────────────────────────────────────────────────────────────────
const EVENT_TAGS = ['Kurs', 'Sosialt', 'Stevne', 'Konkurranse', 'Info', 'Dugnad']
const TAG_STYLES = { Kurs: ['rgba(45,106,143,.12)', '#1a5070'], Sosialt: ['rgba(26,78,26,.12)', '#1a4a1a'], Stevne: ['rgba(200,146,42,.15)', '#5a3a00'], Konkurranse: ['rgba(180,50,50,.12)', '#4a1a1a'], Info: ['rgba(80,80,180,.12)', '#3a3a6a'], Dugnad: ['rgba(100,100,100,.12)', '#3a3a3a'] }

function EventsPage({ events, setEvents, showToast }) {
  const empty = { day: '', month: '', date: '', title: '', location: '', time: '', note: '', tag: 'Sosialt' }
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(empty)
  const [confirmId, setConfirmId] = useState(null)
  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }))
  const sortedEvents = [...events].sort((a, b) => new Date(a.date || '9999') - new Date(b.date || '9999'))
  const openNew = () => { setEditId(null); setForm(empty); setOpen(true) }
  const openEdit = (ev) => { setEditId(ev.id); setForm({ ...ev }); setOpen(true) }
  const save = () => {
    if (!form.title.trim()) return
    const updated = editId ? events.map((e) => e.id === editId ? { ...form, id: editId } : e) : [...events, { ...form, id: nextId(events) }]
    setEvents(updated); setOpen(false); showToast(editId ? 'Arrangement oppdatert' : 'Arrangement lagt til')
  }
  const remove = (id) => { setEvents(events.filter((e) => e.id !== id)); setConfirmId(null); showToast('Arrangement slettet') }
  return (
    <div className="tf-wrap">
      <div className="tf-ph">
        <div><p className="tf-label">Kalender</p><h2 className="tf-title">Arrangementer</h2></div>
        <TFBtn variant="primary" onClick={openNew}>+ Nytt arrangement</TFBtn>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
        {sortedEvents.map((ev) => {
          const [bg, col] = TAG_STYLES[ev.tag] || TAG_STYLES.Info
          return (
            <div key={ev.id} className="tf-card" style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '52px 1fr auto', gap: '.9rem', alignItems: 'center' }}>
              <div style={{ background: CO.forest, color: CO.cream, borderRadius: 7, textAlign: 'center', padding: '5px 4px', lineHeight: 1 }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, color: CO.gold, display: 'block' }}>{ev.day}</span>
                <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.08em', opacity: .8 }}>{ev.month}</span>
              </div>
              <div>
                <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: CO.forest, marginBottom: 2, fontSize: '.92rem' }}>{ev.title}</p>
                <p style={{ fontSize: 12, color: CO.muted }}>📍 {ev.location} · {ev.time}{ev.note ? ` · ${ev.note}` : ''}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
                <span className="tf-badge tf-ev-tag" style={{ background: bg, color: col, border: 'none' }}>{ev.tag}</span>
                <div style={{ display: 'flex', gap: 5 }}>
                  <TFBtn small onClick={() => openEdit(ev)}>✏</TFBtn>
                  <TFBtn small variant="danger" onClick={() => setConfirmId(ev.id)}>🗑</TFBtn>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {open && (
        <Modal title={editId ? 'Rediger arrangement' : 'Nytt arrangement'} onClose={() => setOpen(false)}>
          <FormRow label="Dato"><TFInput value={form.date} onChange={(v) => {
            f('date', v)
            if (v) {
              const d = new Date(v)
              setForm((p) => ({
                ...p,
                date: v,
                day: String(d.getDate()).padStart(2, '0'),
                month: d.toLocaleString('nb-NO', { month: 'short' }).replace('.', '').replace(/^\w/, c => c.toUpperCase()),
              }))
            }
          }} type="date" /></FormRow>
          <FormRow label="Tittel"><TFInput value={form.title} onChange={(v) => f('title', v)} placeholder="Arrangementsnavn" /></FormRow>
          <FormRow label="Sted"><TFInput value={form.location} onChange={(v) => f('location', v)} placeholder="Klubbhuset, Lillehammer" /></FormRow>
          <FormRow label="Tid"><TFInput value={form.time} onChange={(v) => f('time', v)} placeholder="10:00–14:00" /></FormRow>
          <FormRow label="Merknad"><TFInput value={form.note} onChange={(v) => f('note', v)} placeholder="Valgfritt…" /></FormRow>
          <FormRow label="Type"><TFSelect value={form.tag} onChange={(v) => f('tag', v)} options={EVENT_TAGS} /></FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <TFBtn onClick={() => setOpen(false)}>Avbryt</TFBtn>
            <TFBtn variant="primary" onClick={save}>{editId ? 'Lagre' : 'Legg til'}</TFBtn>
          </div>
        </Modal>
      )}
      {confirmId && <ConfirmDialog message="Vil du slette dette arrangementet?" onConfirm={() => remove(confirmId)} onCancel={() => setConfirmId(null)} />}
    </div>
  )
}

// ─── Catches / Toppliste ──────────────────────────────────────────────────────
const SPECIES_LIST = ['Ørret', 'Harr', 'Laks', 'Abbor', 'Gjedde', 'Røye', 'Sik', 'Mort']
const METHOD_LIST = ['Flue', 'Sluk', 'Mark', 'Wobbler', 'Isfiske', 'Annet']
const MEDALS = ['🥇', '🥈', '🥉']

function CatchesPage({ catches, setCatches, members, waters, showToast }) {
  const mnames = members.map((m) => m.name)
  const wnames = waters.map((w) => w.name)
  const empty = { angler: mnames[0] || '', species: 'Ørret', weight: '', length: '', water: wnames[0] || '', method: 'Flue', date: '', note: '' }
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(empty)
  const [confirmId, setConfirmId] = useState(null)
  const [sortBy, setSortBy] = useState('weight')
  const [filterSpecies, setFilterSpecies] = useState('Alle')
  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }))
  const allSpecies = ['Alle', ...new Set(catches.map((c) => c.species))]
  const sorted = [...catches].filter((c) => filterSpecies === 'Alle' || c.species === filterSpecies).sort((a, b) => sortBy === 'weight' ? b.weight - a.weight : b.length - a.length)
  const openNew = () => { setEditId(null); setForm({ ...empty, angler: mnames[0] || '', water: wnames[0] || '' }); setOpen(true) }
  const openEdit = (c) => { setEditId(c.id); setForm({ ...c, weight: String(c.weight), length: String(c.length) }); setOpen(true) }
  const save = () => {
    if (!form.angler || !form.weight) return
    const entry = { ...form, id: editId || nextId(catches), weight: parseFloat(form.weight) || 0, length: parseFloat(form.length) || 0 }
    const updated = editId ? catches.map((c) => c.id === editId ? entry : c) : [entry, ...catches]
    setCatches(updated); setOpen(false); showToast(editId ? 'Fangst oppdatert' : 'Fangst registrert')
  }
  const remove = (id) => { setCatches(catches.filter((c) => c.id !== id)); setConfirmId(null); showToast('Fangst slettet') }
  return (
    <div className="tf-wrap">
      <div className="tf-ph">
        <div><p className="tf-label">Sesongen 2025</p><h2 className="tf-title">Toppliste — Fangst</h2></div>
        <TFBtn variant="primary" onClick={openNew}>+ Registrer fangst</TFBtn>
      </div>
      <div style={{ display: 'flex', gap: '.6rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flex: 1 }}>
          {allSpecies.map((s) => (
            <button key={s} onClick={() => setFilterSpecies(s)} style={{ padding: '5px 11px', borderRadius: 20, border: `1px solid ${filterSpecies === s ? CO.gold : '#ccc'}`, background: filterSpecies === s ? 'rgba(200,146,42,.15)' : 'transparent', color: filterSpecies === s ? CO.gold : CO.muted, fontWeight: filterSpecies === s ? 600 : 400, fontSize: 12, cursor: 'pointer' }}>
              {s}
            </button>
          ))}
        </div>
        <TFSelect value={sortBy} onChange={setSortBy} options={[{ value: 'weight', label: 'Tyngst fisk' }, { value: 'length', label: 'Lengste fisk' }]} />
      </div>
      {sorted.length > 0 && (
        <div className="tf-podium" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {sorted.slice(0, 3).map((c, i) => (
            <div key={c.id} style={{ background: i === 0 ? CO.forest : CO.white, border: `2px solid ${i === 0 ? CO.gold : CO.creamDk}`, borderRadius: 10, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 3 }}>{MEDALS[i]}</div>
              <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1rem', color: i === 0 ? CO.gold : CO.forest, marginBottom: 2 }}>{c.angler}</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: i === 0 ? CO.cream : CO.text }}>{c.weight} kg</p>
              <p style={{ fontSize: 12, color: i === 0 ? CO.mist : CO.muted }}>{c.length} cm · {c.species}</p>
              <p style={{ fontSize: 11, color: i === 0 ? CO.mist : CO.muted, opacity: .7, marginTop: 2 }}>{c.water}</p>
            </div>
          ))}
        </div>
      )}
      <div className="tf-card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 500 }}>
          <thead>
            <tr style={{ background: CO.forest }}>
              {['#', 'Fisker', 'Art', 'Vekt', 'Lengde', 'Vann', 'Metode', 'Dato', ''].map((h) => (
                <th key={h} style={{ padding: '9px 11px', textAlign: 'left', color: CO.mist, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${CO.creamDk}`, background: i % 2 === 0 ? CO.white : '#faf7f2' }}>
                <td style={{ padding: '9px 11px', fontWeight: 700, color: i < 3 ? CO.gold : CO.muted }}>{MEDALS[i] || i + 1}</td>
                <td style={{ padding: '9px 11px', fontWeight: 600, color: CO.forest, whiteSpace: 'nowrap' }}>{c.angler}</td>
                <td style={{ padding: '9px 11px' }}>{c.species}</td>
                <td style={{ padding: '9px 11px', fontWeight: 700, color: CO.forest }}>{c.weight} kg</td>
                <td style={{ padding: '9px 11px' }}>{c.length} cm</td>
                <td style={{ padding: '9px 11px', color: CO.muted, whiteSpace: 'nowrap' }}>{c.water}</td>
                <td style={{ padding: '9px 11px', color: CO.muted }}>{c.method}</td>
                <td style={{ padding: '9px 11px', color: CO.muted, whiteSpace: 'nowrap' }}>{formatDate(c.date)}</td>
                <td style={{ padding: '9px 11px' }}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <TFBtn small onClick={() => openEdit(c)}>✏</TFBtn>
                    <TFBtn small variant="danger" onClick={() => setConfirmId(c.id)}>🗑</TFBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: CO.muted }}>Ingen fangster registrert.</p>}
      </div>
      {open && (
        <Modal title={editId ? 'Rediger fangst' : 'Registrer fangst'} onClose={() => setOpen(false)}>
          <FormRow label="Fisker"><TFSelect value={form.angler} onChange={(v) => f('angler', v)} options={mnames} /></FormRow>
          <FormRow label="Art"><TFSelect value={form.species} onChange={(v) => f('species', v)} options={SPECIES_LIST} /></FormRow>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormRow label="Vekt (kg)"><TFInput value={form.weight} onChange={(v) => f('weight', v)} placeholder="2.3" type="number" /></FormRow>
            <FormRow label="Lengde (cm)"><TFInput value={form.length} onChange={(v) => f('length', v)} placeholder="54" type="number" /></FormRow>
          </div>
          <FormRow label="Vann"><TFSelect value={form.water} onChange={(v) => f('water', v)} options={wnames} /></FormRow>
          <FormRow label="Metode"><TFSelect value={form.method} onChange={(v) => f('method', v)} options={METHOD_LIST} /></FormRow>
          <FormRow label="Dato"><TFInput value={form.date} onChange={(v) => f('date', v)} type="date" /></FormRow>
          <FormRow label="Merknad"><TFInput value={form.note} onChange={(v) => f('note', v)} placeholder="Valgfritt…" /></FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <TFBtn onClick={() => setOpen(false)}>Avbryt</TFBtn>
            <TFBtn variant="primary" onClick={save}>{editId ? 'Lagre' : 'Registrer'}</TFBtn>
          </div>
        </Modal>
      )}
      {confirmId && <ConfirmDialog message="Vil du slette denne fangsten?" onConfirm={() => remove(confirmId)} onCancel={() => setConfirmId(null)} />}
    </div>
  )
}

// ─── Members ──────────────────────────────────────────────────────────────────
const MEMBER_BADGES = ['', 'Styre', 'Æresmedlem', 'Rekordinnehaver', 'Junior']

function MembersPage({ members, setMembers, showToast }) {
  const empty = { name: '', role: '', badge: '', photo: '' }
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(empty)
  const [confirmId, setConfirmId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handlePhoto = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const b64 = await fileToBase64(file)
      f('photo', b64)
    } catch (err) { console.error(err) }
    setUploading(false)
  }

  const openNew = () => { setEditId(null); setForm(empty); setOpen(true) }
  const openEdit = (m) => { setEditId(m.id); setForm({ ...m, photo: m.photo || '' }); setOpen(true) }
  const save = () => {
    if (!form.name.trim()) return
    const updated = editId ? members.map((m) => m.id === editId ? { ...form, id: editId } : m) : [...members, { ...form, id: nextId(members) }]
    setMembers(updated); setOpen(false); showToast(editId ? 'Medlem oppdatert' : 'Nytt medlem lagt til')
  }
  const remove = (id) => { setMembers(members.filter((m) => m.id !== id)); setConfirmId(null); showToast('Medlem fjernet') }

  return (
    <div className="tf-wrap">
      <div className="tf-ph">
        <div>
          <p className="tf-label">Klubbens folk</p>
          <h2 className="tf-title">Medlemmer & styre</h2>
          <p style={{ fontSize: 13, color: CO.muted, marginTop: 3 }}>{members.length} registrerte medlemmer</p>
        </div>
        <TFBtn variant="primary" onClick={openNew}>+ Nytt medlem</TFBtn>
      </div>
      <div className="tf-grid-sm">
        {members.map((m) => (
          <div key={m.id} className="tf-card" style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '.65rem' }}>
              <MemberAvatar name={m.name} photo={m.photo} size={56} />
            </div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '.88rem', fontWeight: 700, color: CO.forest, marginBottom: 2 }}>{m.name}</p>
            <p style={{ fontSize: 11, color: CO.muted, marginBottom: m.badge ? 5 : 10 }}>{m.role}</p>
            {m.badge && <span className="tf-badge tf-badge-gold" style={{ marginBottom: 8, display: 'inline-flex' }}>{m.badge}</span>}
            <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginTop: 4 }}>
              <TFBtn small onClick={() => openEdit(m)}>✏</TFBtn>
              <TFBtn small variant="danger" onClick={() => setConfirmId(m.id)}>🗑</TFBtn>
            </div>
          </div>
        ))}
      </div>
      {open && (
        <Modal title={editId ? 'Rediger medlem' : 'Nytt medlem'} onClose={() => setOpen(false)}>
          <FormRow label="Profilbilde">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="photo-upload">
                {form.photo
                  ? <img src={form.photo} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22 }}>📷</div>
                      <div style={{ fontSize: 10, color: CO.muted, marginTop: 2 }}>Last opp</div>
                    </div>
                }
                <input type="file" accept="image/*" onChange={handlePhoto} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, color: CO.muted, lineHeight: 1.5 }}>Klikk sirkelen for å laste opp bilde. Vises på medlemskortet.</p>
                {uploading && <p style={{ fontSize: 12, color: CO.gold, marginTop: 4 }}>Laster opp…</p>}
                {form.photo && <button onClick={() => f('photo', '')} style={{ fontSize: 12, color: '#c0392b', marginTop: 6, textDecoration: 'underline', cursor: 'pointer' }}>Fjern bilde</button>}
              </div>
            </div>
          </FormRow>
          <FormRow label="Fullt navn"><TFInput value={form.name} onChange={(v) => f('name', v)} placeholder="Ola Nordmann" /></FormRow>
          <FormRow label="Rolle / tittel"><TFInput value={form.role} onChange={(v) => f('role', v)} placeholder="Medlem siden 2025" /></FormRow>
          <FormRow label="Badge (valgfri)"><TFSelect value={form.badge} onChange={(v) => f('badge', v)} options={MEMBER_BADGES.map((b) => ({ value: b, label: b || '— ingen badge —' }))} /></FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <TFBtn onClick={() => setOpen(false)}>Avbryt</TFBtn>
            <TFBtn variant="primary" onClick={save}>{editId ? 'Lagre' : 'Legg til'}</TFBtn>
          </div>
        </Modal>
      )}
      {confirmId && <ConfirmDialog message={`Vil du fjerne ${members.find((m) => m.id === confirmId)?.name}?`} onConfirm={() => remove(confirmId)} onCancel={() => setConfirmId(null)} />}
    </div>
  )
}

// ─── Waters ───────────────────────────────────────────────────────────────────
function WatersPage({ waters, setWaters, showToast }) {
  const empty = { name: '', location: '', desc: '', tags: [] }
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(empty)
  const [tagInput, setTagInput] = useState('')
  const [confirmId, setConfirmId] = useState(null)
  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }))
  const addTag = () => { const t = tagInput.trim(); if (t && !form.tags.includes(t)) setForm((p) => ({ ...p, tags: [...p.tags, t] })); setTagInput('') }
  const openNew = () => { setEditId(null); setForm(empty); setTagInput(''); setOpen(true) }
  const openEdit = (w) => { setEditId(w.id); setForm({ ...w, tags: [...w.tags] }); setTagInput(''); setOpen(true) }
  const save = () => {
    if (!form.name.trim()) return
    const updated = editId ? waters.map((w) => w.id === editId ? { ...form, id: editId } : w) : [...waters, { ...form, id: nextId(waters) }]
    setWaters(updated); setOpen(false); showToast(editId ? 'Fiskevann oppdatert' : 'Fiskevann lagt til')
  }
  const remove = (id) => { setWaters(waters.filter((w) => w.id !== id)); setConfirmId(null); showToast('Fiskevann fjernet') }
  return (
    <div className="tf-wrap">
      <div className="tf-ph">
        <div><p className="tf-label">Fiskerettigheter</p><h2 className="tf-title">Klubbens fiskevann</h2></div>
        <TFBtn variant="primary" onClick={openNew}>+ Nytt vann</TFBtn>
      </div>
      <div className="tf-grid">
        {waters.map((w) => (
          <div key={w.id} style={{ background: CO.forest, borderRadius: 10, padding: '1.4rem' }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: CO.gold, marginBottom: 3 }}>{w.name}</p>
            <p style={{ fontSize: 12, color: CO.mist, marginBottom: 8, opacity: .8 }}>📍 {w.location}</p>
            <p style={{ fontSize: 13, color: CO.cream, lineHeight: 1.6, marginBottom: 10, opacity: .85 }}>{w.desc}</p>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
              {w.tags.map((t) => <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, border: `1px solid rgba(200,146,42,.35)`, color: CO.goldLt }}>{t}</span>)}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <TFBtn small onClick={() => openEdit(w)} style={{ color: CO.cream, borderColor: 'rgba(255,255,255,.2)', background: 'rgba(255,255,255,.08)' }}>✏ Rediger</TFBtn>
              <TFBtn small variant="danger" onClick={() => setConfirmId(w.id)} style={{ background: 'rgba(220,60,60,.15)', borderColor: 'rgba(220,60,60,.3)', color: '#ff9a9a' }}>🗑</TFBtn>
            </div>
          </div>
        ))}
      </div>
      {open && (
        <Modal title={editId ? 'Rediger fiskevann' : 'Nytt fiskevann'} onClose={() => setOpen(false)}>
          <FormRow label="Navn"><TFInput value={form.name} onChange={(v) => f('name', v)} placeholder="Steinelva" /></FormRow>
          <FormRow label="Sted / størrelse"><TFInput value={form.location} onChange={(v) => f('location', v)} placeholder="Gausdal · 4,2 km" /></FormRow>
          <FormRow label="Beskrivelse"><TFInput value={form.desc} onChange={(v) => f('desc', v)} placeholder="Beskrivelse…" multiline /></FormRow>
          <FormRow label="Tags">
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
              {form.tags.map((t) => <TagPill key={t} label={t} onRemove={() => f('tags', form.tags.filter((x) => x !== t))} />)}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <TFInput value={tagInput} onChange={setTagInput} placeholder="Ørret, Flue…" style={{ flex: 1 }} />
              <TFBtn variant="forest" onClick={addTag}>+</TFBtn>
            </div>
          </FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <TFBtn onClick={() => setOpen(false)}>Avbryt</TFBtn>
            <TFBtn variant="primary" onClick={save}>{editId ? 'Lagre' : 'Legg til'}</TFBtn>
          </div>
        </Modal>
      )}
      {confirmId && <ConfirmDialog message="Vil du fjerne dette fiskevannet?" onConfirm={() => remove(confirmId)} onCancel={() => setConfirmId(null)} />}
    </div>
  )
}

// ─── Rules ────────────────────────────────────────────────────────────────────
function RulesPage({ rules, setRules, showToast }) {
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editItems, setEditItems] = useState([])
  const [newItemText, setNewItemText] = useState('')
  const [confirmId, setConfirmId] = useState(null)
  const startEdit = (r) => { setEditingId(r.id); setEditTitle(r.title); setEditItems([...r.items]); setNewItemText('') }
  const saveEdit = () => {
    setRules(rules.map((r) => r.id === editingId ? { ...r, title: editTitle, items: editItems } : r))
    setEditingId(null); showToast('Regler oppdatert')
  }
  const removeBlock = (id) => { setRules(rules.filter((r) => r.id !== id)); setConfirmId(null); showToast('Regelblokk slettet') }
  const addBlock = () => { setRules([...rules, { id: nextId(rules), icon: '📋', title: 'Ny regelblokk', items: ['Regel 1'] }]); showToast('Regelblokk lagt til') }
  return (
    <div className="tf-wrap">
      <div className="tf-ph">
        <div><p className="tf-label">Vedtekter & etikk</p><h2 className="tf-title">Regler og retningslinjer</h2></div>
        <TFBtn variant="primary" onClick={addBlock}>+ Ny regelblokk</TFBtn>
      </div>
      <div className="tf-grid">
        {rules.map((r) => (
          <div key={r.id} className="tf-card" style={{ padding: '1.4rem', borderLeft: `4px solid ${CO.gold}`, borderRadius: '0 10px 10px 0' }}>
            {editingId === r.id ? (
              <>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="tf-input" style={{ fontWeight: 700, marginBottom: 10 }} />
                {editItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
                    <input value={item} onChange={(e) => setEditItems((it) => it.map((x, j) => j === i ? e.target.value : x))} className="tf-input" style={{ flex: 1, fontSize: 13 }} />
                    <button onClick={() => setEditItems((it) => it.filter((_, j) => j !== i))} style={{ color: '#c0392b', fontSize: 18, padding: '0 4px', lineHeight: 1 }}>×</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 6, margin: '8px 0 12px' }}>
                  <TFInput value={newItemText} onChange={setNewItemText} placeholder="Ny regel…" style={{ flex: 1 }} />
                  <TFBtn variant="forest" onClick={() => { if (newItemText.trim()) { setEditItems((i) => [...i, newItemText.trim()]); setNewItemText('') } }}>+</TFBtn>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <TFBtn small variant="primary" onClick={saveEdit}>Lagre</TFBtn>
                  <TFBtn small onClick={() => setEditingId(null)}>Avbryt</TFBtn>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 700, color: CO.forest, marginBottom: 10 }}>{r.icon} {r.title}</h3>
                <ul style={{ paddingLeft: '1.1rem' }}>
                  {r.items.map((item, i) => <li key={i} style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 2 }}>{item}</li>)}
                </ul>
                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                  <TFBtn small onClick={() => startEdit(r)}>✏ Rediger</TFBtn>
                  <TFBtn small variant="danger" onClick={() => setConfirmId(r.id)}>🗑</TFBtn>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      {confirmId && <ConfirmDialog message="Vil du slette denne regelblokken?" onConfirm={() => removeBlock(confirmId)} onCancel={() => setConfirmId(null)} />}
    </div>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [page, setPage] = useState('hjem')
  const [toastMsg, setToastMsg] = useState(null)
  const toastTimer = useRef(null)

  const [news, setNews] = useState(SEED.news)
  const [events, setEvents] = useState(SEED.events)
  const [members, setMembers] = useState(SEED.members)
  const [waters, setWaters] = useState(SEED.waters)
  const [rules, setRules] = useState(SEED.rules)
  const [catches, setCatches] = useState(SEED.catches)

  // On mount: load from Firebase, seed if empty, then listen for real-time updates
  useEffect(() => {
    const KEYS = ['news', 'events', 'members', 'waters', 'rules', 'catches']
    const setters = { news: setNews, events: setEvents, members: setMembers, waters: setWaters, rules: setRules, catches: setCatches }

    // Load once, then seed if nothing in Firebase yet
    Promise.all(KEYS.map((k) => fbGet(k))).then((results) => {
      KEYS.forEach((k, i) => {
        if (results[i] && results[i].length > 0) {
          setters[k](results[i])
        } else {
          // Nothing in Firebase yet — write seed data
          fbSet(k, SEED[k])
        }
      })
    })

    // Real-time listeners — always reflect latest Firebase data
    const unsubs = KEYS.map((k) => fbListen(k, (data) => setters[k](data)))
    return () => unsubs.forEach((u) => u())
  }, [])

  // Persist to Firebase whenever state changes
  const makeSetter = (setter, key) => (val) => {
    setter((prev) => {
      const v = typeof val === 'function' ? val(prev) : val
      fbSet(key, v)
      return v
    })
  }

  const setNewsP = makeSetter(setNews, 'news')
  const setEventsP = makeSetter(setEvents, 'events')
  const setMembersP = makeSetter(setMembers, 'members')
  const setWatersP = makeSetter(setWaters, 'waters')
  const setRulesP = makeSetter(setRules, 'rules')
  const setCatchesP = makeSetter(setCatches, 'catches')

  const showToast = (msg) => {
    setToastMsg(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(null), 2500)
  }

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />

  return (
    <div style={{ minHeight: '100dvh', background: CO.cream }}>
      <style>{GLOBAL_CSS}</style>
      <SiteNav currentPage={page} onNavigate={setPage} onLogout={() => setLoggedIn(false)} />

      {page === 'hjem' && <HomePage news={news} events={events} members={members} waters={waters} catches={catches} onNavigate={setPage} />}
      {page === 'nyheter' && <NewsPage news={news} setNews={setNewsP} showToast={showToast} />}
      {page === 'arrangement' && <EventsPage events={events} setEvents={setEventsP} showToast={showToast} />}
      {page === 'toppliste' && <CatchesPage catches={catches} setCatches={setCatchesP} members={members} waters={waters} showToast={showToast} />}
      {page === 'fiskevann' && <WatersPage waters={waters} setWaters={setWatersP} showToast={showToast} />}
      {page === 'regler' && <RulesPage rules={rules} setRules={setRulesP} showToast={showToast} />}
      {page === 'medlemmer' && <MembersPage members={members} setMembers={setMembersP} showToast={showToast} />}

      <footer style={{ background: CO.deep, color: 'rgba(245,240,232,.5)', padding: '2rem 1rem', textAlign: 'center', borderTop: `1px solid rgba(200,146,42,.2)` }}>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', color: CO.cream, marginBottom: 5 }}>
          Tordivelen <span style={{ color: CO.gold }}>&</span> Flugua
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.8 }}>Fiskeklubb stiftet 1987 · Nøklevann, Oslo <br />Kontakt: erikhaugen@tf-fiskeklubb.no</p>
      </footer>

      {toastMsg && <Toast message={toastMsg} />}
    </div>
  )
}
