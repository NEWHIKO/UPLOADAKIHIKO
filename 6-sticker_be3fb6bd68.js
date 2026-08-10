const fs    = require('fs')
const axios = require('axios')
const { exec } = require('child_process')
const { createCanvas, loadImage } = require('canvas')
const fetch = require('node-fetch')

const { sendWithTemplate } = require('../sendWithTemplate')

// ── Helper functions (stateless, di luar module) ──────────────────────────────

const getBuffer = async (url) => {
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 })
    return res.data
  } catch (e) {
    return null
  }
}

const fetchJson = async (url) => {
  try {
    const res = await axios.get(url)
    return res.data
  } catch (e) {
    return null
  }
}

const addExif = async (buffer, packname, author) => {
  try {
    const StickerConvert = require('sticker-convert')
    return await StickerConvert(buffer, { pack: packname, author })
  } catch (e) {
    return buffer
  }
}

const videoToWebp = async (buffer) => {
  try {
    const tmp = `./media/sampah/${Date.now()}.mp4`
    const out = `./media/sampah/${Date.now()}.webp`
    fs.writeFileSync(tmp, buffer)
    await new Promise((resolve, reject) => {
      exec(`ffmpeg -i "${tmp}" -vcodec libvpx -q:v 80 "${out}"`, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
    const result = fs.readFileSync(out)
    fs.unlinkSync(tmp)
    fs.unlinkSync(out)
    return result
  } catch (e) {
    return buffer
  }
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = async (command, ctx) => {
  const {
    dino, m, chat, from, text, q, args, body, reply, quoted, qmsg, mime, isMedia,
    sender, senderNumber, botNumber, isOwner, isCreator, pushname,
    isGroup, isPrivate, groupMetadata, groupName, participants,
    groupAdmins, groupMembers, isGroupAdmins, isBotGroupAdmins, isAdmins, isBotAdmins,
    db, user, group, prefix, react
  } = ctx

  const namabot    = dino.config?.namabot || global.namabot || 'Bot'
  const usedPrefix = prefix || '.'

  const decorate = content => `⬣─▣[ ${namabot} ]▣─⬣\n│\n${content}\n▣──⬣`

  const usage = (problem, argHint, desc, examples = []) => {
    const contoh = examples.map(ex => `│ • ${usedPrefix + command} ${ex}`).join('\n')
    const teks = decorate(
      `*Ups! ${problem}*\n│\n│ _*Gunakan format:*_\n│ ${usedPrefix + command} ${argHint}\n│\n│ \`\`\`${desc}\`\`\`\n│\n│ Contoh:\n${contoh}`
    )
    return sendWithTemplate(dino, m, teks, { react: false, mentions: [m.sender] })
  }

  switch (command) {

// ─────────────────────────────────────────────────────
case 'st':
case 'brat': 'menu'; {
  if (!q) return usage(
    'Teks belum dimasukkan!',
    '<teks>',
    'Buat sticker bergaya brat dari teks yang kamu masukkan',
    ['Vionyx ID', 'dino is here', 'やん']
  )

  await react('⏳')

  const _apisBrat = [
    `https://api.nexray.eu.cc/maker/brat?text=${encodeURIComponent(q)}`,
    `https://brat.akihiko.my.id/?text=${encodeURIComponent(q)}`
  ]

  let _mediaBrat = null
  for (const _urlBrat of _apisBrat) {
    try {
      const _buf = await Promise.race([
        getBuffer(_urlBrat),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000))
      ])
      if (_buf && _buf.length > 1000) { _mediaBrat = _buf; break }
    } catch {}
  }

  if (!_mediaBrat) {
    await react('❌')
    return sendWithTemplate(dino, m, decorate(`│ ❌ Semua server sedang error, silakan coba lagi nanti.`), { mentions: [m.sender] })
  }

  try {
    await dino.sendImageAsSticker(m.chat, _mediaBrat, m, { packname: global.packname, author: global.author })
    await react('✅')
  } catch (e) {
    console.error('[Brat]', e)
    await react('❌')
    return sendWithTemplate(dino, m, decorate(`│ ❌ Terjadi error saat membuat sticker.`), { mentions: [m.sender] })
  }
}
break

  }
}