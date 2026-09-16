import { useState, useEffect, useRef, useCallback } from 'react'
import { db } from './firebase.js'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'

const CREDENTIALS = { medlem: 'stangfisker', admin: 'leder2025' }

const CO = {
  forest: '#1a2e1a', deep: '#0f1d0f', river: '#2d6a8f',
  gold: '#c8922a', goldLt: '#e0b050', cream: '#f5f0e8',
  creamDk: '#e8e0d0', mist: '#d6e8d6', muted: '#6b7c6b',
  white: '#ffffff', text: '#2a2a2a',
}

const SEED = {
  news: [
    { id: 1, date: '2025-05-14', badge: 'Fangst', title: 'Årsrekord ørret fanget på Steinelva', text: 'Lars Holm satte ny klubbrekord med en 2,3 kg storvokst ørret. Fanget på en hjemmelaget caddis-flue i kveldstimene.', color: '#2d6a8f', photo: '' },
    { id: 2, date: '2025-05-02', badge: 'Kurs', title: 'Fluebinderkurs 7. juni', text: 'Kjell Andersen holder kurs i tradisjonell fluebinding. Maks 12 plasser.', color: '#1a2e1a', photo: '' },
    { id: 3, date: '2025-04-28', badge: 'Info', title: 'Ny parkeringsordning ved Langvann', text: 'Fra 1. juni innføres ny parkeringsordning. Parkering kun tillatt i merket område.', color: '#2d6a8f', photo: '' },
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
    { id: 1, name: 'Steinelva', location: 'Gausdal · 4,2 km', desc: 'Klubbens flaggskip. Rik bestand av storvokst ørret og harr.', tags: ['Ørret', 'Harr', 'Flue + sluk'], mapUrl: 'https://maps.google.com/?q=Steinelva+Gausdal+Norway' },
    { id: 2, name: 'Langvann', location: 'Øyer · 1,8 km²', desc: 'Stille fjellvann med god ørretbestand. Ideelt for båtfiske og flue fra land.', tags: ['Ørret', 'Båt tillatt', 'Flue'], mapUrl: 'https://maps.google.com/?q=Langvann+Øyer+Norway' },
    { id: 3, name: 'Håpetjernet', location: 'Lillehammer · 0,4 km²', desc: 'Nylig kalket og gjenopprettet. Åpner forventet sesong 2027.', tags: ['Ørret', 'Stengt til 2027'], mapUrl: 'https://maps.google.com/?q=Lillehammer+Norway' },
    { id: 4, name: 'Raudalselva', location: 'Ringebu · 2,8 km', desc: 'Villmarkspreget elv. Laks i nedre del i august.', tags: ['Laks', 'Ørret', 'Kun flue'], mapUrl: 'https://maps.google.com/?q=Raudalselva+Ringebu+Norway' },
    { id: 5, name: 'Bjørntjernet', location: 'Fåvang · 0,6 km²', desc: 'Lavlandssjø med stor abbor og noe gjedde. God for nybegynnere.', tags: ['Abbor', 'Gjedde', 'Alle metoder'], mapUrl: 'https://maps.google.com/?q=Fåvang+Norway' },
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
  merch: [],
}

const NO_MONTHS = ['januar','februar','mars','april','mai','juni','juli','august','september','oktober','november','desember']
function formatDate(iso) {
  if (!iso) return ''
  if (iso.includes('.')) return iso
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${parseInt(d)}. ${NO_MONTHS[parseInt(m) - 1]} ${y}`
}

const getInitials = (name) => name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
const nextId = (arr) => (arr.length ? Math.max(...arr.map((x) => x.id)) + 1 : 1)

async function fbGet(key) {
  try { const snap = await getDoc(doc(db, 'data', key)); return snap.exists() ? snap.data().items : null } catch { return null }
}
async function fbSet(key, value) {
  try { await setDoc(doc(db, 'data', key), { items: value }) } catch (e) { console.error(e) }
}
function fbListen(key, cb) {
  return onSnapshot(doc(db, 'data', key), (snap) => { if (snap.exists()) cb(snap.data().items) }, (err) => console.error(err))
}

function fileToBase64(file, maxSize = 600) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width, h = img.height
        if (w > h) { if (w > maxSize) { h = h * maxSize / w; w = maxSize } }
        else { if (h > maxSize) { w = w * maxSize / h; h = maxSize } }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.75))
      }
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=Inter:wght@400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Inter',sans-serif;background:#f5f0e8;color:#2a2a2a;-webkit-tap-highlight-color:transparent;}
  button,input,textarea,select{font-family:inherit;}
  button{cursor:pointer;border:none;background:none;}
  .tf-input{width:100%;padding:9px 12px;border:1px solid #d0c8b8;border-radius:6px;font-size:14px;background:#fff;color:#2a2a2a;outline:none;box-sizing:border-box;}
  .tf-input:focus{border-color:#c8922a;}
  textarea.tf-input{resize:vertical;min-height:72px;}
  input[type="date"].tf-input{cursor:pointer;}
  .tf-btn{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:6px;font-weight:600;font-size:13px;border:1px solid transparent;transition:opacity .15s,transform .1s;cursor:pointer;}
  .tf-btn:active{transform:scale(.97);}
  .tf-primary{background:#c8922a;color:#0f1d0f;border-color:#c8922a;}
  .tf-primary:hover{opacity:.9;}
  .tf-ghost{background:transparent;color:#6b7c6b;border-color:#ddd;}
  .tf-ghost:hover{background:#f0ebe0;}
  .tf-danger{background:rgba(220,60,60,.08);color:#c0392b;border-color:rgba(220,60,60,.2);}
  .tf-forest{background:#1a2e1a;color:#f5f0e8;}
  .tf-sm{padding:4px 9px;font-size:12px;}
  .tf-card{background:#fff;border:1px solid #e8e0d0;border-radius:10px;overflow:hidden;}
  .tf-wrap{max-width:1100px;margin:0 auto;padding:1.75rem 1rem;}
  .tf-ph{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:1.5rem;flex-wrap:wrap;gap:.75rem;}
  .tf-label{font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#c8922a;margin-bottom:4px;}
  .tf-title{font-family:'Playfair Display',serif;font-size:clamp(1.5rem,4vw,2.1rem);font-weight:700;color:#1a2e1a;line-height:1.15;}
  .tf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem;}
  .tf-grid-sm{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:1rem;}
  .tf-flabel{display:block;font-size:12px;font-weight:600;color:#6b7c6b;margin-bottom:5px;text-transform:uppercase;letter-spacing:.06em;}
  .tf-frow{margin-bottom:1rem;}
  .tf-badge{display:inline-flex;align-items:center;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:2px 8px;border-radius:20px;}
  .tf-badge-gold{background:rgba(200,146,42,.15);color:#c8922a;border:1px solid rgba(200,146,42,.3);}
  .tf-badge-blue{background:rgba(45,106,143,.12);color:#1a5070;border:1px solid rgba(45,106,143,.25);}
  .tf-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:600;display:flex;align-items:center;justify-content:center;padding:1rem;}
  .tf-modal{background:#f5f0e8;border-radius:12px;padding:1.5rem;width:100%;max-width:460px;max-height:90dvh;overflow-y:auto;}
  .tf-nav-desktop{display:flex;gap:1px;}
  .tf-hamburger{display:none!important;}
  .photo-upload{border:2px dashed #d0c8b8;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;position:relative;transition:border-color .2s;background:#faf7f2;}
  .photo-upload:hover{border-color:#c8922a;}
  .photo-upload input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;}
  .photo-upload.circle{border-radius:50%;width:80px;height:80px;}
  .photo-upload.rect{width:100%;height:160px;}
  /* GAME */
  .game-canvas{background:linear-gradient(180deg,#1a4a6e 0%,#2d6a8f 40%,#1a3a5e 100%);border-radius:12px;position:relative;overflow:hidden;cursor:crosshair;user-select:none;-webkit-user-select:none;}
  .fish{position:absolute;font-size:28px;transition:none;pointer-events:none;}
  .splash{position:absolute;pointer-events:none;font-size:20px;animation:splash .6s ease-out forwards;}
  @keyframes splash{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(2.5) translateY(-20px)}}
  .bobber{position:absolute;width:14px;height:14px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ff6b6b,#cc0000);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4);pointer-events:none;transition:top .15s ease;}
  .water-line{position:absolute;left:0;right:0;height:3px;background:rgba(255,255,255,.3);}
  @media(max-width:640px){
    .tf-wrap{padding:1.25rem .75rem;}
    .tf-nav-desktop{display:none!important;}
    .tf-hamburger{display:flex!important;}
    .tf-grid{grid-template-columns:1fr;}
    .tf-grid-sm{grid-template-columns:repeat(auto-fill,minmax(140px,1fr));}
    .tf-ev-tag{display:none!important;}
    .tf-modal{padding:1.25rem;}
    .tf-home-cols{grid-template-columns:1fr!important;}
    .tf-podium{grid-template-columns:1fr 1fr!important;}
  }
`


// Fultons kondisjonsfaktor: K = (100 * vekt_g) / lengde_cm³
function kFactor(weightKg, lengthCm) {
  if (!weightKg || !lengthCm || lengthCm === 0) return null
  const k = (weightKg * 1000 * 100) / Math.pow(lengthCm, 3)
  return k.toFixed(2)
}
function kLabel(k) {
  if (!k) return ''
  const v = parseFloat(k)
  if (v >= 1.4) return '🟢 Utmerket'
  if (v >= 1.1) return '🟡 God'
  if (v >= 0.8) return '🟠 Middels'
  return '🔴 Lav'
}
// ─── Shared UI ────────────────────────────────────────────────────────────────
function TFBtn({ children, variant = 'ghost', small = false, onClick, style = {} }) {
  const cls = ['tf-btn', variant === 'primary' ? 'tf-primary' : variant === 'danger' ? 'tf-danger' : variant === 'forest' ? 'tf-forest' : 'tf-ghost', small ? 'tf-sm' : ''].join(' ')
  return <button className={cls} onClick={onClick} style={style}>{children}</button>
}
function TFInput({ value, onChange, placeholder, multiline = false, type = 'text', style = {} }) {
  if (multiline) return <textarea className="tf-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={style} />
  return <input className="tf-input" type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={style} />
}
function TFSelect({ value, onChange, options }) {
  return <select className="tf-input" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => { const val = typeof o === 'object' ? o.value : o; const lbl = typeof o === 'object' ? o.label : o; return <option key={val} value={val}>{lbl}</option> })}</select>
}
function FormRow({ label, children }) { return <div className="tf-frow"><label className="tf-flabel">{label}</label>{children}</div> }
function Modal({ title, onClose, children }) {
  return <div className="tf-modal-bg" onClick={onClose}><div className="tf-modal" onClick={(e) => e.stopPropagation()}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}><strong style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: CO.forest }}>{title}</strong><button onClick={onClose} style={{ fontSize: 22, color: CO.muted, lineHeight: 1, padding: '0 4px' }}>×</button></div>{children}</div></div>
}
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return <Modal title="Bekreft sletting" onClose={onCancel}><p style={{ fontSize: 14, marginBottom: '1.5rem' }}>{message}</p><div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><TFBtn onClick={onCancel}>Avbryt</TFBtn><TFBtn variant="danger" onClick={onConfirm}>Slett</TFBtn></div></Modal>
}
function Toast({ message }) {
  return <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: CO.forest, color: CO.cream, padding: '10px 22px', borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 9999, border: `1px solid ${CO.gold}`, whiteSpace: 'nowrap', pointerEvents: 'none' }}>✓ {message}</div>
}
function TagPill({ label, onRemove }) {
  return <span className="tf-badge tf-badge-blue" style={{ gap: 4, marginRight: 4, marginBottom: 4 }}>{label}{onRemove && <span onClick={onRemove} style={{ cursor: 'pointer', marginLeft: 2, opacity: .7, fontWeight: 700, fontSize: 13 }}>×</span>}</span>
}
function MemberAvatar({ name, photo, size = 48 }) {
  if (photo) return <img src={photoSrc(photo)} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', objectPosition: `${photoX(photo)}% ${photoY(photo)}%`, display: 'block' }} />
  return <div style={{ width: size, height: size, borderRadius: '50%', background: `linear-gradient(135deg,${CO.forest},${CO.river})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display',serif", fontSize: size * 0.33, color: CO.gold, fontWeight: 700, flexShrink: 0 }}>{getInitials(name)}</div>
}

// Photo upload helper component
// photo is stored as { src: base64string, x: 50, y: 50 } — or plain string for legacy
function photoSrc(p) { return p && typeof p === 'object' ? p.src : p }
function photoX(p)   { return p && typeof p === 'object' ? (p.x ?? 50) : 50 }
function photoY(p)   { return p && typeof p === 'object' ? (p.y ?? 50) : 50 }

function PhotoUpload({ photo, onPhoto, onClear, circle = false, label = 'Last opp bilde' }) {
  const [uploading, setUploading] = useState(false)
  const dragRef = useRef(null)
  const containerRef = useRef(null)

  const src = photoSrc(photo)
  const ox  = photoX(photo)
  const oy  = photoY(photo)

  const handleFile = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setUploading(true)
    try {
      const b64 = await fileToBase64(file, circle ? 400 : 1200)
      onPhoto({ src: b64, x: 50, y: 50 })
    } catch {}
    setUploading(false)
  }

  const onPointerDown = (e) => {
    if (!src) return
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startY: e.clientY, startOX: ox, startOY: oy }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }
  const onPointerMove = (e) => {
    if (!dragRef.current) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    const newX = Math.max(0, Math.min(100, dragRef.current.startOX - (dx / rect.width)  * 100))
    const newY = Math.max(0, Math.min(100, dragRef.current.startOY - (dy / rect.height) * 100))
    onPhoto({ src, x: newX, y: newY })
  }
  const onPointerUp = () => {
    dragRef.current = null
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
  }
  useEffect(() => () => {
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
  }, [])

  const containerStyle = circle
    ? { position: 'relative', width: 80, height: 80, borderRadius: '50%', border: `2px dashed ${src ? '#c8922a' : '#d0c8b8'}`, overflow: 'hidden', flexShrink: 0, cursor: src ? 'grab' : 'pointer', background: '#faf7f2', touchAction: 'none' }
    : { position: 'relative', width: '100%', height: 140, borderRadius: 8, border: `2px dashed ${src ? '#c8922a' : '#d0c8b8'}`, overflow: 'hidden', cursor: src ? 'grab' : 'pointer', background: '#faf7f2', touchAction: 'none' }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div ref={containerRef} style={containerStyle} onPointerDown={onPointerDown}>
        {src ? (
          <>
            <img src={src} alt="preview"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${ox}% ${oy}%`, pointerEvents: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
              draggable={false} />
            <div style={{ position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.8)', pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
              ✥ Dra for å justere
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 4 }}>
            <div style={{ fontSize: circle ? 20 : 28 }}>📷</div>
            {!circle && <div style={{ fontSize: 11, color: CO.muted }}>{label}</div>}
          </div>
        )}
        {!src && <input type="file" accept="image/*" onChange={handleFile} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />}
      </div>
      <div style={{ flex: 1 }}>
        {!src && <p style={{ fontSize: 12, color: CO.muted, lineHeight: 1.5 }}>Klikk for å laste opp bilde.</p>}
        {src && <p style={{ fontSize: 12, color: CO.muted, marginBottom: 6 }}>Dra bildet for å velge utsnitt.</p>}
        {uploading && <p style={{ fontSize: 12, color: CO.gold }}>Laster opp…</p>}
        {src && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <label style={{ fontSize: 12, color: CO.river, textDecoration: 'underline', cursor: 'pointer' }}>
              Bytt bilde<input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
            </label>
            <button onClick={onClear} style={{ fontSize: 12, color: '#c0392b', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>Fjern bilde</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(false)
  const attempt = () => { if (CREDENTIALS[username.trim().toLowerCase()] === password) onLogin(); else { setError(true); setPassword('') } }
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
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', color: CO.cream, marginBottom: '.2rem' }}>Tordivelen <span style={{ color: CO.gold }}>&</span> Flugua</h1>
        <p style={{ fontStyle: 'italic', color: CO.mist, marginBottom: '1.75rem', opacity: .8, fontSize: 14 }}>Fiskeklubb — Medlemsportal</p>
        <div style={{ boxSizing: 'border-box', width: '100%' }}>
          {[['Brukernavn', username, setUsername, 'text'], ['Passord', password, setPassword, 'password']].map(([lbl, val, set, type]) => (
            <div key={lbl} style={{ textAlign: 'left', marginBottom: '.85rem' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: CO.mist, marginBottom: 4 }}>{lbl}</label>
              <input type={type} value={val} onChange={(e) => set(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && attempt()}
                style={{ display: 'block', width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,.06)', border: `1px solid ${error ? 'rgba(220,80,80,.5)' : 'rgba(200,146,42,.25)'}`, borderRadius: 6, padding: '10px 13px', color: CO.cream, fontSize: 15, outline: 'none', fontFamily: 'inherit' }} />
            </div>
          ))}
          {error && <p style={{ color: '#e07070', fontSize: 13, marginBottom: 8 }}>Feil brukernavn eller passord.</p>}
          <button onClick={attempt}
            style={{ display: 'block', width: '100%', boxSizing: 'border-box', background: CO.gold, color: CO.deep, border: '1px solid transparent', borderRadius: 6, padding: '10px 13px', fontWeight: 700, fontSize: 15, marginTop: 6, fontFamily: 'inherit', cursor: 'pointer' }}>
            Logg inn
          </button>
        </div>
        <p style={{ marginTop: '1.25rem', fontSize: 12, color: 'rgba(245,240,232,.35)', borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: '1rem' }}>Kontakt styret for innloggingsinfo</p>
      </div>
    </div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'hjem', label: 'Hjem' }, { id: 'nyheter', label: 'Nyheter' },
  { id: 'arrangement', label: 'Arrangement' }, { id: 'fiskevann', label: 'Fiskevann' },
  { id: 'toppliste', label: 'Toppliste' }, { id: 'merch', label: 'Merch' },
  { id: 'regler', label: 'Regler' }, { id: 'medlemmer', label: 'Medlemmer' },
  { id: 'spill', label: '🎮 Spill' },
]
function SiteNav({ currentPage, onNavigate, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <nav style={{ background: CO.forest, borderBottom: `2px solid ${CO.gold}`, position: 'sticky', top: 0, zIndex: 200 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <button onClick={() => { onNavigate('hjem'); setMobileOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="17" stroke={CO.gold} strokeWidth="1.2" /><ellipse cx="18" cy="14" rx="7" ry="3" fill={CO.river} opacity=".9" /><path d="M18 17 L18 27 Q18 31 22 31 Q26 31 26 27" stroke={CO.gold} strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '1rem', color: CO.cream }}>T<span style={{ color: CO.gold }}>&</span>F</span>
        </button>
        <div className="tf-nav-desktop" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
          {NAV_ITEMS.map((n) => <button key={n.id} onClick={() => onNavigate(n.id)} style={{ color: currentPage === n.id ? CO.gold : CO.mist, fontWeight: 500, fontSize: 12, padding: '6px 8px', borderRadius: 5 }}>{n.label}</button>)}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={onLogout} style={{ border: `1px solid rgba(200,146,42,.4)`, color: CO.gold, fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 6 }}>Logg ut</button>
          <button className="tf-hamburger" onClick={() => setMobileOpen((o) => !o)} style={{ color: CO.mist, fontSize: 22, lineHeight: 1, padding: '4px 2px' }}>{mobileOpen ? '✕' : '☰'}</button>
        </div>
      </div>
      {mobileOpen && (
        <div style={{ background: CO.forest, borderTop: `1px solid rgba(200,146,42,.2)`, padding: '.5rem 1rem 1rem' }}>
          {NAV_ITEMS.map((n) => <button key={n.id} onClick={() => { onNavigate(n.id); setMobileOpen(false) }} style={{ display: 'block', width: '100%', textAlign: 'left', color: currentPage === n.id ? CO.gold : CO.mist, fontWeight: 500, fontSize: 15, padding: '10px 8px', borderRadius: 6, borderBottom: `1px solid rgba(255,255,255,.05)` }}>{n.label}</button>)}
        </div>
      )}
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ memberCount, waterCount }) {
  return (
    <div style={{ background: CO.forest, position: 'relative', minHeight: 340, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 70% 0%,rgba(45,106,143,.25) 0%,transparent 60%),linear-gradient(180deg,#0f1d0f 0%,#1a2e1a 50%,#142814 100%)' }} />
      <svg style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, opacity: .35 }} viewBox="0 0 1200 100" preserveAspectRatio="none">
        <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2d6a8f" stopOpacity=".6" /><stop offset="100%" stopColor="#2d6a8f" stopOpacity="0" /></linearGradient></defs>
        <path d="M0 40 Q150 10 300 40 Q450 70 600 30 Q750 0 900 35 Q1050 70 1200 25 L1200 100 L0 100Z" fill="url(#wg)" />
      </svg>
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto', padding: '3.5rem 1rem 2.5rem', width: '100%' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: CO.gold, marginBottom: '.75rem' }}>Stiftet 1987 — Innlandet, Norge</p>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(2rem,6vw,3.8rem)', fontWeight: 900, color: CO.cream, lineHeight: 1.05, marginBottom: '1rem' }}>Der stangen møter<br /><em style={{ color: CO.gold }}>stille vann.</em></h1>
        <p style={{ fontSize: 'clamp(.9rem,2.5vw,1.05rem)', color: CO.mist, maxWidth: 440, lineHeight: 1.65, marginBottom: '1.5rem' }}>Tordivelen & Flugua er en fiskeklubb for de som elsker elva, fjellet og kunsten å presentere en flue.</p>
        <div style={{ display: 'flex', gap: '1.75rem', flexWrap: 'wrap' }}>
          {[[memberCount, 'Aktive medlemmer'], [waterCount, 'Fiskevann'], ['38', 'År med tradisjon']].map(([n, l]) => (
            <div key={l}><span style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.75rem', fontWeight: 700, color: CO.gold, display: 'block' }}>{n}</span><span style={{ fontSize: 11, color: CO.mist, textTransform: 'uppercase', letterSpacing: '.08em' }}>{l}</span></div>
          ))}
        </div>
      </div>
    </div>
  )
}


// ─── K-Factor Calculator ──────────────────────────────────────────────────────
function KFactorCalc() {
  const [weight, setWeight] = useState('')
  const [length, setLength] = useState('')

  const k = weight && length ? kFactor(parseFloat(weight), parseFloat(length)) : null
  const kv = k ? parseFloat(k) : null

  const getBanter = (k) => {
    if (k >= 2.0) return { emoji: '🏆', color: '#1a7a1a', title: 'Gudommelig fisk!', text: 'Dette er ikke en fisk, dette er en tønne med finner. Monsteret bør konserveres og stilles ut på museum. Snakk om kondisjon!' }
    if (k >= 1.6) return { emoji: '💪', color: '#2d7a2d', title: 'Eksepsjonell kondisjon!', text: 'Fisken trener tydeligvis mer enn du gjør. Godt fôret, kraftig og stolt. Dette er hva alle fisk burde streve etter.' }
    if (k >= 1.4) return { emoji: '🌟', color: '#3a8a3a', title: 'Utmerket form!', text: 'En fisk i toppform! Godt stelt vann, god mat og et lykkelig liv. Du har fanget en vinner.' }
    if (k >= 1.2) return { emoji: '😊', color: '#5a8a1a', title: 'Bra kondisjon!', text: 'Solid fisk! Ikke noe å skamme seg over. Den har spist jevnt og lever et hederlig fiskeliv.' }
    if (k >= 1.0) return { emoji: '😐', color: '#b87d00', title: 'Middels kondisjon', text: 'Fisken er... grei. Den har overlevd, men ikke akkurat blomstret. Litt som å være på diett mot sin vilje.' }
    if (k >= 0.85) return { emoji: '😟', color: '#c07000', title: 'Litt tynn...', text: 'Stakkars fisk. Den er tydelig ikke den som får den beste maten i vannet. Eller den er veldig god til å svømme vekk fra mat.' }
    if (k >= 0.7) return { emoji: '😬', color: '#d04000', title: 'Mager fisk!', text: 'Ønsket: mat. Snarest. Denne fisken har sett bedre dager. Er du sikker på at du ikke nettopp dro opp en pinne?' }
    if (k >= 0.5) return { emoji: '💀', color: '#c0392b', title: 'Kritisk mager!', text: 'Ring PETA. Denne fisken er på diett ufrivillig. Kondisjonsfaktoren er så lav at den nesten er i minus. Slipp den ut og gi den litt mat!' }
    return { emoji: '☠️', color: '#8b0000', title: 'Er dette en fisk?!', text: 'Gratulerer, du har fanget et tau. Dette er enten ikke en fisk, eller du har gjort en målefeil. Vi håper det siste. For fiskens skyld.' }
  }

  const banter = kv ? getBanter(kv) : null
  const barWidth = kv ? Math.min(100, (kv / 2.0) * 100) : 0
  const barColor = kv >= 1.4 ? '#2d7a2d' : kv >= 1.1 ? '#c8922a' : kv >= 0.8 ? '#d06000' : '#c0392b'

  return (
    <div style={{ background: CO.white, border: `1px solid ${CO.creamDk}`, borderRadius: 12, padding: '1.5rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
        <span style={{ fontSize: '1.5rem' }}>🧮</span>
        <div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.1rem', fontWeight: 700, color: CO.forest, lineHeight: 1.2 }}>K-faktor kalkulator</h3>
          <p style={{ fontSize: 12, color: CO.muted }}>Fultons kondisjonsfaktor — K = (vekt i gram × 100) / lengde³</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: CO.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Vekt (kg)</label>
          <input
            type="number" value={weight} onChange={e => setWeight(e.target.value)}
            placeholder="f.eks. 1.8"
            style={{ width: '100%', padding: '9px 12px', border: `1px solid ${CO.creamDk}`, borderRadius: 6, fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: CO.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Lengde (cm)</label>
          <input
            type="number" value={length} onChange={e => setLength(e.target.value)}
            placeholder="f.eks. 49"
            style={{ width: '100%', padding: '9px 12px', border: `1px solid ${CO.creamDk}`, borderRadius: 6, fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {k && banter && (
        <div style={{ animation: 'fadeIn .3s ease' }}>
          {/* Result bar */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 13, color: CO.muted }}>Kondisjonsfaktor</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: barColor }}>K = {k}</span>
            </div>
            <div style={{ height: 12, background: CO.creamDk, borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${barWidth}%`, background: barColor, borderRadius: 6, transition: 'width .4s ease, background .4s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: CO.muted, marginTop: 3 }}>
              <span>0.5 (elendig)</span><span>1.0 (middels)</span><span>1.4 (bra)</span><span>2.0+ (monster)</span>
            </div>
          </div>

          {/* Banter card */}
          <div style={{ background: `${banter.color}12`, border: `1.5px solid ${banter.color}40`, borderRadius: 10, padding: '1rem 1.1rem', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '2rem', flexShrink: 0, lineHeight: 1 }}>{banter.emoji}</span>
            <div>
              <p style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, color: banter.color, fontSize: '1rem', marginBottom: 4 }}>{banter.title}</p>
              <p style={{ fontSize: 13, color: CO.text, lineHeight: 1.65 }}>{banter.text}</p>
            </div>
          </div>
        </div>
      )}

      {!k && (
        <p style={{ fontSize: 13, color: CO.muted, textAlign: 'center', padding: '.5rem 0' }}>Skriv inn vekt og lengde for å se kondisjonsfaktoren 👆</p>
      )}
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
          <span><b>Sesongstart 2025:</b> Fisket åpner 1. juni. Husk å fornye fiskekortavtalen innen 15. mai via kasserer.</span>
        </div>
        <KFactorCalc />
        {topCatch && (
          <div style={{ background: CO.forest, borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.75rem' }}>🏆</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: CO.gold, marginBottom: 2 }}>Sesongens rekord</p>
              <p style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, color: CO.cream, fontSize: '1rem' }}>{topCatch.angler} — {topCatch.weight} kg {topCatch.species}</p>
              <p style={{ fontSize: 12, color: CO.mist, opacity: .8 }}>{topCatch.water} · {formatDate(topCatch.date)}</p>
            </div>
            <button onClick={() => onNavigate('toppliste')} style={{ border: `1px solid rgba(200,146,42,.4)`, color: CO.gold, fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 6, whiteSpace: 'nowrap' }}>Se toppliste →</button>
          </div>
        )}
        <div className="tf-home-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.3rem', fontWeight: 700, color: CO.forest }}>Siste nyheter</h2>
              <button onClick={() => onNavigate('nyheter')} style={{ color: CO.river, fontWeight: 600, fontSize: 13 }}>Se alle →</button>
            </div>
            {[...news].sort((a, b) => new Date(b.date || '0') - new Date(a.date || '0')).slice(0, 3).map((n) => (
              <div key={n.id} style={{ borderBottom: `1px solid ${CO.creamDk}`, paddingBottom: '.85rem', marginBottom: '.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ background: CO.gold, color: CO.deep, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', padding: '2px 7px', borderRadius: 3 }}>{n.badge}</span>
                  <span style={{ fontSize: 11, color: CO.muted }}>{formatDate(n.date)}</span>
                </div>
                <p style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, color: CO.forest, marginBottom: 2, fontSize: '.93rem' }}>{n.title}</p>
                <p style={{ fontSize: 13, color: CO.muted, lineHeight: 1.6 }}>{n.text}</p>
              </div>
            ))}
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.3rem', fontWeight: 700, color: CO.forest }}>Kommende arrangement</h2>
              <button onClick={() => onNavigate('arrangement')} style={{ color: CO.river, fontWeight: 600, fontSize: 13 }}>Se alle →</button>
            </div>
            {[...events].sort((a, b) => new Date(a.date || '9999') - new Date(b.date || '9999')).slice(0, 4).map((ev) => (
              <div key={ev.id} style={{ display: 'flex', gap: '.8rem', borderBottom: `1px solid ${CO.creamDk}`, paddingBottom: '.85rem', marginBottom: '.85rem', alignItems: 'flex-start' }}>
                <div style={{ background: CO.forest, color: CO.cream, borderRadius: 7, textAlign: 'center', padding: '5px 7px', lineHeight: 1, flexShrink: 0, minWidth: 44 }}>
                  <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.2rem', fontWeight: 700, color: CO.gold, display: 'block' }}>{ev.day}</span>
                  <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.08em', opacity: .8 }}>{ev.month}</span>
                </div>
                <div>
                  <p style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, color: CO.forest, marginBottom: 2, fontSize: '.9rem' }}>{ev.title}</p>
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
  const empty = { date: '', badge: 'Nyhet', title: '', text: '', color: CO.river, photo: '' }
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(empty)
  const [confirmId, setConfirmId] = useState(null)
  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }))
  const sortedNews = [...news].sort((a, b) => new Date(b.date || '0') - new Date(a.date || '0'))
  const openNew = () => { setEditId(null); setForm(empty); setOpen(true) }
  const openEdit = (item) => { setEditId(item.id); setForm({ ...item, photo: item.photo || '' }); setOpen(true) }
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
            {n.photo
              ? <img src={photoSrc(n.photo)} alt={n.title} style={{ width: '100%', height: 160, objectFit: 'cover', objectPosition: `${photoX(n.photo)}% ${photoY(n.photo)}%` }} />
              : <div style={{ height: 110, background: `linear-gradient(135deg,${n.color || CO.forest} 0%,${CO.river} 100%)`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ position: 'absolute', top: 9, left: 9, background: CO.gold, color: CO.deep, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', padding: '2px 8px', borderRadius: 3 }}>{n.badge}</span>
                  <svg width="45" height="45" viewBox="0 0 80 80" fill="none" opacity=".2"><path d="M15 60 Q30 30 50 45 Q65 55 70 35" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" /><circle cx="50" cy="45" r="5" fill={CO.gold} /></svg>
                </div>
            }
            <div style={{ padding: '1rem' }}>
              {photoSrc(n.photo) && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><span style={{ background: CO.gold, color: CO.deep, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', padding: '2px 8px', borderRadius: 3 }}>{n.badge}</span></div>}
              <p style={{ fontSize: 12, color: CO.muted, marginBottom: 3 }}>{formatDate(n.date)}</p>
              <p style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, color: CO.forest, marginBottom: 5, lineHeight: 1.3, fontSize: '.95rem' }}>{n.title}</p>
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
          <FormRow label="Bilde">
            <PhotoUpload photo={form.photo} onPhoto={(v) => f('photo', v)} onClear={() => f('photo', '')} label="Last opp nyhetsbilde" />
            {photoSrc(form.photo) && <button onClick={() => f('photo', '')} style={{ fontSize: 12, color: '#c0392b', marginTop: 6, textDecoration: 'underline', cursor: 'pointer', display: 'block' }}>Fjern bilde</button>}
          </FormRow>
          <FormRow label="Dato"><TFInput value={form.date} onChange={(v) => f('date', v)} type="date" /></FormRow>
          <FormRow label="Badge"><TFSelect value={form.badge} onChange={(v) => f('badge', v)} options={NEWS_BADGES} /></FormRow>
          <FormRow label="Tittel"><TFInput value={form.title} onChange={(v) => f('title', v)} placeholder="Overskrift…" /></FormRow>
          <FormRow label="Ingress"><TFInput value={form.text} onChange={(v) => f('text', v)} placeholder="Kort beskrivelse…" multiline /></FormRow>
          {!photoSrc(form.photo) && <FormRow label="Kortfarge"><div style={{ display: 'flex', gap: 8 }}>{NEWS_COLORS.map((col) => <div key={col} onClick={() => f('color', col)} style={{ width: 30, height: 30, borderRadius: 6, background: col, cursor: 'pointer', border: form.color === col ? `3px solid ${CO.gold}` : '2px solid transparent' }} />)}</div></FormRow>}
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
        <div><p className="tf-label">Kalender</p><h2 className="tf-title">Arrangement 2025</h2></div>
        <TFBtn variant="primary" onClick={openNew}>+ Nytt arrangement</TFBtn>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
        {sortedEvents.map((ev) => {
          const [bg, col] = TAG_STYLES[ev.tag] || TAG_STYLES.Info
          return (
            <div key={ev.id} className="tf-card" style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '52px 1fr auto', gap: '.9rem', alignItems: 'center' }}>
              <div style={{ background: CO.forest, color: CO.cream, borderRadius: 7, textAlign: 'center', padding: '5px 4px', lineHeight: 1 }}>
                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.3rem', fontWeight: 700, color: CO.gold, display: 'block' }}>{ev.day}</span>
                <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.08em', opacity: .8 }}>{ev.month}</span>
              </div>
              <div>
                <p style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, color: CO.forest, marginBottom: 2, fontSize: '.92rem' }}>{ev.title}</p>
                <p style={{ fontSize: 12, color: CO.muted }}>📍 {ev.location} · {ev.time}{ev.note ? ` · ${ev.note}` : ''}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
                <span className="tf-badge tf-ev-tag" style={{ background: bg, color: col, border: 'none' }}>{ev.tag}</span>
                <div style={{ display: 'flex', gap: 5 }}><TFBtn small onClick={() => openEdit(ev)}>✏</TFBtn><TFBtn small variant="danger" onClick={() => setConfirmId(ev.id)}>🗑</TFBtn></div>
              </div>
            </div>
          )
        })}
      </div>
      {open && (
        <Modal title={editId ? 'Rediger arrangement' : 'Nytt arrangement'} onClose={() => setOpen(false)}>
          <FormRow label="Dato"><TFInput value={form.date} onChange={(v) => {
            if (v) {
              const d = new Date(v)
              setForm((p) => ({ ...p, date: v, day: String(d.getDate()).padStart(2, '0'), month: d.toLocaleString('nb-NO', { month: 'short' }).replace('.', '').replace(/^\w/, c => c.toUpperCase()) }))
            } else { setForm((p) => ({ ...p, date: '' })) }
          }} type="date" /></FormRow>
          <FormRow label="Tittel"><TFInput value={form.title} onChange={(v) => f('title', v)} placeholder="Arrangementsnavn" /></FormRow>
          <FormRow label="Sted"><TFInput value={form.location} onChange={(v) => f('location', v)} placeholder="Klubbhuset, Lillehammer" /></FormRow>
          <FormRow label="Tid"><TFInput value={form.time} onChange={(v) => f('time', v)} placeholder="10:00–14:00" /></FormRow>
          <FormRow label="Merknad"><TFInput value={form.note} onChange={(v) => f('note', v)} placeholder="Valgfritt…" /></FormRow>
          <FormRow label="Type"><TFSelect value={form.tag} onChange={(v) => f('tag', v)} options={EVENT_TAGS} /></FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><TFBtn onClick={() => setOpen(false)}>Avbryt</TFBtn><TFBtn variant="primary" onClick={save}>{editId ? 'Lagre' : 'Legg til'}</TFBtn></div>
        </Modal>
      )}
      {confirmId && <ConfirmDialog message="Vil du slette dette arrangementet?" onConfirm={() => remove(confirmId)} onCancel={() => setConfirmId(null)} />}
    </div>
  )
}

// ─── Catches / Toppliste ──────────────────────────────────────────────────────
const SPECIES_LIST = ['Ørret', 'Regnbueørret', 'Brunørret', 'Sjøørret', 'Harr', 'Laks', 'Sjølaks', 'Abbor', 'Gjedde', 'Røye', 'Sik', 'Mort', 'Brasme', 'Karpe', 'Ål', 'Lake', 'Laue', 'Flire', 'Vederbuk', 'Annet']
const METHOD_LIST = ['Flue', 'Sluk', 'Mark', 'Wobbler', 'Isfiske', 'Pilk', 'Stikk', 'Fluefiske tørr', 'Fluefiske våt', 'Annet']
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
          {allSpecies.map((s) => <button key={s} onClick={() => setFilterSpecies(s)} style={{ padding: '5px 11px', borderRadius: 20, border: `1px solid ${filterSpecies === s ? CO.gold : '#ccc'}`, background: filterSpecies === s ? 'rgba(200,146,42,.15)' : 'transparent', color: filterSpecies === s ? CO.gold : CO.muted, fontWeight: filterSpecies === s ? 600 : 400, fontSize: 12, cursor: 'pointer' }}>{s}</button>)}
        </div>
        <TFSelect value={sortBy} onChange={setSortBy} options={[{ value: 'weight', label: 'Tyngst fisk' }, { value: 'length', label: 'Lengste fisk' }]} />
      </div>
      {sorted.length > 0 && (
        <div className="tf-podium" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {sorted.slice(0, 3).map((c, i) => (
            <div key={c.id} style={{ background: i === 0 ? CO.forest : CO.white, border: `2px solid ${i === 0 ? CO.gold : CO.creamDk}`, borderRadius: 10, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 3 }}>{MEDALS[i]}</div>
              <p style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1rem', color: i === 0 ? CO.gold : CO.forest, marginBottom: 2 }}>{c.angler}</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: i === 0 ? CO.cream : CO.text }}>{c.weight} kg</p>
              <p style={{ fontSize: 12, color: i === 0 ? CO.mist : CO.muted }}>{c.length} cm · {c.species}</p>
              {kFactor(c.weight, c.length) && <p style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? CO.goldLt : CO.gold, marginTop: 2 }}>K = {kFactor(c.weight, c.length)}</p>}
              <p style={{ fontSize: 11, color: i === 0 ? CO.mist : CO.muted, opacity: .7, marginTop: 2 }}>{c.water}</p>
            </div>
          ))}
        </div>
      )}
      <div className="tf-card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 500 }}>
          <thead><tr style={{ background: CO.forest }}>{['#', 'Fisker', 'Art', 'Vekt', 'Lengde', 'K-faktor', 'Vann', 'Metode', 'Dato', ''].map((h) => <th key={h} style={{ padding: '9px 11px', textAlign: 'left', color: CO.mist, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
          <tbody>
            {sorted.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${CO.creamDk}`, background: i % 2 === 0 ? CO.white : '#faf7f2' }}>
                <td style={{ padding: '9px 11px', fontWeight: 700, color: i < 3 ? CO.gold : CO.muted }}>{MEDALS[i] || i + 1}</td>
                <td style={{ padding: '9px 11px', fontWeight: 600, color: CO.forest, whiteSpace: 'nowrap' }}>{c.angler}</td>
                <td style={{ padding: '9px 11px' }}>{c.species}</td>
                <td style={{ padding: '9px 11px', fontWeight: 700, color: CO.forest }}>{c.weight} kg</td>
                <td style={{ padding: '9px 11px' }}>{c.length} cm</td>
                <td style={{ padding: '9px 11px', whiteSpace: 'nowrap' }}>
                  {(() => {
                    const k = kFactor(c.weight, c.length)
                    if (!k) return <span style={{color:CO.muted}}>—</span>
                    const kv = parseFloat(k)
                    const col = kv >= 1.4 ? '#2d7a2d' : kv >= 1.1 ? '#b87d00' : kv >= 0.8 ? '#c07000' : '#c0392b'
                    return <span style={{ fontWeight: 700, color: col }}>{k}</span>
                  })()}
                </td>
                <td style={{ padding: '9px 11px', color: CO.muted, whiteSpace: 'nowrap' }}>{c.water}</td>
                <td style={{ padding: '9px 11px', color: CO.muted }}>{c.method}</td>
                <td style={{ padding: '9px 11px', color: CO.muted, whiteSpace: 'nowrap' }}>{formatDate(c.date)}</td>
                <td style={{ padding: '9px 11px' }}><div style={{ display: 'flex', gap: 5 }}><TFBtn small onClick={() => openEdit(c)}>✏</TFBtn><TFBtn small variant="danger" onClick={() => setConfirmId(c.id)}>🗑</TFBtn></div></td>
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
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><TFBtn onClick={() => setOpen(false)}>Avbryt</TFBtn><TFBtn variant="primary" onClick={save}>{editId ? 'Lagre' : 'Registrer'}</TFBtn></div>
        </Modal>
      )}
      {confirmId && <ConfirmDialog message="Vil du slette denne fangsten?" onConfirm={() => remove(confirmId)} onCancel={() => setConfirmId(null)} />}
    </div>
  )
}

// ─── Merch ────────────────────────────────────────────────────────────────────
function MerchPage({ merch, setMerch, showToast }) {
  const empty = { name: '', desc: '', price: '', photo: '' }
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(empty)
  const [confirmId, setConfirmId] = useState(null)
  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }))
  const openNew = () => { setEditId(null); setForm(empty); setOpen(true) }
  const openEdit = (item) => { setEditId(item.id); setForm({ ...item }); setOpen(true) }
  const save = () => {
    if (!form.name.trim()) return
    const updated = editId ? merch.map((m) => m.id === editId ? { ...form, id: editId } : m) : [...merch, { ...form, id: nextId(merch) }]
    setMerch(updated); setOpen(false); showToast(editId ? 'Produkt oppdatert' : 'Produkt lagt til')
  }
  const remove = (id) => { setMerch(merch.filter((m) => m.id !== id)); setConfirmId(null); showToast('Produkt slettet') }
  return (
    <div className="tf-wrap">
      <div className="tf-ph">
        <div><p className="tf-label">Klubbens butikk</p><h2 className="tf-title">T&F Merch</h2></div>
        <TFBtn variant="primary" onClick={openNew}>+ Nytt produkt</TFBtn>
      </div>
      {merch.length === 0 && <div style={{ textAlign: 'center', padding: '4rem 2rem', color: CO.muted }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧢</div>
        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.2rem', color: CO.forest, marginBottom: '.5rem' }}>Ingen produkter ennå</p>
        <p style={{ fontSize: 14 }}>Klikk «+ Nytt produkt» for å legge til caps, jakker, fluebokser og annet.</p>
      </div>}
      <div className="tf-grid">
        {merch.map((item) => (
          <div key={item.id} className="tf-card">
            {item.photo
              ? <img src={photoSrc(item.photo)} alt={item.name} style={{ width: '100%', height: 200, objectFit: 'cover', objectPosition: `${photoX(item.photo)}% ${photoY(item.photo)}%` }} />
              : <div style={{ height: 160, background: `linear-gradient(135deg,${CO.forest},${CO.river})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🧢</div>
            }
            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <p style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, color: CO.forest, fontSize: '1rem', lineHeight: 1.2 }}>{item.name}</p>
                {item.price && <span style={{ background: CO.gold, color: CO.deep, fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 5, whiteSpace: 'nowrap', marginLeft: 8 }}>{item.price}</span>}
              </div>
              {item.desc && <p style={{ fontSize: 13, color: CO.muted, lineHeight: 1.6, marginBottom: 10 }}>{item.desc}</p>}
              <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                <TFBtn small onClick={() => openEdit(item)}>✏ Rediger</TFBtn>
                <TFBtn small variant="danger" onClick={() => setConfirmId(item.id)}>🗑 Slett</TFBtn>
              </div>
            </div>
          </div>
        ))}
      </div>
      {open && (
        <Modal title={editId ? 'Rediger produkt' : 'Nytt produkt'} onClose={() => setOpen(false)}>
          <FormRow label="Produktbilde">
            <PhotoUpload photo={form.photo} onPhoto={(v) => f('photo', v)} onClear={() => f('photo', '')} label="Last opp produktbilde" />
            {photoSrc(form.photo) && <button onClick={() => f('photo', '')} style={{ fontSize: 12, color: '#c0392b', marginTop: 6, textDecoration: 'underline', cursor: 'pointer', display: 'block' }}>Fjern bilde</button>}
          </FormRow>
          <FormRow label="Produktnavn"><TFInput value={form.name} onChange={(v) => f('name', v)} placeholder="T&F Caps" /></FormRow>
          <FormRow label="Beskrivelse"><TFInput value={form.desc} onChange={(v) => f('desc', v)} placeholder="Kvalitetscaps med klubblogo, en størrelse…" multiline /></FormRow>
          <FormRow label="Pris (valgfri)"><TFInput value={form.price} onChange={(v) => f('price', v)} placeholder="kr 249" /></FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><TFBtn onClick={() => setOpen(false)}>Avbryt</TFBtn><TFBtn variant="primary" onClick={save}>{editId ? 'Lagre' : 'Legg til'}</TFBtn></div>
        </Modal>
      )}
      {confirmId && <ConfirmDialog message="Vil du slette dette produktet?" onConfirm={() => remove(confirmId)} onCancel={() => setConfirmId(null)} />}
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
  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }))
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
        <div><p className="tf-label">Klubbens folk</p><h2 className="tf-title">Medlemmer & styre</h2><p style={{ fontSize: 13, color: CO.muted, marginTop: 3 }}>{members.length} registrerte medlemmer</p></div>
        <TFBtn variant="primary" onClick={openNew}>+ Nytt medlem</TFBtn>
      </div>
      <div className="tf-grid-sm">
        {members.map((m) => (
          <div key={m.id} className="tf-card" style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '.65rem' }}><MemberAvatar name={m.name} photo={m.photo} size={56} /></div>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '.88rem', fontWeight: 700, color: CO.forest, marginBottom: 2 }}>{m.name}</p>
            <p style={{ fontSize: 11, color: CO.muted, marginBottom: m.badge ? 5 : 10 }}>{m.role}</p>
            {m.badge && <span className="tf-badge tf-badge-gold" style={{ marginBottom: 8, display: 'inline-flex' }}>{m.badge}</span>}
            <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginTop: 4 }}><TFBtn small onClick={() => openEdit(m)}>✏</TFBtn><TFBtn small variant="danger" onClick={() => setConfirmId(m.id)}>🗑</TFBtn></div>
          </div>
        ))}
      </div>
      {open && (
        <Modal title={editId ? 'Rediger medlem' : 'Nytt medlem'} onClose={() => setOpen(false)}>
          <FormRow label="Profilbilde"><PhotoUpload photo={form.photo} onPhoto={(v) => f('photo', v)} onClear={() => f('photo', '')} circle label="Last opp" /></FormRow>
          <FormRow label="Fullt navn"><TFInput value={form.name} onChange={(v) => f('name', v)} placeholder="Ola Nordmann" /></FormRow>
          <FormRow label="Rolle / tittel"><TFInput value={form.role} onChange={(v) => f('role', v)} placeholder="Medlem siden 2025" /></FormRow>
          <FormRow label="Badge (valgfri)"><TFSelect value={form.badge} onChange={(v) => f('badge', v)} options={MEMBER_BADGES.map((b) => ({ value: b, label: b || '— ingen badge —' }))} /></FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><TFBtn onClick={() => setOpen(false)}>Avbryt</TFBtn><TFBtn variant="primary" onClick={save}>{editId ? 'Lagre' : 'Legg til'}</TFBtn></div>
        </Modal>
      )}
      {confirmId && <ConfirmDialog message={`Vil du fjerne ${members.find((m) => m.id === confirmId)?.name}?`} onConfirm={() => remove(confirmId)} onCancel={() => setConfirmId(null)} />}
    </div>
  )
}

// ─── Waters ───────────────────────────────────────────────────────────────────
function WatersPage({ waters, setWaters, showToast }) {
  const empty = { name: '', location: '', desc: '', tags: [], mapUrl: '' }
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState(null); const [form, setForm] = useState(empty); const [tagInput, setTagInput] = useState(''); const [confirmId, setConfirmId] = useState(null)
  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }))
  const addTag = () => { const t = tagInput.trim(); if (t && !form.tags.includes(t)) setForm((p) => ({ ...p, tags: [...p.tags, t] })); setTagInput('') }
  const openNew = () => { setEditId(null); setForm(empty); setTagInput(''); setOpen(true) }
  const openEdit = (w) => { setEditId(w.id); setForm({ ...w, tags: [...w.tags], mapUrl: w.mapUrl || '' }); setTagInput(''); setOpen(true) }
  const save = () => {
    if (!form.name.trim()) return
    const updated = editId ? waters.map((w) => w.id === editId ? { ...form, id: editId } : w) : [...waters, { ...form, id: nextId(waters) }]
    setWaters(updated); setOpen(false); showToast(editId ? 'Fiskevann oppdatert' : 'Fiskevann lagt til')
  }
  const remove = (id) => { setWaters(waters.filter((w) => w.id !== id)); setConfirmId(null); showToast('Fiskevann fjernet') }
  return (
    <div className="tf-wrap">
      <div className="tf-ph"><div><p className="tf-label">Fiskerettigheter</p><h2 className="tf-title">Klubbens fiskevann</h2></div><TFBtn variant="primary" onClick={openNew}>+ Nytt vann</TFBtn></div>
      <div className="tf-grid">
        {waters.map((w) => (
          <div key={w.id} style={{ background: CO.forest, borderRadius: 10, padding: '1.4rem' }}>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.1rem', fontWeight: 700, color: CO.gold, marginBottom: 3 }}>{w.name}</p>
            <p style={{ fontSize: 12, color: CO.mist, marginBottom: 8, opacity: .8 }}>📍 {w.location}</p>
            <p style={{ fontSize: 13, color: CO.cream, lineHeight: 1.6, marginBottom: 10, opacity: .85 }}>{w.desc}</p>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>{w.tags.map((t) => <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, border: `1px solid rgba(200,146,42,.35)`, color: CO.goldLt }}>{t}</span>)}</div>
            {w.mapUrl && (
              <a href={w.mapUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: CO.goldLt, marginBottom: 10, textDecoration: 'none', border: `1px solid rgba(200,146,42,.3)`, borderRadius: 5, padding: '3px 9px', background: 'rgba(200,146,42,.08)' }}>
                🗺 Vis på Google Maps
              </a>
            )}
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
          <FormRow label="Tags"><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>{form.tags.map((t) => <TagPill key={t} label={t} onRemove={() => f('tags', form.tags.filter((x) => x !== t))} />)}</div><div style={{ display: 'flex', gap: 6 }}><TFInput value={tagInput} onChange={setTagInput} placeholder="Ørret, Flue…" style={{ flex: 1 }} /><TFBtn variant="forest" onClick={addTag}>+</TFBtn></div></FormRow>
          <FormRow label="Google Maps-lenke (valgfri)"><TFInput value={form.mapUrl || ''} onChange={(v) => f('mapUrl', v)} placeholder="https://maps.google.com/?q=Steinelva+Gausdal" /></FormRow>
          <p style={{ fontSize: 11, color: CO.muted, marginTop: -8, marginBottom: 12 }}>Tips: søk opp stedet på maps.google.com, kopier URL-en fra adressefeltet</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><TFBtn onClick={() => setOpen(false)}>Avbryt</TFBtn><TFBtn variant="primary" onClick={save}>{editId ? 'Lagre' : 'Legg til'}</TFBtn></div>
        </Modal>
      )}
      {confirmId && <ConfirmDialog message="Vil du fjerne dette fiskevannet?" onConfirm={() => remove(confirmId)} onCancel={() => setConfirmId(null)} />}
    </div>
  )
}

// ─── Rules ────────────────────────────────────────────────────────────────────
function RulesPage({ rules, setRules, showToast }) {
  const [editingId, setEditingId] = useState(null); const [editTitle, setEditTitle] = useState(''); const [editItems, setEditItems] = useState([]); const [newItemText, setNewItemText] = useState(''); const [confirmId, setConfirmId] = useState(null)
  const startEdit = (r) => { setEditingId(r.id); setEditTitle(r.title); setEditItems([...r.items]); setNewItemText('') }
  const saveEdit = () => { setRules(rules.map((r) => r.id === editingId ? { ...r, title: editTitle, items: editItems } : r)); setEditingId(null); showToast('Regler oppdatert') }
  const removeBlock = (id) => { setRules(rules.filter((r) => r.id !== id)); setConfirmId(null); showToast('Regelblokk slettet') }
  const addBlock = () => { setRules([...rules, { id: nextId(rules), icon: '📋', title: 'Ny regelblokk', items: ['Regel 1'] }]); showToast('Regelblokk lagt til') }
  return (
    <div className="tf-wrap">
      <div className="tf-ph"><div><p className="tf-label">Vedtekter & etikk</p><h2 className="tf-title">Regler og retningslinjer</h2></div><TFBtn variant="primary" onClick={addBlock}>+ Ny regelblokk</TFBtn></div>
      <div className="tf-grid">
        {rules.map((r) => (
          <div key={r.id} className="tf-card" style={{ padding: '1.4rem', borderLeft: `4px solid ${CO.gold}`, borderRadius: '0 10px 10px 0' }}>
            {editingId === r.id ? (
              <>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="tf-input" style={{ fontWeight: 700, marginBottom: 10 }} />
                {editItems.map((item, i) => <div key={i} style={{ display: 'flex', gap: 5, marginBottom: 5 }}><input value={item} onChange={(e) => setEditItems((it) => it.map((x, j) => j === i ? e.target.value : x))} className="tf-input" style={{ flex: 1, fontSize: 13 }} /><button onClick={() => setEditItems((it) => it.filter((_, j) => j !== i))} style={{ color: '#c0392b', fontSize: 18, padding: '0 4px', lineHeight: 1 }}>×</button></div>)}
                <div style={{ display: 'flex', gap: 6, margin: '8px 0 12px' }}><TFInput value={newItemText} onChange={setNewItemText} placeholder="Ny regel…" style={{ flex: 1 }} /><TFBtn variant="forest" onClick={() => { if (newItemText.trim()) { setEditItems((i) => [...i, newItemText.trim()]); setNewItemText('') } }}>+</TFBtn></div>
                <div style={{ display: 'flex', gap: 6 }}><TFBtn small variant="primary" onClick={saveEdit}>Lagre</TFBtn><TFBtn small onClick={() => setEditingId(null)}>Avbryt</TFBtn></div>
              </>
            ) : (
              <>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1rem', fontWeight: 700, color: CO.forest, marginBottom: 10 }}>{r.icon} {r.title}</h3>
                <ul style={{ paddingLeft: '1.1rem' }}>{r.items.map((item, i) => <li key={i} style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 2 }}>{item}</li>)}</ul>
                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}><TFBtn small onClick={() => startEdit(r)}>✏ Rediger</TFBtn><TFBtn small variant="danger" onClick={() => setConfirmId(r.id)}>🗑</TFBtn></div>
              </>
            )}
          </div>
        ))}
      </div>
      {confirmId && <ConfirmDialog message="Vil du slette denne regelblokken?" onConfirm={() => removeBlock(confirmId)} onCancel={() => setConfirmId(null)} />}
    </div>
  )
}

// ─── FISHING GAME — Feeding Frenzy ──────────────────────────────────────────
const LEVELS_CFG = [
  { num: 1, fishOnScreen: 14, bigRatio: 0.15, hazards: [],                          speedMult: 1.0, eatTarget: 8,  desc: 'Spis de minste fiskene!' },
  { num: 2, fishOnScreen: 15, bigRatio: 0.20, hazards: [],                          speedMult: 1.4, eatTarget: 10, desc: 'Raskere og større fisk!' },
  { num: 3, fishOnScreen: 16, bigRatio: 0.25, hazards: ['hook'],                    speedMult: 1.7, eatTarget: 12, desc: 'Pass deg for sluk! 🪝' },
  { num: 4, fishOnScreen: 17, bigRatio: 0.30, hazards: ['hook','hook'],             speedMult: 2.0, eatTarget: 14, desc: 'Mange store fisk nå!' },
  { num: 5, fishOnScreen: 18, bigRatio: 0.35, hazards: ['hook','net'],              speedMult: 2.3, eatTarget: 16, desc: 'Garn i vannet! 🕸' },
  { num: 6, fishOnScreen: 19, bigRatio: 0.40, hazards: ['hook','hook','net'],       speedMult: 2.6, eatTarget: 18, desc: 'Kaotisk farvann!' },
  { num: 7, fishOnScreen: 20, bigRatio: 0.45, hazards: ['hook','net','barrel'],     speedMult: 3.0, eatTarget: 20, desc: 'Gifttønner! ☠️' },
  { num: 8, fishOnScreen: 22, bigRatio: 0.50, hazards: ['hook','hook','net','barrel','barrel'], speedMult: 3.5, eatTarget: 22, desc: 'Maksimal kaos!' },
]

// Fish types — sorted small to large
const FISH_TYPES_G = [
  { r: 6,  color: '#7ec8e3', tail: '#4aaac8', pts: 2,  label: 'Småfisk',      spots: false },
  { r: 7,  color: '#a8d8a8', tail: '#6ab86a', pts: 3,  label: 'Grønnfisk',    spots: false },
  { r: 8,  color: '#c0d8f0', tail: '#80b0e0', pts: 3,  label: 'Sildefisk',    spots: false },
  { r: 10, color: '#f4a460', tail: '#d2865a', pts: 5,  label: 'Liten ørret',  spots: true  },
  { r: 12, color: '#ff9eb5', tail: '#e07090', pts: 8,  label: 'Regnbueørret', spots: true  },
  { r: 15, color: '#90ee90', tail: '#55aa55', pts: 12, label: 'Abbor',        spots: true  },
  { r: 19, color: '#e8a030', tail: '#c07020', pts: 20, label: 'Ørret',        spots: true  },
  { r: 24, color: '#708060', tail: '#506040', pts: 35, label: 'Gjedde',       spots: false },
  { r: 30, color: '#cc6644', tail: '#aa4422', pts: 60, label: 'Stor laks',    spots: false },
]

function makeFish(playerR, lvlSpeed, canvasW, canvasH, forceSmall, bigRatio = 0.2) {
  let idx
  if (forceSmall) {
    // Force small — pick from bottom 4
    idx = Math.floor(Math.random() * 4)
  } else if (Math.random() < bigRatio) {
    // Spawn a dangerous big fish (top 3)
    idx = FISH_TYPES_G.length - 1 - Math.floor(Math.random() * 3)
  } else {
    // Normal weighted toward small-medium
    const maxIdx = Math.min(Math.floor(playerR / 3.5), FISH_TYPES_G.length - 2)
    const weights = FISH_TYPES_G.slice(0, maxIdx + 1).map((_, i) => maxIdx - i + 2)
    const total = weights.reduce((a, b) => a + b, 0)
    let rand = Math.random() * total
    idx = 0
    for (let i = 0; i < weights.length; i++) { rand -= weights[i]; if (rand <= 0) { idx = i; break } }
  }
  const type = FISH_TYPES_G[idx]
  const fromLeft = Math.random() > 0.5
  // Big fish move faster
  const sizeFactor = 0.8 + (idx / FISH_TYPES_G.length) * 0.6
  return {
    ...type,
    id: Math.random() + Date.now(),
    x: fromLeft ? -type.r - 5 : canvasW + type.r + 5,
    y: type.r + 10 + Math.random() * (canvasH - type.r * 2 - 20),
    vx: (fromLeft ? 1 : -1) * (0.55 + Math.random() * 0.55) * lvlSpeed * sizeFactor,
    vy: (Math.random() - 0.5) * 0.45 * lvlSpeed,
  }
}

function makeHazard(type, canvasW, canvasH, lvlSpeed) {
  if (type === 'hook') {
    return { type, id: Math.random(), x: 60 + Math.random() * (canvasW - 120), y: -30, vy: 1.0 * lvlSpeed, vx: 0 }
  } else if (type === 'net') {
    const fromLeft = Math.random() > 0.5
    return { type, id: Math.random(), x: fromLeft ? -70 : canvasW + 70, y: 40 + Math.random() * (canvasH - 120), vx: (fromLeft ? 1 : -1) * 0.7 * lvlSpeed, vy: 0, w: 55, h: 75 }
  } else {
    return { type, id: Math.random(), x: 40 + Math.random() * (canvasW - 80), y: -35, vy: 1.2 * lvlSpeed, vx: (Math.random() - 0.5) * lvlSpeed, r: 20 }
  }
}

function drawFishShape(ctx, x, y, r, color, tail, facingLeft, spots, danger) {
  ctx.save()
  ctx.translate(x, y)
  if (facingLeft) ctx.scale(-1, 1)
  // Body
  ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.62, 0, 0, Math.PI * 2)
  ctx.fillStyle = color; ctx.fill()
  // Tail
  ctx.beginPath(); ctx.moveTo(-r * 0.75, 0); ctx.lineTo(-r * 1.45, -r * 0.55); ctx.lineTo(-r * 1.45, r * 0.55); ctx.closePath()
  ctx.fillStyle = tail; ctx.fill()
  // Dorsal fin
  ctx.beginPath(); ctx.moveTo(-r * 0.05, -r * 0.62); ctx.lineTo(r * 0.3, -r * 1.05); ctx.lineTo(r * 0.62, -r * 0.62); ctx.closePath()
  ctx.fillStyle = tail; ctx.fill()
  // Spots
  if (spots) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.arc((i - 1.5) * r * 0.32, (i % 2 === 0 ? -1 : 1) * r * 0.14, r * 0.09, 0, Math.PI * 2); ctx.fill()
    }
  }
  // Eye
  ctx.beginPath(); ctx.arc(r * 0.48, -r * 0.1, Math.max(1.5, r * 0.14), 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill()
  ctx.beginPath(); ctx.arc(r * 0.5, -r * 0.1, Math.max(0.8, r * 0.075), 0, Math.PI * 2); ctx.fillStyle = '#111'; ctx.fill()
  // Danger outline only — dashed, no bubble
  if (danger) {
    ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(255,70,70,0.8)'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.ellipse(0, 0, r + 3, r * 0.62 + 3, 0, 0, Math.PI * 2); ctx.stroke()
    ctx.setLineDash([])
  }
  ctx.restore()
}

function FishingGame() {
  const canvasRef = useRef(null)
  const gsRef = useRef(null)   // mutable game state — never triggers re-render
  const rafRef = useRef(null)
  const [ui, setUi] = useState({ phase: 'idle', score: 0, level: 1, lives: 3, eaten: 0, target: 8, hs: parseInt(localStorage.getItem('tf_hs3')||'0') })

  const CW = 700, CH = 420

  function buildLevel(lvlIdx, score, lives) {
    const cfg = LEVELS_CFG[Math.min(lvlIdx, LEVELS_CFG.length - 1)]
    const playerR = 10 + lvlIdx * 2.5
    const gs = {
      phase: 'playing', lvlIdx, score, lives,
      eaten: 0, target: cfg.eatTarget,
      player: { x: CW / 2, y: CH / 2, vx: 0, vy: 0, r: playerR, facingLeft: false },
      fish: [], hazards: [], keys: {}, frame: 0,
      flash: '', flashT: 0, cfg,
    }
    // Start with full screen of fish — 70% forced small
    for (let i = 0; i < cfg.fishOnScreen; i++) {
      gs.fish.push(makeFish(playerR, cfg.speedMult, CW, CH, i < Math.floor(cfg.fishOnScreen * 0.6), cfg.bigRatio))
    }
    // Hazards
    cfg.hazards.forEach(h => gs.hazards.push(makeHazard(h, CW, CH, cfg.speedMult)))
    return gs
  }

  function tick() {
    const gs = gsRef.current
    if (!gs || gs.phase !== 'playing') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { cfg } = gs
    gs.frame++

    // ── Player movement ──────────────────────────────────────────────────────
    const SPD = 3.8
    const { keys, player: p } = gs
    const touch = touchTargetRef.current

    if (touch) {
      // Touch-follow mode: smoothly chase finger position
      const dx = touch.x - p.x
      const dy = touch.y - p.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 4) {
        const speed = Math.min(SPD * 1.2, dist * 0.18)
        p.vx = (dx / dist) * speed
        p.vy = (dy / dist) * speed
        p.facingLeft = dx < 0
      } else {
        p.vx *= 0.7; p.vy *= 0.7
      }
    } else {
      // Keyboard mode
      if (keys['ArrowLeft']  || keys['a']) { p.vx = Math.max(p.vx - 0.9, -SPD); p.facingLeft = true  }
      else if (keys['ArrowRight'] || keys['d']) { p.vx = Math.min(p.vx + 0.9,  SPD); p.facingLeft = false }
      else p.vx *= 0.82
      if (keys['ArrowUp']    || keys['w']) p.vy = Math.max(p.vy - 0.9, -SPD)
      else if (keys['ArrowDown']  || keys['s']) p.vy = Math.min(p.vy + 0.9,  SPD)
      else p.vy *= 0.82
    }
    p.x = Math.max(p.r, Math.min(CW - p.r, p.x + p.vx))
    p.y = Math.max(p.r, Math.min(CH - p.r, p.y + p.vy))

    // ── Move fish + wrap/respawn when off-screen ──────────────────────────────
    gs.fish.forEach(f => {
      f.x += f.vx; f.y += f.vy
      // Bounce vertically
      if (f.y - f.r < 5)       { f.y = f.r + 5;       f.vy = Math.abs(f.vy) }
      if (f.y + f.r > CH - 5)  { f.y = CH - f.r - 5;  f.vy = -Math.abs(f.vy) }
      // If gone off left/right — respawn from opposite side
      if (f.x < -f.r * 3 || f.x > CW + f.r * 3) {
        const fromLeft = f.x > CW / 2
        const type = Math.random() < cfg.bigRatio ? FISH_TYPES_G[FISH_TYPES_G.length - 1 - Math.floor(Math.random() * 3)] : FISH_TYPES_G[Math.floor(Math.random() * Math.min(5, FISH_TYPES_G.length))]
        Object.assign(f, type, {
          x: fromLeft ? -type.r - 5 : CW + type.r + 5,
          y: type.r + 10 + Math.random() * (CH - type.r * 2 - 20),
          vx: (fromLeft ? 1 : -1) * (0.6 + Math.random() * 0.5) * cfg.speedMult,
          vy: (Math.random() - 0.5) * 0.4 * cfg.speedMult,
          id: Math.random(),
        })
      }
    })

    // ── Maintain fish count — always keep fishOnScreen fish alive ─────────────
    while (gs.fish.length < cfg.fishOnScreen) {
      gs.fish.push(makeFish(p.r, cfg.speedMult, CW, CH, gs.fish.length < Math.floor(cfg.fishOnScreen * 0.55), cfg.bigRatio))
    }

    // ── Move hazards ──────────────────────────────────────────────────────────
    gs.hazards.forEach(h => {
      if (h.type === 'hook') {
        h.y += h.vy
        if (h.y > CH + 40) { h.y = -30; h.x = 60 + Math.random() * (CW - 120) }
      } else if (h.type === 'net') {
        h.x += h.vx
        if (h.x < -80 || h.x > CW + 80) h.vx *= -1
      } else {
        h.x += h.vx; h.y += h.vy
        if (h.x < h.r || h.x > CW - h.r) h.vx *= -1
        if (h.y > CH + 40) { h.y = -35; h.x = 40 + Math.random() * (CW - 80) }
      }
    })

    // ── Collisions: fish ──────────────────────────────────────────────────────
    gs.fish = gs.fish.filter(f => {
      const dx = p.x - f.x, dy = p.y - f.y
      if (Math.sqrt(dx*dx + dy*dy) < p.r + f.r - 5) {
        if (f.r < p.r) {
          gs.score += f.pts; gs.eaten++
          p.r = Math.min(p.r + 0.5, 52)
          gs.flash = `+${f.pts} ${f.label}!`; gs.flashT = 45
          return false // eaten — will be replaced by maintain-fish-count loop above
        } else {
          loseLife(gs, '💀 Spist av større fisk!')
        }
      }
      return true
    })

    // ── Collisions: hazards ───────────────────────────────────────────────────
    if (gs.phase === 'playing') {
      for (const h of gs.hazards) {
        let hit = false
        if (h.type === 'hook') {
          hit = p.x > h.x - 8 - p.r && p.x < h.x + 8 + p.r && p.y > h.y - p.r && p.y < h.y + 28 + p.r
        } else if (h.type === 'net') {
          hit = p.x > h.x - p.r && p.x < h.x + h.w + p.r && p.y > h.y - p.r && p.y < h.y + h.h + p.r
        } else {
          const dx = p.x - h.x, dy = p.y - h.y
          hit = Math.sqrt(dx*dx + dy*dy) < p.r + h.r - 2
        }
        if (hit) { loseLife(gs, '💥 Truffet!'); break }
      }
    }

    // ── Level up ──────────────────────────────────────────────────────────────
    if (gs.phase === 'playing' && gs.eaten >= gs.target) {
      const next = gs.lvlIdx + 1
      if (next >= LEVELS_CFG.length) {
        gs.phase = 'gameover'
        gs.flash = '🏆 Du klarte alle levels!'
        finishGame(gs)
      } else {
        const newGs = buildLevel(next, gs.score, Math.min(gs.lives + 1, 5))
        newGs.flash = `🎉 Level ${next + 1}! ${LEVELS_CFG[next].desc}`
        newGs.flashT = 90
        gsRef.current = newGs
        setUi(u => ({ ...u, level: next + 1, score: gs.score, lives: Math.min(gs.lives + 1, 5), eaten: 0, target: LEVELS_CFG[next].eatTarget }))
        rafRef.current = requestAnimationFrame(tick)
        return
      }
    }

    if (gs.flashT > 0) gs.flashT--

    // ── Draw ──────────────────────────────────────────────────────────────────
    drawScene(ctx, gs)

    setUi(u => ({ ...u, score: gs.score, lives: gs.lives, eaten: gs.eaten, target: gs.target, level: gs.lvlIdx + 1 }))
    rafRef.current = requestAnimationFrame(tick)
  }

  function loseLife(gs, msg) {
    gs.lives--
    gs.flash = gs.lives > 0 ? `${msg} ${gs.lives} liv igjen` : `${msg} Game over!`
    gs.flashT = 70
    gs.player.x = CW / 2; gs.player.y = CH / 2; gs.player.vx = 0; gs.player.vy = 0
    if (gs.lives <= 0) { gs.phase = 'gameover'; finishGame(gs) }
  }

  function finishGame(gs) {
    const hs = Math.max(parseInt(localStorage.getItem('tf_hs3')||'0'), gs.score)
    localStorage.setItem('tf_hs3', String(hs))
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setUi(u => ({ ...u, phase: 'gameover', score: gs.score, highScore: hs, hs }))
  }

  function drawScene(ctx, gs) {
    const { player: p, fish, hazards, flash, flashT, frame } = gs

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, CH)
    bg.addColorStop(0, '#1a4a6e'); bg.addColorStop(0.45, '#2d6a8f'); bg.addColorStop(1, '#0d2235')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, CW, CH)

    // Shimmer lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1
    for (let i = 0; i < 7; i++) { const y = 45 + i * 55; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(CW,y); ctx.stroke() }

    // Bubbles
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    for (let i = 0; i < 14; i++) {
      const bx = (i * 173 + 30) % CW
      const by = ((i * 97 + frame * (0.3 + i * 0.04)) % CH)
      ctx.beginPath(); ctx.arc(bx, by, 1.2 + (i%3)*0.6, 0, Math.PI*2); ctx.fill()
    }

    // Draw fish
    fish.forEach(f => drawFishShape(ctx, f.x, f.y, f.r, f.color, f.tail, f.vx < 0, f.spots, f.r >= p.r))

    // Draw hazards
    hazards.forEach(h => {
      ctx.save()
      if (h.type === 'hook') {
        // Fishing line
        ctx.strokeStyle = 'rgba(220,220,180,0.5)'; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(h.x, 0); ctx.lineTo(h.x, h.y); ctx.stroke()
        // Hook body
        ctx.strokeStyle = '#c8c890'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
        ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(h.x, h.y + 18)
        ctx.arc(h.x - 7, h.y + 18, 7, 0, Math.PI * 0.95, false)
        ctx.stroke()
        // Shine
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(h.x - 1, h.y + 2); ctx.lineTo(h.x - 1, h.y + 10); ctx.stroke()
      } else if (h.type === 'net') {
        ctx.strokeStyle = '#c8922a'; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.55
        for (let nx = 0; nx <= h.w; nx += 10) { ctx.beginPath(); ctx.moveTo(h.x+nx,h.y); ctx.lineTo(h.x+nx,h.y+h.h); ctx.stroke() }
        for (let ny = 0; ny <= h.h; ny += 10) { ctx.beginPath(); ctx.moveTo(h.x,h.y+ny); ctx.lineTo(h.x+h.w,h.y+ny); ctx.stroke() }
        ctx.globalAlpha = 1
        ctx.fillStyle = '#e88020'
        ;[[h.x,h.y],[h.x+h.w,h.y],[h.x,h.y+h.h],[h.x+h.w,h.y+h.h]].forEach(([fx,fy]) => {
          ctx.beginPath(); ctx.arc(fx,fy,4,0,Math.PI*2); ctx.fill()
        })
      } else {
        // Barrel
        ctx.fillStyle = '#7a3010'
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(h.x-h.r, h.y-h.r, h.r*2, h.r*2, 5); ctx.fill() }
        else { ctx.fillRect(h.x-h.r, h.y-h.r, h.r*2, h.r*2) }
        ctx.strokeStyle = '#4a1a00'; ctx.lineWidth = 2
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(h.x-h.r, h.y-h.r, h.r*2, h.r*2, 5); ctx.stroke() }
        ctx.strokeStyle = '#bbb'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(h.x-h.r+2, h.y - h.r*0.3); ctx.lineTo(h.x+h.r-2, h.y - h.r*0.3); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(h.x-h.r+2, h.y + h.r*0.3); ctx.lineTo(h.x+h.r-2, h.y + h.r*0.3); ctx.stroke()
        ctx.fillStyle = '#ff5555'; ctx.font = `bold ${h.r}px sans-serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('☠', h.x, h.y)
      }
      ctx.restore()
    })

    // Player
    drawFishShape(ctx, p.x, p.y, p.r, '#00e5ff', '#00b8cc', p.facingLeft, false, false)
    ctx.strokeStyle = 'rgba(0,229,255,0.3)'; ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5, 0, Math.PI*2); ctx.stroke()

    // Progress bar
    const prog = Math.min(gs.eaten / gs.target, 1)
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(10, 10, 170, 12)
    ctx.fillStyle = '#c8922a'; ctx.fillRect(10, 10, 170 * prog, 12)
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.strokeRect(10, 10, 170, 12)
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '11px Inter,sans-serif'
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'
    ctx.fillText(`Spist: ${gs.eaten}/${gs.target}`, 12, 26)

    // Flash message
    if (flashT > 0) {
      const alpha = Math.min(1, flashT / 15)
      ctx.save(); ctx.globalAlpha = alpha
      const isGood = !flash.includes('💀') && !flash.includes('💥')
      ctx.fillStyle = isGood ? '#ffe066' : '#ff7070'
      ctx.font = 'bold 19px Inter,sans-serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      // Text shadow
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 6
      ctx.fillText(flash, CW/2, CH/2 - 70)
      ctx.restore()
    }
  }

  function startGame() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    gsRef.current = buildLevel(0, 0, 3)
    setUi(u => ({ ...u, phase: 'playing', score: 0, level: 1, lives: 3, eaten: 0, target: LEVELS_CFG[0].eatTarget }))
    rafRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    const down = (e) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault()
      if (gsRef.current) gsRef.current.keys[e.key] = true
    }
    const up = (e) => { if (gsRef.current) gsRef.current.keys[e.key] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const holdKey = (key) => { if (gsRef.current) gsRef.current.keys[key] = true }
  const releaseKey = (key) => { if (gsRef.current) gsRef.current.keys[key] = false }

  // Touch-follow: finger position drives player directly on mobile
  const touchTargetRef = useRef(null) // { x, y } in canvas coords

  const canvasToGame = (clientX, clientY) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((clientX - rect.left) / rect.width)  * CW,
      y: ((clientY - rect.top)  / rect.height) * CH,
    }
  }

  const onCanvasTouch = (e) => {
    e.preventDefault()
    const t = e.touches[0]
    if (t) touchTargetRef.current = canvasToGame(t.clientX, t.clientY)
  }
  const onCanvasTouchEnd = () => { touchTargetRef.current = null }

  return (
    <div className="tf-wrap">
      <div className="tf-ph">
        <div><p className="tf-label">Klubbens arkadeseksjon</p><h2 className="tf-title">🎮 Fiskespill</h2></div>
        <span style={{ fontSize: 13, color: CO.muted }}>🏆 Rekord: <b style={{ color: CO.gold }}>{ui.hs}</b></span>
      </div>

      {ui.phase === 'idle' && (
        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🐟</div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', color: CO.forest, marginBottom: '.75rem' }}>Feeding Frenzy</h3>
          <p style={{ color: CO.muted, maxWidth: 440, margin: '0 auto 1rem', fontSize: 14, lineHeight: 1.65 }}>
            Styr den <b style={{color:CO.river}}>blå fisken</b> med <b>piltastene</b> / <b>WASD</b> på PC.<br/>
            På mobil: <b>hold fingeren</b> på skjermen og dra — fisken følger etter!<br/>
            Spis fisker som er <b>mindre</b> enn deg og voks. <span style={{color:'#c0392b'}}>Rød stiplet kant = farlig!</span><br/>
            Unngå sluk 🪝, garn 🕸 og gifttønner ☠️
          </p>
          <div style={{ display: 'flex', gap: '.4rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {LEVELS_CFG.map((l, i) => <span key={i} style={{ fontSize: 11, background: CO.creamDk, padding: '3px 10px', borderRadius: 20, color: CO.muted }}>L{l.num}: {l.desc}</span>)}
          </div>
          <TFBtn variant="primary" onClick={startGame} style={{ fontSize: 16, padding: '12px 32px' }}>▶ Start spillet</TFBtn>
        </div>
      )}

      {(ui.phase === 'playing' || ui.phase === 'gameover') && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: CO.forest, fontSize: 14 }}>Level {ui.level} / {LEVELS_CFG.length}</span>
            <span style={{ fontSize: 14, color: CO.forest }}>Score: <b style={{ color: CO.gold }}>{ui.score}</b></span>
            <span style={{ fontSize: 22, letterSpacing: 2 }}>{'❤️'.repeat(Math.max(0,ui.lives))}{'🖤'.repeat(Math.max(0,3-ui.lives))}</span>
          </div>

          <canvas ref={canvasRef} width={CW} height={CH}
            onTouchStart={onCanvasTouch}
            onTouchMove={onCanvasTouch}
            onTouchEnd={onCanvasTouchEnd}
            onTouchCancel={onCanvasTouchEnd}
            style={{ width: '100%', borderRadius: 12, display: 'block', touchAction: 'none' }} />
          <p style={{ textAlign: 'center', fontSize: 12, color: CO.muted, marginTop: 6 }}>
            📱 <b>Mobil:</b> Hold fingeren på skjermen og dra fisken &nbsp;·&nbsp; 🖥 <b>PC:</b> Piltaster / WASD
          </p>

          {ui.phase === 'gameover' && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem', background: CO.forest, borderRadius: 12, padding: '2rem' }}>
              <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', color: CO.gold, marginBottom: '.5rem' }}>Game Over!</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: CO.cream, marginBottom: '.25rem' }}>{ui.score} poeng</p>
              {ui.score > 0 && ui.score >= (ui.hs || 0) && <p style={{ color: CO.gold, fontSize: 14, marginBottom: '1rem' }}>🏆 Ny personrekord!</p>}
              <TFBtn variant="primary" onClick={startGame} style={{ fontSize: 15, padding: '10px 28px' }}>▶ Spill igjen</TFBtn>
            </div>
          )}
        </>
      )}
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
  const [merch, setMerch] = useState(SEED.merch)

  useEffect(() => {
    const KEYS = ['news', 'events', 'members', 'waters', 'rules', 'catches', 'merch']
    const setters = { news: setNews, events: setEvents, members: setMembers, waters: setWaters, rules: setRules, catches: setCatches, merch: setMerch }
    Promise.all(KEYS.map((k) => fbGet(k))).then((results) => {
      KEYS.forEach((k, i) => {
        if (results[i] !== null) {
          // Key exists in Firebase (even if empty array) — always use Firebase data, never overwrite
          setters[k](results[i])
        } else {
          // Key has NEVER existed in Firebase — seed it once
          fbSet(k, SEED[k])
        }
      })
    })
    const unsubs = KEYS.map((k) => fbListen(k, (data) => setters[k](data)))
    return () => unsubs.forEach((u) => u())
  }, [])

  const makeSetter = (setter, key) => (val) => {
    setter((prev) => { const v = typeof val === 'function' ? val(prev) : val; fbSet(key, v); return v })
  }

  const setNewsP = makeSetter(setNews, 'news')
  const setEventsP = makeSetter(setEvents, 'events')
  const setMembersP = makeSetter(setMembers, 'members')
  const setWatersP = makeSetter(setWaters, 'waters')
  const setRulesP = makeSetter(setRules, 'rules')
  const setCatchesP = makeSetter(setCatches, 'catches')
  const setMerchP = makeSetter(setMerch, 'merch')

  const showToast = (msg) => { setToastMsg(msg); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToastMsg(null), 2500) }

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
      {page === 'merch' && <MerchPage merch={merch} setMerch={setMerchP} showToast={showToast} />}
      {page === 'regler' && <RulesPage rules={rules} setRules={setRulesP} showToast={showToast} />}
      {page === 'medlemmer' && <MembersPage members={members} setMembers={setMembersP} showToast={showToast} />}
      {page === 'spill' && <FishingGame />}
      <footer style={{ background: CO.deep, color: 'rgba(245,240,232,.5)', padding: '2rem 1rem', textAlign: 'center', borderTop: `1px solid rgba(200,146,42,.2)` }}>
        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '1rem', color: CO.cream, marginBottom: 5 }}>Tordivelen <span style={{ color: CO.gold }}>&</span> Flugua</p>
        <p style={{ fontSize: 12, lineHeight: 1.8 }}>Fiskeklubb stiftet 1987 · Lillehammer, Innlandet<br />Kontakt: erikhaugen@tf-fiskeklubb.no</p>
      </footer>
      {toastMsg && <Toast message={toastMsg} />}
    </div>
  )
}
