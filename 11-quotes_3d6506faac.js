const { sendWithTemplate } = require('../sendWithTemplate')
const fs   = require('fs')
const path = require('path')

// Load quotes dari file JSON
let quotesData = {}
try {
  quotesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../database/quotes.json'), 'utf-8'))
} catch (e) {
  console.error('Error loading quotes:', e.message)
  quotesData = { islami: [], motivasi: [], psikologi: [], programmer: [], bucin: [], bacot: [] }
}

function getRandom(arr) {
  if (!arr || arr.length === 0) return 'Quote tidak tersedia'
  return arr[Math.floor(Math.random() * arr.length)]
}

module.exports = async (command, ctx) => {
  const {
    dino, m, chat, from, text, q, args, body, reply, quoted, qmsg, mime, isMedia,
    sender, senderNumber, botNumber, isOwner, isCreator, pushname,
    isGroup, isPrivate, groupMetadata, groupName, participants,
    groupAdmins, groupMembers, isGroupAdmins, isBotGroupAdmins, isAdmins, isBotAdmins,
    db, user, group, prefix, react
  } = ctx

  const namabot = dino.config?.namabot || global.namabot || 'Bot'

  const decorate = content => `⬣─▣[ ${namabot} ]▣─⬣\n│\n${content}\n▣──⬣`

  switch (command) {


// ─────────────────────────────────────────────────────
case 'quotespsikologi':
case 'quotespsikolog': 'menu'; {
  const quote = getRandom(quotesData.psikologi)
  return sendWithTemplate(dino, m, decorate(`│ 🧠 *QUOTES PSIKOLOGI*\n│\n│ "${quote}"`), { mentions: [m.sender] })
}
break

  }
}