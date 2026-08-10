const fs   = require('fs')
const path = require('path')

const { sendWithTemplate } = require('../sendWithTemplate')

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
const IGNORE_FILES = new Set(['menu.js'])

// File helper yang tidak berisi command (skip saat scan)
// Pola: file yang tidak export function, atau masuk daftar ini
const HELPER_FILE_PATTERNS = [
  /^rpg-/,        // rpg-time-system.js, rpg-durability-helper.js, dll
  /^helper/,
  /^util/,
  /^config/,
]

function isHelperFile(filename) {
  return HELPER_FILE_PATTERNS.some(p => p.test(filename))
}

// ─── CATEGORY FILE PARSER ────────────────────────────────────────────────────

// Awalan angka mengatur urutan: "1-main.js" → name="main", order=1
function parseCategoryFile(file) {
  const stem  = file.replace(/\.js$/, '')
  const match = stem.match(/^(\d+)[-_](.+)$/)
  return {
    file,
    name:  match ? match[2] : stem,
    order: match ? Number(match[1]) : Number.POSITIVE_INFINITY,
  }
}

// Semua file .js langsung di lib/fitur/ (kecuali menu.js)
function getCategoryFiles() {
  try {
    return fs
      .readdirSync(__dirname)
      .filter(f => f.endsWith('.js') && !IGNORE_FILES.has(f))
      .map(parseCategoryFile)
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'id'))
  } catch (e) {
    console.error('[menu] getCategoryFiles:', e.message)
    return []
  }
}

// ─── GENERIC SUBFOLDER SCANNER ───────────────────────────────────────────────
// Berlaku untuk SEMUA kategori yang punya folder di samping file-nya.
// Contoh: rpg.js + rpg/ → subfolder scanner aktif untuk "rpg"
//         download.js + download/ → subfolder scanner untuk "download" (masa depan)

// Scan satu file — kembalikan command bertanda 'menu'
function scanFileForMenuCommands(filePath) {
  const cmds = []
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const regex   = /case\s+['"`]([^'"`]+)['"`]\s*:\s*['"`]menu['"`]/g
    let m
    while ((m = regex.exec(content)) !== null) {
      if (!cmds.includes(m[1])) cmds.push(m[1])
    }
  } catch {}
  return cmds
}

// Scan seluruh isi folder (rekursif) — kembalikan Map<subfolderName, string[]>
// Root file (langsung di folderPath, bukan subfolder) masuk ke key '__root__'
function scanFolderDeep(folderPath) {
  // result: { '__root__': [...], 'PET': [...], 'COOKING': [...], ... }
  const result = { __root__: [] }
  if (!fs.existsSync(folderPath)) return result

  for (const entry of fs.readdirSync(folderPath, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      // Scan subfolder langsung (1 level — tidak rekursif lebih dalam)
      const subCmds = []
      const subPath = path.join(folderPath, entry.name)
      for (const sub of fs.readdirSync(subPath, { withFileTypes: true })) {
        if (!sub.isFile() || !sub.name.endsWith('.js') || isHelperFile(sub.name)) continue
        for (const cmd of scanFileForMenuCommands(path.join(subPath, sub.name))) {
          if (!subCmds.includes(cmd)) subCmds.push(cmd)
        }
      }
      if (subCmds.length > 0) result[entry.name] = subCmds
    } else if (entry.isFile() && entry.name.endsWith('.js') && !isHelperFile(entry.name)) {
      for (const cmd of scanFileForMenuCommands(path.join(folderPath, entry.name))) {
        if (!result.__root__.includes(cmd)) result.__root__.push(cmd)
      }
    }
  }
  return result
}

// Periksa apakah sebuah kategori punya folder pendamping
// Contoh: "rpg" → cari lib/fitur/rpg/
function getCategoryFolderPath(categoryName) {
  const p = path.join(__dirname, categoryName)
  return fs.existsSync(p) && fs.statSync(p).isDirectory() ? p : null
}

// ─── COMMAND MAP BUILDER ─────────────────────────────────────────────────────

// Ambil semua command bertanda 'menu' dari file kategori flat (tanpa subfolder)
function scanFlatFile(category) {
  return scanFileForMenuCommands(path.join(__dirname, category.file))
}

// Build map lengkap: { 'Main': ['daftar','unreg',...], 'Tools': [...], ... }
// Hanya untuk file flat (tidak punya folder pendamping) — dipakai .menu & .menuall
function getAllFlatCommands() {
  const map = {}
  for (const cat of getCategoryFiles()) {
    const folderPath = getCategoryFolderPath(cat.name)
    if (folderPath) continue // kategori punya subfolder, skip dari flat list
    const cmds = scanFlatFile(cat)
    if (cmds.length > 0) map[capitalize(cat.name)] = cmds
  }
  return map
}

// Build list sections lengkap termasuk kategori dengan subfolder (untuk .menuall)
// Subfolder tampil sebagai section terpisah, sama persis seperti .menu<kategori>
function getAllCommandsSections() {
  const sections = [] // array of { tag, cmds }
  for (const cat of getCategoryFiles()) {
    const folderPath = getCategoryFolderPath(cat.name)
    if (!folderPath) {
      const cmds = scanFlatFile(cat)
      if (cmds.length > 0) sections.push({ tag: capitalize(cat.name), cmds })
    } else {
      const deep = scanFolderDeep(folderPath)
      // Root commands dulu
      if (deep.__root__.length > 0) {
        sections.push({ tag: capitalize(cat.name), cmds: deep.__root__ })
      }
      // Tiap subfolder jadi section tersendiri
      for (const [sub, cmds] of Object.entries(deep)) {
        if (sub === '__root__') continue
        if (cmds.length > 0) sections.push({ tag: `${capitalize(cat.name)} ${sub}`, cmds })
      }
    }
  }
  return sections
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function capitalize(str) {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// ─── BUILDERS ────────────────────────────────────────────────────────────────

function decorate(namabot, content) {
  return `⬣─▣[ ${namabot} ]▣─⬣\n│\n${content}\n▣──⬣`
}

function buildHeaderInner(dino, m, ctx) {
  const { pushname, user } = ctx
  const { getLevelInfo } = require('./rpg/rpg-levelling')

  const namaowner  = dino.config?.namaowner || global.namaowner
  const totalUser  = Object.keys(global.db?.users || {}).length
  const level      = user?.level || 1
  const uptime     = process.uptime()
  const runtime    = `${Math.floor(uptime/86400)}d ${Math.floor(uptime%86400/3600)}h ${Math.floor(uptime%3600/60)}m ${Math.floor(uptime%60)}s`

  const { xpNeeded, progressXP, sisaXP, pct } = getLevelInfo(level, user?.exp || 0)
  const barLen  = 10
  const filled  = Math.round((pct / 100) * barLen)
  const bar     = '█'.repeat(filled) + '░'.repeat(barLen - filled)

//  return `│ 👑 Owner   : ${namaowner}\n│ 👥 Total   : ${totalUser} user\n│ ⏱️ Runtime : ${runtime}\n│\n│ ════ Info User ════\n│\n│ 👤 Nama    : ${pushname}\n│ 🏆 Level   : ${level}\n│ ✨ EXP     : ${progressXP.toLocaleString('id-ID')} / ${xpNeeded.toLocaleString('id-ID')}\n│ 📊 Progress: [${bar}] ${pct}%\n│ 📈 Sisa    : ${sisaXP.toLocaleString('id-ID')} EXP`
return `│ 👑 Owner   : ${namaowner}
│ 👥 Users   : ${totalUser}
│ ⏱ Runtime : ${runtime}
│
├─〔 Info User 〕
│ 👤 Nama    : ${pushname}
│ 🏆 Level   : ${level}
│ ✨ EXP      : ${progressXP.toLocaleString('id-ID')} / ${xpNeeded.toLocaleString('id-ID')}
│ 📊 Progress : [${bar}] ${pct}%
│ 📈 Sisa EXP : ${sisaXP.toLocaleString('id-ID')}
╰────────────`
}

function buildSection(tag, commands, prefix) {
  const lines = commands.map(cmd => `│  ${prefix}${cmd}`).join('\n')
//  return `⃝▣─「Menu ${tag} 」─⬣│\n${lines}`
return `⃝▣─「Menu ${tag} 」─⬣
│
${lines}`
}

// .menu — daftar kategori (hanya flat + kategori punya subfolder)
function buildCategoryList(dino, m, ctx) {
  const namabot    = dino.config?.namabot || global.namabot
  const usedPrefix = ctx.prefix || '.'
  const header     = buildHeaderInner(dino, m, ctx)

  const lines = getCategoryFiles().map(cat => {
    const lower = cat.name.toLowerCase()
    return `│  ${usedPrefix}menu${lower}`
  }).join('\n')

//  return decorate(namabot, `${header}\n│\n│ ════ Daftar Menu ════\n│\n${lines}`)
return decorate(namabot, `${header}
╭─〔 *Daftar Menu* 〕
│
${lines}`)
}

// .menuall / .allmenu — semua command semua kategori dengan subfolder sebagai section terpisah
function buildAllMenu(dino, m, ctx) {
  const namabot    = dino.config?.namabot || global.namabot
  const usedPrefix = ctx.prefix || '.'
  const header     = buildHeaderInner(dino, m, ctx)
  const sections   = getAllCommandsSections()

  const body = sections
    .map(({ tag, cmds }) => buildSection(tag, cmds, usedPrefix))
    .join('\n│\n')

  return decorate(namabot, `${header}\n${body}`)
}

// .menu<kategori> — menu satu kategori
// Jika kategori punya subfolder: tampil root + tiap subfolder sebagai section terpisah
// Jika flat: tampil satu section saja
function buildCategoryMenu(dino, m, ctx, catName, subfilter = null) {
  const namabot    = dino.config?.namabot || global.namabot
  const usedPrefix = ctx.prefix || '.'
  const header     = buildHeaderInner(dino, m, ctx)
  const tag        = capitalize(catName)
  const folderPath = getCategoryFolderPath(catName.toLowerCase())

  let body

  if (!folderPath) {
    // Kategori flat biasa
    const cat  = getCategoryFiles().find(c => c.name.toLowerCase() === catName.toLowerCase())
    const cmds = cat ? scanFlatFile(cat) : []
    body = cmds.length > 0
      ? buildSection(tag, cmds, usedPrefix)
      : `│ ════ Menu ${tag} ════\n│\n│  Belum ada fitur.`
  } else {
    // Kategori dengan subfolder
    const deep     = scanFolderDeep(folderPath)
    const sections = []

    // Root section
    if (!subfilter) {
      const rootCmds = deep.__root__
      sections.push(
        rootCmds.length > 0
          ? buildSection(tag, rootCmds, usedPrefix)
          : `│ ════ Menu ${tag} ════\n│\n│  Belum ada fitur.`
      )
    }

    // Subfolder sections
    for (const [sub, cmds] of Object.entries(deep)) {
      if (sub === '__root__') continue
      if (subfilter && sub.toLowerCase() !== subfilter.toLowerCase()) continue
      sections.push(buildSection(`${tag} ${sub}`, cmds, usedPrefix))
    }

    if (sections.length === 0) {
      sections.push(`│ ════ Menu ${tag} ════\n│\n│  Belum ada fitur.`)
    }

    body = sections.join('\n│\n')
  }

  return decorate(namabot, `${header}\n│\n${body}`)
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────
module.exports = async (command, ctx) => {
  const { dino, m, user, prefix } = ctx
  const namabot    = dino.config?.namabot || global.namabot
  const usedPrefix = prefix || '.'

  // Guard: wajib terdaftar kecuali .daftar
  if (!user?.registered && command !== 'daftar') {
    const teks = decorate(namabot, `*Ups! Kamu belum terdaftar!*\n│\n│ _*Gunakan format:*_\n│ ${usedPrefix}daftar nama\n│\n│ \`\`\`Daftarkan diri sebagai pengguna bot\`\`\`\n│\n│ Contoh:\n│ • ${usedPrefix}daftar Ahyan`)
    return sendWithTemplate(dino, m, teks, { mentions: [m.sender] })
  }

  // .menu → daftar semua kategori
  if (command === 'menu') {
    return sendWithTemplate(dino, m, buildCategoryList(dino, m, ctx), { mentions: [m.sender] })
  }

  // .allmenu / .menuall / .menuutama → semua command semua kategori
  if (command === 'allmenu' || command === 'menuall' || command === 'menuutama') {
    return sendWithTemplate(dino, m, buildAllMenu(dino, m, ctx), { mentions: [m.sender] })
  }

  // .menu<kategori> / .<kategori>menu
  // Juga .menu<kategori><subfolder> untuk kategori yang punya subfolder
  // Contoh: .menurpg, .menurpgpet, .menurpgcooking
  //         .menudownload, .menudownloadmusic (masa depan)
  const categories = getCategoryFiles()

  for (const cat of categories) {
    const lower      = cat.name.toLowerCase()
    const folderPath = getCategoryFolderPath(lower)

    // .menu<kategori> atau .<kategori>menu → menu kategori penuh
    if (command === `menu${lower}` || command === `${lower}menu`) {
      return sendWithTemplate(
        dino, m,
        buildCategoryMenu(dino, m, ctx, lower),
        { mentions: [m.sender] }
      )
    }

    // .menu<kategori><subfolder> → hanya subfolder tertentu
    // Hanya relevan untuk kategori yang punya folder pendamping
    if (folderPath && command.startsWith(`menu${lower}`)) {
      const subName = command.slice(`menu${lower}`.length) // sisa setelah prefix
      if (subName.length > 0) {
        // Verifikasi subfolder ada
        const deep = scanFolderDeep(folderPath)
        const matchedSub = Object.keys(deep).find(
          s => s !== '__root__' && s.toLowerCase() === subName
        )
        if (matchedSub) {
          return sendWithTemplate(
            dino, m,
            buildCategoryMenu(dino, m, ctx, lower, matchedSub),
            { mentions: [m.sender] }
          )
        }
      }
    }
  }

  return
}