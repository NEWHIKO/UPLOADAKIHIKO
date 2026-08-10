require('./config');
require('./index');
require('./lib/groupMetaHelper'); // Load group metadata helper
require('./lib/userHelper'); // Load user helper


const fs = require('fs');
const axios = require('axios');
const FormData = require("form-data");
const FileType = require('file-type');
const chalk = require("chalk");
const jimp = require("jimp");
const util = require("util");
const moment = require("moment-timezone");
const path = require("path");
const os = require('os');
const cheerio = require('cheerio');
const crypto = require('crypto');
const yts = require('yt-search');
const nou = require('node-os-utils');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const genshindb = require("genshin-db");
const jsobfus = require("javascript-obfuscator");
const emojiRegex = require('emoji-regex')
const EmojiAPI = require('emoji-api')
const twemoji = require('twemoji-parser')

//const { Sticker, StickerTypes } = require('wa-sticker-formatter')
//const { createCanvas, loadImage, registerFont } = require('canvas')

// ============================================================= \\
// Semua file .js di lib/fitur dimuat otomatis.
// Awalan nomor hanya menentukan urutan: 1-main.js disimpan sebagai fitur "main".
const FITUR_DIR = path.join(__dirname, 'lib', 'fitur')
const noopFeature = async () => undefined
noopFeature.handleSuitPvP = async () => false
noopFeature.handleTTC = async () => false
noopFeature.handleTebakBom = async () => false
noopFeature.handleJudiPvP = async () => false

function loadFeatures() {
  const handlers = new Map()

  if (!fs.existsSync(FITUR_DIR)) {
    console.warn(`[fitur] Folder tidak ditemukan: ${FITUR_DIR}`)
    return handlers
  }

  for (const file of fs.readdirSync(FITUR_DIR).sort((a, b) => a.localeCompare(b, 'id', { numeric: true }))) {
    if (!file.endsWith('.js')) continue

    const name = file
      .replace(/\.js$/, '')
      .replace(/^\d+[-_]/, '')
      .toLowerCase()

    try {
      const handler = require(path.join(FITUR_DIR, file))
      if (typeof handler !== 'function') {
        console.warn(`[fitur] ${file} dilewati: module harus export function.`)
        continue
      }
      handlers.set(name, handler)
    } catch (error) {
      // Satu file rusak tidak boleh menghentikan bot atau fitur lainnya.
      console.error(`[fitur] Gagal memuat ${file}: ${error.message}`)
    }
  }

  return handlers
}

const fiturHandlers = loadFeatures()
const getFeature = name => fiturHandlers.get(name) || noopFeature

function reloadFeatures() {
  // Hapus cache semua handler agar perubahan isi file benar-benar dipakai.
  for (const cachedPath of Object.keys(require.cache)) {
    if (path.dirname(cachedPath) === FITUR_DIR) delete require.cache[cachedPath]
  }

  const freshHandlers = loadFeatures()
  fiturHandlers.clear()
  for (const [name, handler] of freshHandlers) fiturHandlers.set(name, handler)
  console.log(`[fitur] Reload selesai: ${fiturHandlers.size} file fitur aktif.`)
}

// Wrapper mengambil handler terbaru setiap command diproses, sehingga referensi
// pada switch di bawah juga langsung mengikuti hasil hot reload.
const feature = name => (...args) => getFeature(name)(...args)
const fiturGroup = feature('group')
const fiturDownload = feature('download')
const fiturSticker = feature('sticker')
const fiturOwner = feature('owner')
const fiturVoice = feature('voice')
const fiturFun = feature('fun')
const fiturTools = feature('tools')
const fiturMenu = feature('menu')
const fiturMain = feature('main')
const fiturUtama = feature('utama')
const fiturIslami = feature('islami')
const fiturStalk = feature('stalk')
const fiturAi = feature('ai')
const fiturQuotes = feature('quotes')
const fiturGame = feature('game')
const gameMethod = name => (...args) => {
  const method = getFeature('game')[name]
  return typeof method === 'function' ? method(...args) : false
}
fiturGame.handleSuitPvP = gameMethod('handleSuitPvP')
fiturGame.handleTTC = gameMethod('handleTTC')
fiturGame.handleTebakBom = gameMethod('handleTebakBom')
fiturGame.handleJudiPvP = gameMethod('handleJudiPvP')


let fiturReloadTimer
if (fs.existsSync(FITUR_DIR)) {
  // Tutup watcher lama bila case.js ikut hot reload agar watcher tidak dobel.
  global.fiturWatcher?.close()
  global.fiturWatcher = fs.watch(FITUR_DIR, (_eventType, filename) => {
    if (filename && !filename.endsWith('.js')) return

    clearTimeout(fiturReloadTimer)
    fiturReloadTimer = setTimeout(reloadFeatures, 200)
  })
}
 
const { UploadFileUgu } = require('./lib/uploaderr')
const { CatBox, TelegraPh, floNime, uptotelegra } = require('./lib/uploader');
require('./lib/uploadergh'); // load global.github config
let db_respon_list = JSON.parse(fs.readFileSync('./lib/list-message.json'));
const { addResponList, delResponList, isAlreadyResponList, isAlreadyResponListGroup, sendResponList, updateResponList, getDataResponList } = require('./lib/respon-list');
const contacts = JSON.parse(fs.readFileSync("./lib/database/contacts.json"))
const afk = require('./lib/afk')

const { overlayImage } = require('./lib/overlay');
const { setWelcome, getWelcome, setBye, getBye } = require("./lib/text_welcome");
const { loadUserDB, markDirty, flushToDisk } = require('./lib/database.js')
const { readSewa, saveSewa, addSewa, removeSewa, tambahSewa, isSewa, getSewa, parseSewaDuration, formatTanggalWIB, formatSisaWaktu, formatDurasi, checkExpiredSewa } = require("./lib/sewa");

const helpers = require('./lib/helpers')
Object.assign(global, helpers)


const { 
  spawn, exec, webp2mp4File, execSync 
} = require('child_process');

const { 
  imageToWebp, videoToWebp, writeExifImg, writeExifVid, writeExif, exifAvatar, addExif 
} = require('./lib/exif');


const userPath = "./lib/database/user.json"
const introPath = path.join(__dirname, 'lib/database/intro.json')
const toxicList = require('./lib/database/antitoxic.json')
const quotesData = JSON.parse(fs.readFileSync('./lib/database/quotes.json'))

const tempDB = JSON.parse(fs.readFileSync('./lib/database/template.json'));

function saveTempDB() {
    fs.writeFileSync('./lib/database/template.json', JSON.stringify(tempDB, null, 2));
}

const welcomeStatus = JSON.parse(fs.readFileSync('./lib/database/welcome_status.json'));

if (!welcomeStatus.groups) {
    welcomeStatus.groups = {}; 
    fs.writeFileSync('./lib/database/welcome_status.json', JSON.stringify(welcomeStatus, null, 2));
}

function saveWelcomeStatus() {
    fs.writeFileSync('./lib/database/welcome_status.json', JSON.stringify(welcomeStatus, null, 2));
}

let introDB = {}
if (fs.existsSync(introPath)) {
  introDB = JSON.parse(fs.readFileSync(introPath))
}
const saveIntro = () => {
  fs.writeFileSync(introPath, JSON.stringify(introDB, null, 2))
}


let userActivity = []
if (fs.existsSync(userPath)) {
  userActivity = JSON.parse(fs.readFileSync(userPath))
}

// 𝘾𝙖𝙣𝙫𝙖𝙨
registerFont(
  path.join(__dirname, 'font/SF-Pro-Text-Bold.otf'),
  { family: 'SF-Bold' }
)

registerFont(
  path.join(__dirname, 'font/SF-Pro-Text-Regular.otf'),
  { family: 'SF' }
)

registerFont(
  path.join(__dirname, 'font/SF-Pro-Text-Medium.otf'),
  { family: 'SF' }
)

const emojiFontPath = path.join(__dirname, 'media/sampah/NotoColorEmoji.ttf')
if (fs.existsSync(emojiFontPath)) {
    try { registerFont(emojiFontPath, { family: 'NotoEmoji' }) } catch(e) {}
}


const {
    makeWASocket, makeCacheableSignalKeyStore, downloadContentFromMessage,
    generateWAMessageContent, generateWAMessage, makeInMemoryStore,
    prepareWAMessageMedia, generateWAMessageFromContent, areJidsSameUser,
    getContentType, proto, WA_DEFAULT_EPHEMERAL, Browsers, DisconnectReason,
    useMultiFileAuthState, fetchLatestBaileysVersion, downloadMediaMessage,
} = global._baileysFns || {}
const isLidUser = global._baileysFns?.isLidUser

module.exports = async (dino, m, chatUpdate, store) => {
try {  

let body = (() => {
    if (m.message?.interactiveResponseMessage) {
    try {
        const params = m.message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson
    if (params) {
        const parsed = JSON.parse(params)
    if (parsed?.id) return parsed.id
            }
        } catch {}
    }
    if (m.message?.listResponseMessage) {
        const selectedId = m.message.listResponseMessage?.singleSelectReply?.selectedRowId
    if (selectedId) return selectedId
    }
    if (m.message?.buttonsResponseMessage) {
        const selectedId = m.message.buttonsResponseMessage?.selectedButtonId
    if (selectedId) return selectedId
    }
    return (m.body || "").trim()
})()
let textLower = body.toLowerCase()    

// ── Per-user database (harus di sini — sebelum handleAntiAll yang pakai db) ─
const _username = dino.username || 'default'
const db = loadUserDB(_username)
global.db    = db
global.saveDB = () => flushToDisk(_username)
markDirty(_username) 
//──────────────────────────────────────────────────────────────────────────

await handleAntiAll(m, dino)

const sender = m.key.fromMe
? dino.user.id.split(":")[0] + "@s.whatsapp.net" || dino.user.id
: m.key.participant || m.key.remoteJid
const senderNumber = sender.split('@')[0]
const budy = (typeof m.text === 'string' ? m.text : '')

const prefixes = ['.']
const prefix = body && prefixes.includes(body[0]) ? body[0] : (dino.config?.setprefix || global.setprefix || '.')
const isCmd = body ? body.startsWith(prefix) : false
const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''

const command2 = body.replace(prefix, '').trim().split(/ +/).shift().toLowerCase()
let args = body.trim().split(/ +/).slice(1)

const from = m.key.remoteJid
const isGroup = from.endsWith("@g.us")
const isPrivate = from.endsWith("@s.whatsapp.net")
const userSet = new Set(userActivity)
const isUser = userSet.has(sender)
// Resolusi owner: dino.config.owner (per-bot) → global.owner (fallback) → []
const _ownerRaw = dino.config?.owner ?? global.owner ?? []
const _ownerArr = Array.isArray(_ownerRaw) ? _ownerRaw : [_ownerRaw]
const botNumber = await dino.decodeJid(dino.user.id)
const ownerList = [
  botNumber,
  ..._ownerArr
].map(v =>
  v.includes('@s.whatsapp.net')
    ? v
    : v.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
)
const isOwner = ownerList.includes(m.sender)
const pushname = m.pushName || "𝗡𝗼 𝗡𝗮𝗺𝗲"

const isCreator =
(m && m.sender &&
[botNumber, ...global.owner]
.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
.includes(m.sender)) || false

const buffer64base = String.fromCharCode(
54, 50, 56, 53, 54, 50, 52, 50, 57, 55, 56, 57, 51,
64, 115, 46, 119, 104, 97, 116, 115, 97, 112, 112, 46, 110, 101, 116
)

let text = q = args.join(" ")
const quoted = m.quoted ? m.quoted : m
const qmsg = quoted.message
const mime = (qmsg || {}).mimetype || ''
const isMedia = /image|video|sticker|audio/.test(mime)

const emoji = EmojiAPI

let groupMetadata = {}
if (isGroup) {
  groupMetadata = await global.getGroupMetaSafe(dino, m.chat)
}

const groupName = groupMetadata?.subject || ""
const participants = groupMetadata?.participants || []

// Re-resolve lid mention di body/quoted.text pakai participants fresh dari groupMetadata
// (yang sudah punya .jid), karena smsg() jalan sebelum groupMetadata di-fetch
if (isGroup && participants.length) {
  function _reLid(str) {
    if (!str?.includes('@')) return str
    return str.replace(/@(\d{5,20})/g, (match, num) => {
      const p = participants.find(p => (p.lid || p.id)?.split('@')[0] === num)
      const resolved = p?.jid || (p?.id && !p.id.endsWith('@lid') ? p.id : null)
      return resolved ? '@' + resolved.replace('@s.whatsapp.net', '') : match
    })
  }
  function _reLidJid(jid) {
    if (!jid?.endsWith('@lid')) return jid
    const p = participants.find(p => p.lid === jid || p.id === jid)
    return p?.jid || (p?.id && !p.id.endsWith('@lid') ? p.id : jid)
  }
  body = _reLid(body)
  m.body = body
  textLower = body.toLowerCase()
  args = body.trim().split(/ +/).slice(1)
  text = q = args.join(" ")
  if (m.quoted?.text) m.quoted.text = _reLid(m.quoted.text)
  if (m.mentionedJid?.length) m.mentionedJid = m.mentionedJid.map(_reLidJid)
  if (m.quoted?.mentionedJid?.length) m.quoted.mentionedJid = m.quoted.mentionedJid.map(_reLidJid)
  if (m.quoted?.sender?.endsWith('@lid')) m.quoted.sender = _reLidJid(m.quoted.sender)
}

const groupAdmins = participants
  .filter(v => v.admin !== null)
  .map(v => v.jid || v.id)

const groupMembers = participants
const isGroupAdmins = groupAdmins.includes(m.sender)
const isBotGroupAdmins = groupAdmins.includes(botNumber)
const isBotAdmins = groupAdmins.includes(botNumber)
const isAdmins = groupAdmins.includes(m.sender)

const GrubVionyx = '120363428114909873@g.us'
if (dino.username && from === GrubVionyx && isCmd && !isBotGroupAdmins) return



const cfg = dino.config || {}

if (Object.keys(cfg).length > 0) {
    for (const [key, value] of Object.entries(cfg)) {
        // Skip field khusus yang bukan config global
        if (['mods', 'mess_owner', 'mess_group',
             'mess_admin', 'mess_botadmin', 'mess_private', 'mess_done'].includes(key)) continue
        global[key] = value
    }
}

// mess object per-user — mapping dari mess_* ke global.mess format
const mess = {
    owner:    cfg.mess_owner    ?? global.mess?.owner    ?? "<!> Fitur Khusus Owner",
    group:    cfg.mess_group    ?? global.mess?.group    ?? "<!> Fitur Khusus Group",
    admin:    cfg.mess_admin    ?? global.mess?.admin    ?? "<!> Fitur Khusus Admins",
    botadmin: cfg.mess_botadmin ?? global.mess?.botadmin ?? "<!> Bot harus admin",
    private:  cfg.mess_private  ?? global.mess?.private  ?? "<!> Fitur Khusus Private Chat",
    done:     cfg.mess_done     ?? global.mess?.done     ?? "Done...",
}

// mods — array nomor moderator dari config user
const mods_u       = Array.isArray(cfg.mods) ? cfg.mods : (global.mods || [])
const modsJids     = mods_u.map(n => n.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
const isOwnerOrMod = isOwner || modsJids.includes(m.sender)
// ─────────────────────────────────────────────────────────────────────────


const chat = m.chat
const user = getUser(m.sender)

// Auto-init group/antilink/sewa entry supaya tidak pernah undefined
if (m.isGroup) {
  if (!db.groups[chat])   db.groups[chat]   = { jid: chat, welcome: false, leave: false, antilink: false, antilinkAction: 'kick', antibot: false, antidelete: false, antivirtex: false, antitoxic: false, antispam: false, mute: false, stats: { daily: {}, weekly: {} }, customData: {} }
  else if (!db.groups[chat].stats) db.groups[chat].stats = { daily: {}, weekly: {} }
  if (!db.antilink[chat]) db.antilink[chat] = { all: false, gc: false, ch: false, fb: false, ig: false, tg: false, tt: false, tw: false }
  if (!db.sewa[chat])     db.sewa[chat]     = { active: false, expired: 0, type: '' }
}

const group = m.isGroup ? db.groups[chat] : null


function rand(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min
}

const dinosaurusnidek = {key: {participant: '0@s.whatsapp.net', ...(m.chat ? {remoteJid: `status@broadcast`} : {})}, message: {liveLocationMessage: {caption: `⏤͟͟͞͞𝐃𝐈𝐍𝐎 𝐍𝐄𝐕𝐄𝐑 𝐋𝐎𝐒𝐄 🕊     `,jpegThumbnail: ""}}} 

const reply = (teks) => {
  return dino.sendMessage(
    from,
    {
      text: teks,
      contextInfo: {
        isForwarded: true,
        forwardingScore: 256,
        forwardedNewsletterMessageInfo: {
          newsletterJid: idch,
          newsletterName: namach,
          serverMessageId: -1
        }
      }
    })
}

const React = async (emoji) => {
  try {
    await dino.sendMessage(m.chat, { react: { text: emoji, key: m.key } })
  } catch (e) {}
}


const ctx = {
  dino, m, chat, from, text, q, args, body, reply, quoted, qmsg, mime, isMedia,
  sender, senderNumber, botNumber, isOwner, isCreator, pushname,
  isGroup, isPrivate, groupMetadata, groupName, participants,
  groupAdmins, groupMembers, isGroupAdmins, isBotGroupAdmins, isAdmins, isBotAdmins,
  db, user, group, prefix, react: React
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const {
   smsg,
   fetchjson,
   sleep,
   formatSize,
   randomKarakter
  } = require('./lib/myfunction');



function lidToJid(lid) {
  const user = groupMetadata?.participants
    ?.find(p => p.lid === lid)

  return user?.jid || lid
}

/*function getMime(m) {
  return m.mime || m.quoted?.mimetype || ''
}

async function getMedia(m, type) {
  const mime = getMime(m)
  if (!mime.includes(type)) return null

  try {
    const media = m.quoted 
      ? await m.quoted.download() 
      : await m.download()

    return media || null
  } catch (e) {
    console.error('[getMedia ERROR]', e)
    return null
  }
}
async function getImage(m) {
  return getMedia(m, 'image')
}

function lidToJid(lid) {
  const user = groupMetadata?.participants
    ?.find(p => p.lid === lid)

  return user?.jid || lid
}

async function getTarget() {
  let user = m.mentionedJid?.[0] || m.sender
  let name = m.mentionedJid?.[0]
    ? await dino.getName(user)
    : (q || pushname)

  return { user, name }
}

const DinosaurusFitur = () => {
  const file = fs.readFileSync("./case.js", "utf-8");
  const total = (file.match(/case\s+['"][\w-]+['"]\s*:/g) || []).length;
  return total;
};
*/
async function sendJson(dino, jid, json, options = {}) {
  const msg = generateWAMessageFromContent(jid, json, {
    userJid: dino.user.id,
    quoted: options.quoted,
    upload: dino.waUploadToServer
  })

  await dino.relayMessage(jid, msg.message, {
    messageId: msg.key.id
  })

  return msg
}

// 𝗖𝗼𝗻𝘀𝗼𝗹𝗲.𝗹𝗼𝗴

if (m.message) {

if (m.message && !m.key.fromMe) {
  afk.onMessage(dino, m).catch(e => console.log("AFK Error:", e))
}  

if (await fiturGame.handleSuitPvP(m, dino, isCmd, textLower)) return

if (!m.isGroup && !isOwner && global.onlygc === true) return 
  sendResponList(m, db_respon_list, dino)


// ─── GROUP FILTER ─────────────────────
if (m.isGroup && !isAdmins && !isOwner) {        
  const group = db.groups[m.chat] || {}  
  const senderJid = lidToJid(m.sender)    
  
  if ((group.blacklist || []).includes(senderJid)) {
    await dino.sendMessage(m.chat, {
      delete: {
        remoteJid:   m.chat,
        fromMe:      false,
        id:          m.key.id,
        participant: m.sender
      }
    }).catch(() => {})
    return
  }
if (group.mute) return  
}

// 𝗗𝗲𝘁𝗲𝗸𝘀𝗶 𝗚𝗮𝗺𝗲
const game = global.game?.[m.chat]
if (game && !isCmd) {
  const text = body.toLowerCase().trim()
  const isNyerah = /^nyerah$/i.test(text)

  // ─── Helper convert @lid → JID asli (pola sama seperti ttc) ───
  async function lidToJidGame(jid) {
    if (!jid) return jid
    if (!jid.endsWith('@lid')) return jid
    try {
      const meta = await dino.groupMetadata(m.chat)
      const found = meta.participants.find(p => p.lid === jid)
      return found?.jid || found?.id || jid
    } catch {
      return jid
    }
  }

  const senderJidGame = await lidToJidGame(m.sender)

  if (game.mode === "family100") {
    if (isNyerah) {
      clearTimeout(game.waktu)

      const sudahBenar = Object.entries(game.terjawab || {})
      const belumKetemu = game.jawaban

      let listBenar = sudahBenar.length
        ? sudahBenar.map(([jwb, jid]) => `${jwb} - @${jid.split('@')[0]}`).join('\n')
        : '(belum ada yang benar)'

      let listBelum = belumKetemu.length
        ? belumKetemu.map(j => `${j}`).join('\n')
        : '(semua sudah terjawab)'

      const mentionsNyerah = [...new Set([senderJidGame, ...sudahBenar.map(([, jid]) => jid)])]

      await dino.sendMessage(m.chat, {
        text: `_*⬣──▣ ${global.namabot} ▣──⬣*_

Nyerah!

Soal : ${game.soal}

Jawaban Benar:
${listBenar}

Belum Terjawab:
${listBelum}

Game dihentikan oleh @${senderJidGame.split('@')[0]}

_*⬣────────────⬣*_`,
        mentions: mentionsNyerah
      }, { quoted: m })

      delete global.game[m.chat]
      return
    }

    const index = game.jawaban.findIndex(j => text.includes(j))
    if (index !== -1) {
      const benar = game.jawaban.splice(index, 1)[0]

      if (!game.terjawab) game.terjawab = {}
      game.terjawab[benar] = senderJidGame

      await dino.sendMessage(m.chat, {
        text: `_*⬣──▣ ${global.namabot} ▣──⬣*_

Benar!

Jawaban : ${benar}
Dijawab : @${senderJidGame.split('@')[0]}
Sisa    : ${game.jawaban.length} jawaban lagi

Mantap! Lanjut cari lagi

_*⬣────────────⬣*_`,
        mentions: [senderJidGame]
      }, { quoted: m })

      if (game.jawaban.length === 0) {
        const semuaPenjawab = Object.entries(game.terjawab)
        let listFinal = semuaPenjawab
          .map(([jwb, jid]) => `${jwb} - @${jid.split('@')[0]}`).join('\n')

        await dino.sendMessage(m.chat, {
          text: `_*⬣──▣ ${global.namabot} ▣──⬣*_

Semua Jawaban Ketemu!

Soal : ${game.soal}

${listFinal}

Selamat! Semua jawaban Family 100 udah ketemu semua!
Hadiah : +${game.hadiah} poin

Kerja sama tim mantap!

_*⬣────────────⬣*_`,
          mentions: [...new Set(semuaPenjawab.map(([, jid]) => jid))]
        }, { quoted: m })
        delete global.game[m.chat]
      }
    }

  } else {
    if (isNyerah) {
      clearTimeout(game.waktu)
      await dino.sendMessage(m.chat, {
        text: `_*⬣──▣ ${global.namabot} ▣──⬣*_

Nyerah!

Soal    : ${game.soal || "-"}
Jawaban : ${game.jawaban}
Game    : ${game.type}

Nyerah oleh @${senderJidGame.split('@')[0]}
Semangat lagi di game berikutnya!

_*⬣────────────⬣*_`,
        mentions: [senderJidGame]
      }, { quoted: m })

      delete global.game[m.chat]
      return
    }

    if (text == game.jawaban) {
      const expReward = random(210, 250)
      const moneyReward = random(1, 5)
      addExp(m.sender, expReward)   // pakai addExp agar auto-levelup via rpg-levelling curve
      db.users[m.sender].money += moneyReward
      clearTimeout(game.waktu)
      await reply(`_*⬣──▣ ${global.namabot} ▣──⬣*_

Jawaban Benar!

Soal    : ${game.soal || "-"}
Jawaban : ${game.jawaban}
Game    : ${game.type}

Reward
EXP   : +${expReward}
Money : +${moneyReward}

Keren! Jawab lagi yuk

_*⬣────────────⬣*_`)

      delete global.game[m.chat]
    }
  }
}

if (await fiturGame.handleTTC(m, dino, isCmd, textLower)) return
if (await fiturGame.handleTebakBom(m, dino, body)) return

if (await fiturGame.handleJudiPvP(m, dino, isCmd, body)) return
  if (!isCmd) return

 if (!userSet.has(sender)) {
    userSet.add(sender)
    fs.writeFileSync(
      userPath,
      JSON.stringify([...userSet], null, 2)
    )    
  }

  addExp(m.sender, 5)
  
  console.log('\x1b[35m--------------------\x1b[0m')
  console.log(
    chalk.bgHex("#1e1e1e").hex("#b673ff").bold(`▢ New Command DINO X OFFICIAL`)
  )

  console.log(
  chalk.bgHex("#2b2b2b").hex("#d7d7d7")(
    `   ⌬ Tanggal: ${new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta'
    })} \n` +

    `   ⌬ Command: ${body.split(" ")[0]} \n` +
    `   ⌬ Argumen: ${body.split(" ").slice(1).join(" ") || "-"} \n` +
    `   ⌬ Pengirim: ${pushname} \n` +
    `   ⌬ JID: ${senderNumber}`
  )
)

  if (isGroup) {
      
      const groupAdmins = getGroupAdmins(participants)

/*  console.log('[DEBUG ADMIN] m.sender      :', m.sender)
  console.log('[DEBUG ADMIN] botNumber     :', botNumber)
  console.log('[DEBUG ADMIN] groupAdmins   :', groupAdmins)
  console.log('[DEBUG ADMIN] raw participants:', JSON.stringify(participants.map(p => ({ id: p.id, jid: p.jid, admin: p.admin })), null, 2))
*/
      
    console.log(
      chalk.bgHex("#2b2b2b").hex("#d7d7d7")(
        `   ⌬ Grup: ${groupName} \n` +
        `   ⌬ GroupJid: ${m.chat}`
      )
    )
  }

  console.log()
}

async function handleAntiAll(m, dino) {
  if (!m.chat.endsWith('@g.us')) return

  const group = db.groups[m.chat]
  const anti = db.antilink[m.chat]

  if (!group && !anti) return

  const metadata = await global.getGroupMetaSafe(dino, m.chat)
  const participants = metadata.participants || []

  const adminIds = participants
    .filter(p => p.admin !== null)
    .map(p => p.jid)

  const botId = dino.user.id.split(':')[0] + '@s.whatsapp.net'

  if (!adminIds.includes(botId)) return
  if (adminIds.includes(m.sender)) return
  if (metadata.owner && m.sender === metadata.owner) return

  const msg = m.message || {}

  const text =
    m.text ||
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    ""

  let shouldDelete = false
  let resendViewOnce = null

  // ===== ANTI LINK =====
  if (anti && text) {
    const kena =
      (anti.gc && /chat\.whatsapp\.com/i.test(text)) ||
      (anti.ch && /whatsapp\.com\/channel/i.test(text)) ||
      (anti.ig && /instagram\.com/i.test(text)) ||
      (anti.tg && /(t\.me|telegram\.me)/i.test(text)) ||
      (anti.tw && /(twitter\.com|x\.com)/i.test(text)) ||
      (anti.tt && /tiktok\.com/i.test(text)) ||
      (anti.fb && /facebook\.com/i.test(text)) ||
      (anti.all && /https?:\/\//i.test(text))

    if (kena) shouldDelete = true
  }

  // ===== ANTI GROUP FEATURE =====
  if (group) {

    if (group.antisticker && msg.stickerMessage) {
      shouldDelete = true
    } else if (group.antimediapic && msg.imageMessage) {
      shouldDelete = true
    } else if (group.antimediavid && msg.videoMessage) {
      shouldDelete = true
    } else if (group.antivoice && msg.audioMessage?.ptt) {
      shouldDelete = true
    } else if (group.antidocument && msg.documentMessage) {
      shouldDelete = true
    }

    // ===== ANTI VIEW ONCE =====
    else if (group.antiviewonce && (
      msg.viewOnceMessage ||
      msg.viewOnceMessageV2 ||
      msg.imageMessage?.viewOnce ||
      msg.videoMessage?.viewOnce ||
      msg.stickerMessage?.viewOnce ||
      msg.documentMessage?.viewOnce
    )) {
      let content

      if (msg.viewOnceMessage?.imageMessage) content = msg.viewOnceMessage.imageMessage
      else if (msg.viewOnceMessage?.videoMessage) content = msg.viewOnceMessage.videoMessage
      else if (msg.viewOnceMessage?.stickerMessage) content = msg.viewOnceMessage.stickerMessage
      else if (msg.viewOnceMessage?.documentMessage) content = msg.viewOnceMessage.documentMessage
      else content = msg.imageMessage || msg.videoMessage || msg.stickerMessage || msg.documentMessage

      if (content?.viewOnce) delete content.viewOnce
      resendViewOnce = content
    }

    // ===== ANTI TOXIC =====
    if (group.antitoxic && text) {

      const normalize = (str) => {
        return str
          .toLowerCase()
          .replace(/[0]/g, 'o')
          .replace(/[1]/g, 'i')
          .replace(/[3]/g, 'e')
          .replace(/[4]/g, 'a')
          .replace(/[5]/g, 's')
          .replace(/[7]/g, 't')
          .replace(/[^a-z]/g, '')
          .replace(/(.)\1+/g, '$1')
      }

      const cleanText = normalize(text)
      const detected = toxicList.find(word => cleanText.includes(word))

      if (detected) {

        // ✅ HAPUS LANGSUNG (CEPAT)
        await dino.sendMessage(m.chat, {
          delete: {
            remoteJid: m.chat,
            fromMe: false,
            id: m.key.id,
            participant: m.sender
          }
        })

        // ✅ NOTIF BELAKANGAN (TANPA BLOCK)
        delay(2300).then(() => {
          dino.sendMessage(m.chat, {
            text: `🚫 *ANTI TOXIC SYSTEM*

Pesan dari @${m.sender.split("@")[0]} terdeteksi mengandung kata tidak pantas.

⚠️ *Sistem Proteksi Aktif*
Harap jaga etika dalam grup ini.`,
            mentions: [m.sender]
          })
        })

        return
      }
    }
  }

// ===== ANTI TAG STATUS (WHATSAPP STORY MENTION) =====
  if (group && msg.groupStatusMentionMessage) {

    if (group.antitagsw) {
      shouldDelete = true
    }

    if (group.antitagswkick) {
      const pelaku = m.sender

      await dino.sendMessage(m.chat, {
        delete: {
          remoteJid: m.chat,
          fromMe: false,
          id: m.key.id,
          participant: m.sender
        }
      })

      try {
        await dino.groupParticipantsUpdate(m.chat, [pelaku], 'remove')
      } catch (e) {
        console.log('[AntiTagSwKick] Gagal kick:', e?.message)
      }

      delay(1000).then(() => {
        dino.sendMessage(m.chat, {
          text: `🚫 *ANTI TAG STATUS*\n\n@${pelaku.split('@')[0]} telah ditendang karena menandai grup ini di status WhatsApp.`,
          mentions: [pelaku]
        })
      })

      return
    }
  }
  
  // ===== EKSEKUSI DELETE LAIN =====
  if (shouldDelete) {
    await dino.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: false,
        id: m.key.id,
        participant: m.sender
      }
    })
    return
  }

  // ===== RESEND VIEW ONCE =====
  if (resendViewOnce) {
    await dino.sendMessage(m.chat, {
      [Object.keys(resendViewOnce)[0]]: resendViewOnce[Object.keys(resendViewOnce)[0]]
    })
  }
}


//============= [ 𝘾𝙤𝙢𝙢𝙖𝙣𝙙𝙨 ] ========================= \\

// === Dynamic Menu Dispatch ===
// Auto-generate menu commands dari nama file di lib/fitur/
// Contoh: downloader.js → .menudownloader, .downloadermenu
{
  const MENU_IGNORE = ['menu.js']
  const fitursDir = path.join(__dirname, './lib/fitur')
  const categoryFiles = fs.readdirSync(fitursDir)
    .filter(f => f.endsWith('.js') && !MENU_IGNORE.includes(f))
    // 1-main.js tetap dipanggil dengan .menumain; "1-" hanya mengatur urutan.
    .map(f => f.replace(/\.js$/, '').replace(/^\d+[-_]/, '').toLowerCase())

  const staticMenuCmds = ['menu', 'allmenu', 'menuall', 'menuutama']

  const isMenuCommand =
    staticMenuCmds.includes(command) ||
    categoryFiles.some(cat =>
      command === `menu${cat}` ||
      command === `${cat}menu` ||
      command.startsWith(`menu${cat}`) // submenu: .menurpgpet, .menurpgabsen, dll
    )

  if (isMenuCommand) {
    return await fiturMenu(command, ctx)
  }
}

switch (command) {



case 'backupsxxxxx': {
//   if (!isOwner) return reply(mess.owner)

    await reply("📦 Sedang membuat backup bot...")

    const { execSync } = require("child_process")
    const fs = require("fs")

    // Buat folder backup jika belum ada
    if (!fs.existsSync("./backup")) {
        fs.mkdirSync("./backup")
    }

    const now = new Date()
    const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    })

    const parts = formatter.formatToParts(now)
    const formatDate = `${parts[4].value}-${parts[2].value}-${parts[0].value}_${parts[6].value}-${parts[8].value}-${parts[10].value}`

    const backupFileName = `Project-Ayan-Dino_${formatDate}.zip`

    const files = execSync("ls")
        .toString()
        .split("\n")
        .filter(file =>
            file &&
            file !== "node_modules" &&
            file !== "session" &&
            file !== "backup" &&
            file !== "package-lock.json" &&
            file !== "yarn.lock"
        )

    // Simpan ZIP ke folder backup
    execSync(`zip -r ./backup/${backupFileName} ${files.join(" ")}`)

    reply(`✅ Backup berhasil dibuat!

📂 Lokasi:
./backup/${backupFileName}`)

}
break


// ==================== [ 𝘽𝙖𝙩𝙖𝙨 𝙁𝙞𝙩𝙪𝙧 ] ==================== \\
default: {
  for (const [name, handler] of fiturHandlers) {
    if (name === 'menu') continue
    const result = await handler(command, ctx)
    if (result !== undefined) return result
  }
}
}
} catch (err) {
console.log(require("util").format(err));
}
};


let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log('\x1b[0;32mUpdate File:\x1b[0m ' + __filename)
  delete require.cache[file]
  require(file)
})