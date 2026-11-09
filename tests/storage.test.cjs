const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const source = fs.readFileSync('src/App.jsx', 'utf8')
const core = source.split('// STORAGE_CORE_START')[1].split('\n').slice(1).join('\n').split('// STORAGE_CORE_END')[0]

function harness(initial = {}) {
  const data = structuredClone(initial)
  const listeners = {}
  let writes = 0, deny = false, beforeCommit = null
  const snap = (key, metadata = {}) => ({ exists: () => Object.hasOwn(data, key), data: () => structuredClone(data[key]), metadata })
  const context = vm.createContext({
    TextEncoder, console,
    db: { app: { options: { projectId: 'test-only' } } }, auth: { currentUser: null },
    doc: (_db, _collection, key) => key,
    getDocFromServer: async key => { if (deny) throw new Error('permission-denied'); return snap(key) },
    onSnapshot: (key, options, cb, error) => { assert.equal(options.includeMetadataChanges, true); listeners[key] = { cb, error }; return () => delete listeners[key] },
    runTransaction: async (_db, action) => {
      if (deny) throw new Error('unavailable')
      // A mock server with atomic commit and a deliberate contention/retry hook.
      for (let attempt = 0; attempt < 2; attempt++) {
        const pending = []
        const result = await action({
          get: async key => { assert.equal(pending.length, 0, 'all reads precede writes'); return snap(key) },
          set: (key, value, options) => { assert.equal(options.merge, true); pending.push([key, value]) },
        })
        if (beforeCommit) { const hook = beforeCommit; beforeCommit = null; hook(data); continue }
        for (const [key, value] of pending) { data[key] = { ...data[key], ...structuredClone(value) }; writes++ }
        return result
      }
    },
  })
  vm.runInContext(core + '\nglobalThis.api = { DATA_KEYS, fbGet, fbSet, fbListen, readBackup, restoreBackup, validateBackup, validateItems, requireBackupAdmin };', context)
  return { ...context.api, data, context, listeners, snap, writes: () => writes, deny: () => { deny = true }, retry: hook => { beforeCommit = hook } }
}
const row = title => ({ id: 1, title })
const backup = (h, documents) => ({ format: 'tf-fiskeklubb', version: 1, projectId: 'test-only', exportedAt: '2026-11-09T00:00:00Z', documents })

test('missing, empty and failed reads are distinct and never seed', async () => {
  const h = harness({ news: { items: [] } })
  assert.equal((await h.fbGet('news')).exists, true)
  assert.equal((await h.fbGet('events')).exists, false)
  h.deny()
  await assert.rejects(h.fbGet('news'), /permission-denied/)
  assert.equal(h.writes(), 0)
  assert.doesNotMatch(source, /SEED|setDoc\(/)
})
test('listeners ignore cache and pending writes, deliver deletions, surface errors and unsubscribe', () => {
  const h = harness({ news: { items: [row('old')] } }); const seen = [], errors = []
  const stop = h.fbListen('news', x => seen.push(x), e => errors.push(e))
  h.listeners.news.cb(h.snap('news', { fromCache: true }))
  h.listeners.news.cb(h.snap('news', { hasPendingWrites: true }))
  assert.equal(seen.length, 0)
  h.listeners.news.cb(h.snap('news'))
  delete h.data.news
  h.listeners.news.cb(h.snap('news'))
  assert.equal(seen.length, 2); assert.equal(seen[1].exists, false)
  h.data.news = { items: 'broken' }; h.listeners.news.cb(h.snap('news'))
  h.listeners.news.error(new Error('denied'))
  assert.equal(errors.length, 2)
  stop(); assert.equal(h.listeners.news, undefined)
})
test('explicit creation and empty saves work; unrelated document metadata survives', async () => {
  const h = harness()
  await h.fbSet('news', [row('new')], [])
  h.data.news.metadata = 'preserve'
  await h.fbSet('news', [], [row('new')])
  assert.equal(h.data.news.items.length, 0); assert.equal(h.data.news.metadata, 'preserve')
})
test('stale arrays and transaction retries cannot overwrite concurrent edits', async () => {
  const h = harness({ news: { items: [row('original')] } })
  h.retry(data => { data.news.items = [row('other user')] })
  await assert.rejects(h.fbSet('news', [row('mine')], [row('original')]), /annen bruker/)
  assert.equal(h.data.news.items[0].title, 'other user'); assert.equal(h.writes(), 0)
  await assert.rejects(h.fbSet('news', [], []), /annen bruker/)
})
test('rejected writes propagate; no successful write on denied/offline operation', async () => {
  const h = harness(); h.deny()
  await assert.rejects(h.fbSet('news', [row('new')], []), /unavailable/)
  assert.equal(h.writes(), 0)
})
test('object property ordering is not a false conflict', async () => {
  const h = harness({ news: { items: [{ title: 'old', id: 1 }] } })
  await h.fbSet('news', [row('new')], [row('old')])
  assert.equal(h.writes(), 1)
})
test('backup is read-only and round trips all nine document states', async () => {
  const h = harness({ news: { items: [row('old')], extra: true }, events: { items: [] } })
  const documents = await h.readBackup()
  const b = backup(h, documents)
  h.validateBackup(JSON.parse(JSON.stringify(b)))
  assert.equal(Object.keys(documents).length, 9); assert.equal(h.writes(), 0)
  await h.restoreBackup(b, documents)
  assert.equal(h.writes(), 2); assert.equal(h.data.news.extra, true)
  assert.equal(Object.hasOwn(h.data, 'members'), false)
})
test('import aborts atomically if any document changed after preview', async () => {
  const h = harness({ news: { items: [row('old')] }, events: { items: [] } })
  const expected = await h.readBackup(); const b = backup(h, structuredClone(expected))
  b.documents.news.items = []
  h.retry(data => { data.events.items = [row('concurrent')] })
  await assert.rejects(h.restoreBackup(b, expected), /endret siden/)
  assert.equal(h.writes(), 0); assert.equal(h.data.news.items.length, 1)
})
test('invalid, partial, foreign and oversized imports fail before writes', async () => {
  const h = harness(); const good = backup(h, await h.readBackup())
  for (const mutate of [
    b => { b.version = 2 }, b => { b.projectId = 'production' }, b => { delete b.documents.rules },
    b => { b.documents.news = { exists: false, items: [row('invalid')] } },
    b => { b.documents.news = { exists: true, items: [row('a'), row('b')] } },
    b => { b.documents.waters = { exists: true, items: [{ id: 1, name: 'x', tags: 'bad' }] } },
    b => { b.documents.news = { exists: true, items: [{ ...row('x'), photo: 'javascript:alert(1)' }] } },
    b => { b.documents.news = { exists: true, items: [row('x'.repeat(800001))] } },
  ]) {
    const bad = structuredClone(good); mutate(bad)
    await assert.rejects(h.restoreBackup(bad, good.documents))
  }
  assert.equal(h.writes(), 0)
})
test('backup requires Firebase admin claim; shared password is insufficient', async () => {
  const h = harness()
  await assert.rejects(h.requireBackupAdmin(), /admin/)
  h.context.auth.currentUser = { getIdTokenResult: async force => { assert.equal(force, true); return { claims: { admin: false } } } }
  await assert.rejects(h.requireBackupAdmin(), /admin/)
  h.context.auth.currentUser = { getIdTokenResult: async () => ({ claims: { admin: true } }) }
  await h.requireBackupAdmin()
})

test('actual root write gate blocks pre-load edits and double submission, and releases after failure', async () => {
  const h = harness(); const errors = [], busy = []
  const context = vm.createContext({
    DATA_KEYS: h.DATA_KEYS, loaded: { current: new Set() }, writeLock: { current: false },
    setStorageError: x => errors.push(x), setSaving: x => busy.push(x),
  })
  const actionSource = source.split('  const perform = async action => {')[1].split('  const makeSetter')[0]
  vm.runInContext('globalThis.perform = async action => {' + actionSource, context)
  let count = 0, finish
  assert.equal(await context.perform(() => count++), false); assert.equal(count, 0)
  context.loaded.current = new Set(h.DATA_KEYS)
  const first = context.perform(async () => { count++; await new Promise(r => { finish = r }); throw new Error('denied') })
  assert.equal(await context.perform(() => count++), false); assert.equal(count, 1)
  finish(); assert.equal(await first, false)
  assert.match(errors.at(-1), /denied/); assert.equal(busy.at(-1), false)
  assert.equal(await context.perform(() => count++), true); assert.equal(count, 2)
})

test('all cloud edit/delete handlers await successful persistence before success UI', () => {
  for (const [name, key] of Object.entries({ News: 'news', Events: 'events', Catches: 'catches', Merch: 'merch', Members: 'members', Waters: 'waters', Quotes: 'quotes', Badges: 'badges', Rules: 'rules' })) {
    const section = source.split(`function ${name}Page(`)[1].split('// ───')[0]
    const calls = [...section.matchAll(new RegExp(`set${name}\\(`, 'g'))]
    assert.equal(calls.length, name === 'Rules' ? 3 : 2)
    for (const call of calls) assert.equal(section.slice(call.index - 11, call.index), 'if (!await ')
    assert.ok(section.includes(`editBase.current = ${key}`))
    assert.ok(section.includes(`deleteBase.current = ${key}`))
  }
})

test('real news save handler waits for confirmation, preserves failed draft and retains opening baseline', async () => {
  const h = harness({ news: { items: [row('old')] } })
  let slots = [], cursor = 0, props, complete, succeed = false, calls = [], toasts = []
  const ui = vm.createContext({
    useRef: v => { const i = cursor++; return slots[i] ||= { current: v } },
    useState: v => { const i = cursor++; if (!(i in slots)) slots[i] = v; return [slots[i], x => { slots[i] = x }] },
    CO: { river: 'blue' }, nextId: () => 2,
  })
  const prefix = source.split('function NewsPage(')[1].split('  return (')[0]
  vm.runInContext('function NewsPage(' + prefix + '\nreturn {openEdit, save, remove, open}; }', ui)
  const original = [row('old')]
  props = { news: original, showToast: x => toasts.push(x), setNews: async (value, expected) => { calls.push({ value, expected }); await new Promise(r => { complete = r }); return succeed } }
  const render = () => { cursor = 0; return ui.NewsPage(props) }
  render().openEdit(original[0])
  props.news = [row('concurrent')]
  let page = render(); const pending = page.save()
  assert.equal(toasts.length, 0); assert.equal(render().open, true)
  assert.equal(calls[0].expected, original)
  complete(); await pending
  assert.equal(toasts.length, 0); assert.equal(render().open, true)
  succeed = true
  const successful = render().save(); complete(); await successful
  assert.equal(render().open, false); assert.equal(toasts.length, 1)
})
