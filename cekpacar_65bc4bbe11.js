const { sendWithTemplate } = require('../../../sendWithTemplate')

module.exports = async (command, ctx) => {
  const {
    dino, m, chat, from, text, q, args, body, reply, quoted, qmsg, mime, isMedia,
    sender, senderNumber, botNumber, isOwner, isCreator, pushname,
    isGroup, isPrivate, groupMetadata, groupName, participants,
    groupAdmins, groupMembers, isGroupAdmins, isBotGroupAdmins, isAdmins, isBotAdmins,
    db, user, group, prefix, react
  } = ctx

  const namabot = dino.config?.namabot || global.namabot || 'Bot'
  const usedPrefix = prefix || '.'

  const decorate = content => `⬣─▣[ ${namabot} ]▣─⬣
│
${content}
▣──⬣`

  const usage = (problem, argHint, desc, examples = []) => {
    const contoh = examples.map(ex => `│ • ${usedPrefix + command} ${ex}`).join('\n')
    const teks = decorate(`*Ups! ${problem}*
│
│ _*Gunakan format:*_
│ ${usedPrefix + command} ${argHint}
│
│ \`\`\`${desc}\`\`\`
│
│ Contoh:
${contoh}`)
    return sendWithTemplate(dino, m, teks, { react: false, mentions: [m.sender] })
  }

  switch (command) {

    case 'cekpacar': 'menu'; {
      /* CONSTANTS */

      /* HELPER */

      /* HANDLER */
      // Target: reply, mention, atau diri sendiri
      let target, orang
      if (m.quoted?.sender) {
        target = m.quoted.sender
        orang = 'Pengguna yang kamu reply'
      } else if (m.mentionedJid?.length) {
        target = m.mentionedJid[0]
        orang = 'Pengguna yang kamu mention'
      } else {
        target = m.sender
        orang = 'Kamu'
      }

      if (typeof global.db.data.users[target] === 'undefined') {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Tidak Terdaftar!*
│
│ Pengguna tersebut belum terdaftar dalam database.
│ Minta untuk registrasi terlebih dahulu.`),
          { mentions: [m.sender] }
        )
      }

      const dbTarget = global.db.data.users[target]
      const pasangan = dbTarget.pasangan

      // Tidak punya pasangan
      if (pasangan === '') {
        return sendWithTemplate(
          dino, m,
          decorate(`*💭 Status Hubungan*
│
│ ${orang} saat ini tidak memiliki pasangan dan tidak sedang mengajak siapapun.
│
│ ➤ *${usedPrefix}tembak @user* untuk mengajak seseorang berpacaran.`),
          { mentions: [m.sender] }
        )
      }

      // Pasangan tidak ada di DB
      if (typeof global.db.data.users[pasangan] === 'undefined') {
        return sendWithTemplate(
          dino, m,
          decorate(`*⚠️ Data Pasangan Tidak Ditemukan*
│
│ Pasangan dari pengguna tersebut tidak terdaftar dalam database.`),
          { mentions: [m.sender] }
        )
      }

      // Masih nunggu balasan (belum jadian)
      if (global.db.data.users[pasangan].pasangan !== target) {
        return sendWithTemplate(
          dino, m,
          decorate(`*⏳ Status Hubungan*
│
│ ${orang} sedang menunggu jawaban dari @${pasangan.split('@')[0]}.
│
│ Ajakan berpacaran belum mendapat balasan.
│ Bisa pakai *${usedPrefix}ikhlasin* untuk membatalkan ajakan.`),
          { mentions: [m.sender, pasangan] }
        )
      }

      // Resmi berpacaran
      return sendWithTemplate(
        dino, m,
        decorate(`*💕 Status Hubungan*
│
│ ${orang} sedang menjalin hubungan dengan @${pasangan.split('@')[0]}.
│
│ Semoga langgeng dan bahagia selalu! 💑`),
        { mentions: [m.sender, pasangan] }
      )
    }

  }
}