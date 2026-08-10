const { sendWithTemplate } = require('../sendWithTemplate')
const emojiRegex = require('emoji-regex')
const fs = require('fs');
const {
  spawn,
  exec,
  webp2mp4File,
  execSync
} = require('child_process');


module.exports = async (command, ctx) => {
  const {
    dino, m, chat, from, text, q, args, body, reply, quoted, qmsg, mime, isMedia,
    sender, senderNumber, botNumber, isOwner, isCreator, pushname,
    isGroup, isPrivate, groupMetadata, groupName, participants,
    groupAdmins, groupMembers, isGroupAdmins, isBotGroupAdmins, isAdmins, isBotAdmins,
    db, user, group, prefix, react
  } = ctx

  const namabot  = dino.config?.namabot || global.namabot || 'Bot'
  const usedPrefix = prefix || '.'

  const decorate = content => `⬣─▣[ ${namabot} ]▣─⬣\n│\n${content}\n▣──⬣`

  const usage = (problem, argHint, desc, examples = []) => {
    const contoh = examples.map(ex => `│ • ${usedPrefix + command} ${ex}`).join('\n')
    const teks = decorate(
      `*Ups! ${problem}*\n│\n│ _*Gunakan format:*_\n│ ${usedPrefix + command} ${argHint}\n│\n│ \`\`\`${desc}\`\`\`\n│\n│ Contoh:\n${contoh}`
    )
    return sendWithTemplate(dino, m, teks, { react: false, mentions: [m.sender] })
  }

  function randomName(len = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < len; i++) result += chars[Math.floor(Math.random() * chars.length)]
    return result
  }

  function bufferToBase64DataUrl(buffer, contentType = 'image/jpeg') {
    return `data:${contentType};base64,${buffer.toString('base64')}`
  }

  switch (command) {

case 'liat':
    case 'rvo': 'menu'; {
      if (!m.quoted) return usage(
        'Tidak ada pesan yang di-reply!',
        '',
        'Reply pesan sekali lihat lalu ketik perintah ini',
        ['(reply foto/video sekali lihat)']
      )

      const _qLiat = m.quoted
      const _mimeLiat = (_qLiat.msg || _qLiat).mimetype || ''

      if (!_mimeLiat) return usage(
        'Pesan yang di-reply bukan media sekali lihat!',
        '',
        'Reply pesan sekali lihat (foto/video) lalu ketik perintah ini',
        ['(reply foto/video sekali lihat)']
      )

      const isViewOnce = _qLiat.msg?.viewOnce || _qLiat.viewOnce || false
      if (!isViewOnce) return sendWithTemplate(dino, m, decorate(
        `│ ❌ Pesan tersebut bukan pesan sekali lihat.
│ Reply pesan yang ada ikon 👁️ sekali lihat.`
      ), { mentions: [m.sender] })

      const media = await _qLiat.download()
      if (!media) return sendWithTemplate(dino, m, decorate(`│ ❌ Gagal mengunduh media. Coba lagi.`), { mentions: [m.sender] })

      await dino.sendFile(m.chat, media, 'media.' + _mimeLiat.split('/')[1], _qLiat.text || '', m)
    }
    break

  }
}