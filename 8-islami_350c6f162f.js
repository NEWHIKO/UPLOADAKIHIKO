const { sendWithTemplate } = require('../sendWithTemplate')
const fs   = require('fs')

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
case 'doaharian': 'menu'; {
  try {
    const _srcDoa  = JSON.parse(fs.readFileSync('./lib/database/doaharian.json', 'utf-8'))
    const _caption = _srcDoa.map((v, i) =>
      `│ *${i + 1}. ${v.title}*\n│\n│ ❃ Latin: ${v.latin}\n│ ❃ Arab: ${v.arabic}\n│ ❃ Terjemah: ${v.translation}`
    ).join('\n│\n')
    return sendWithTemplate(dino, m, decorate(`│ 🤲 *DOA HARIAN*\n│\n${_caption}`), { mentions: [m.sender] })
  } catch (e) {
    return sendWithTemplate(dino, m, decorate(`│ ❌ File database doa harian tidak ditemukan.`), { mentions: [m.sender] })
  }
}
break



  }
}