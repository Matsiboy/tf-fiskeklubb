const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')

const source = fs.readFileSync('src/App.jsx', 'utf8')

test('all existing club sections remain connected to navigation and rendering', () => {
  const nav = source.match(/const NAV_ITEMS = \[([\s\S]*?)\]\nfunction SiteNav/)
  assert.ok(nav, 'The navigation registry should remain in App.jsx')
  const expected = ['hjem', 'nyheter', 'arrangement', 'fiskevann', 'toppliste', 'merch', 'regler', 'sitater', 'priser', 'medlemmer', 'musikk', 'spill']
  const actual = [...nav[1].matchAll(/\{ id: '([^']+)'/g)].map(match => match[1])
  assert.deepEqual(actual, expected)
  for (const page of expected) assert.ok(source.includes(`page === '${page}'`), `Missing renderer for ${page}`)
  for (const name of ['BackupPanel', 'PhotoUpload', 'MusicPage', 'FishingGame', 'KFactorCalc']) {
    assert.ok(source.includes(`function ${name}(`), `Missing feature: ${name}`)
  }
})

test('the T&F logo remains a local asset, not Firestore content', () => {
  assert.match(source, /const CLUB_LOGO = `\$\{import\.meta\.env\.BASE_URL\}tordivelen-flugua-tf-logo\.webp`/)
  assert.ok(fs.existsSync('public/tordivelen-flugua-tf-logo.webp'))
})

test('browser music changes only report success after storage succeeds', () => {
  const marker = '  const setTracksP = (value) => {'
  const start = source.indexOf(marker)
  assert.ok(start >= 0, 'Browser persistence function was not found')
  const end = source.indexOf('\n\n  const showToast =', start)
  assert.ok(end > start)
  const functionBody = source.slice(start + marker.length, end)
  const writes = [], updates = [], errors = []
  let storageUnavailable = false
  const context = vm.createContext({
    tracks: [],
    localStorage: { setItem: (key, value) => {
      if (storageUnavailable) throw new Error('Quota exceeded')
      writes.push([key, value])
    } },
    setTracks: value => { updates.push(value); context.tracks = value },
    setStorageError: value => errors.push(value),
  })
  vm.runInContext('globalThis.saveTracks = (value) => {' + functionBody, context)
  const original = [{ id: 1, name: 'Test melody', src: 'data:audio/mp3;base64,AA==' }]
  assert.equal(context.saveTracks(original), true)
  assert.equal(writes[0][0], 'tf_tracks')
  assert.equal(JSON.parse(writes[0][1])[0].name, 'Test melody')
  assert.equal(updates.length, 1)

  storageUnavailable = true
  assert.equal(context.saveTracks([]), false)
  assert.equal(updates.length, 1, 'Unsaved changes must not be shown as saved')
  assert.match(errors[0], /Kunne ikke lagre musikken/)
})
