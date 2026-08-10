const fs = require('fs')
const path = require('path')
const { sendWithTemplate } = require('../sendWithTemplate')
const { generateWAMessageFromContent, prepareWAMessageMedia} = require('@whiskeysockets/baileys')


// text_welcome.json dan welcome_status.json tidak lagi dipakai —
// semua data welcome/goodbye disimpan di global.db.groups via userHelper.js

const introPath = path.join(__dirname, '../database/intro.json')

let introDB = {}
if (fs.existsSync(introPath)) {
  introDB = JSON.parse(fs.readFileSync(introPath, 'utf-8'))
}

const saveIntro = () => {
  fs.writeFileSync(introPath, JSON.stringify(introDB, null, 2), 'utf-8')
}



function lidToJid(jid, participants = []) {
  if (!jid?.endsWith('@lid')) return jid
  const p = participants.find(p => p.lid === jid || p.id === jid)
  return p?.jid || jid
}

function _toggleFeature(db, m, key, label, subkey = null) {
  const target = subkey ? db[subkey]?.[m.chat] : db.groups[m.chat]
  if (!target) return null
  return { target, label, key }
}


module.exports = async (command, ctx) => {
  const {
    dino, m, chat, from, text, q, args, body, reply, quoted, qmsg, mime, isMedia,
    sender, senderNumber, botNumber, isOwner, isCreator, pushname,
    isGroup, isPrivate, groupMetadata, groupName, participants,
    groupAdmins, groupMembers, isGroupAdmins, isBotGroupAdmins, isAdmins, isBotAdmins,
    db, user, group, prefix, react
  } = ctx

  // ─── CONFIG & CONSTANTS ────────────────────────────────────────
  const namabot    = dino.config?.namabot || global.namabot || 'Bot'
  const usedPrefix = prefix || '.'
  const mess       = dino.config?.mess || global.mess || {}

  // ─── DECORATORS & HELPERS ─────────────────────────────────────
  const decorate = content => `⬣─▣[ ${namabot} ]▣─⬣\n│\n${content}\n▣──⬣`

  const usage = (problem, argHint, desc, examples = []) => {
    const contoh = examples.map(ex => `│ • ${usedPrefix + command} ${ex}`).join('\n')
    const teks = decorate(
      `*Ups! ${problem}*\n│\n│ _*Gunakan format:*_\n│ ${usedPrefix + command} ${argHint}\n│\n│ \`\`\`${desc}\`\`\`\n│\n│ Contoh:\n${contoh}`
    )
    return sendWithTemplate(dino, m, teks, { react: false, mentions: [m.sender] })
  }

  const _resolveTarget = (fallbackError) => {
    if (m.mentionedJid?.[0]) return { target: lidToJid(m.mentionedJid[0], participants), err: null }
    if (m.quoted) return { target: lidToJid(m.quoted.sender, participants), err: null }
    if (text) {
      const nomor = text.replace(/[^0-9]/g, '')
      if (!nomor) return { target: null, err: 'Nomor tidak valid!' }
      const jid = nomor.startsWith('62')
        ? nomor + '@s.whatsapp.net'
        : '62' + nomor.slice(1) + '@s.whatsapp.net'
      return { target: jid, err: null }
    }
    return { target: null, err: fallbackError }
  }

  switch (command) {

case 'dor':
case 'kick': 'menu'; {
  if (!isGroup) return reply(mess.group)
  if (!isGroupAdmins && !isOwner) return reply(mess.admin)
  if (!isBotAdmins) return reply(mess.botadmin)

  const { target: _targetKick, err: _errKick } = _resolveTarget('Target belum ditentukan!')
  if (_errKick) return sendWithTemplate(dino, m, decorate(`│ ❌ ${_errKick}`), { mentions: [m.sender] })
  if (!_targetKick) return usage(
    'Tag atau reply user yang ingin di-kick!',
    '@tag / nomor / (reply pesan)',
    'Keluarkan user dari grup',
    ['@tag', '628123456789']
  )

  try {
    await dino.groupParticipantsUpdate(m.chat, [_targetKick], 'remove')
  } catch (e) {
    console.error('[Kick]', e)
    return sendWithTemplate(dino, m, decorate(`│ ❌ Terjadi kesalahan saat mengeluarkan user.`), { mentions: [m.sender] })
  }
}
break


  }
}