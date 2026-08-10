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

    case 'terima': 'menu'; {
      /* CONSTANTS */

      /* HELPER */

      /* HANDLER */
      // Ambil target dari mention atau reply
      let target
      if (m.mentionedJid && m.mentionedJid.length > 0) {
        target = m.mentionedJid[0]
      } else if (m.quoted) {
        target = m.quoted.sender
      }

      if (!target) {
        return usage(
          'Mention atau reply pesan yang mengajak!',
          '@user',
          'Menerima ajakan berpacaran',
          ['@6281234567890']
        )
      }

      if (target === m.sender) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Tidak Bisa!*
│
│ Kamu tidak bisa menerima ajakan dari diri sendiri.`),
          { mentions: [m.sender] }
        )
      }

      if (target === (dino.user?.jid || botNumber)) {
        return sendWithTemplate(
          dino, m,
          decorate(`*🤖 Tidak Bisa!*
│
│ Kamu tidak bisa berpacaran dengan bot.`),
          { mentions: [m.sender] }
        )
      }

      if (typeof global.db.data.users[target] === 'undefined') {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Target Tidak Terdaftar!*
│
│ Target belum terdaftar dalam database.
│ Minta target untuk registrasi terlebih dahulu.`),
          { mentions: [m.sender] }
        )
      }

      const dbTarget = global.db.data.users[target]

      if (dbTarget.pasangan !== m.sender) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Belum Ditembak!*
│
│ @${target.split('@')[0]} tidak sedang mengajak kamu berpacaran.
│
│ Pastikan orang tersebut sudah menembak kamu dulu.`),
          { mentions: [m.sender, target] }
        )
      }

      global.db.data.users[m.sender].pasangan = target

      return sendWithTemplate(
        dino, m,
        decorate(`*🎉 Selamat! Resmi Berpacaran!*
│
│ Kamu dan @${target.split('@')[0]} resmi berpacaran! 💕
│
│ Semoga hubungan @${target.split('@')[0]} ♡ @${m.sender.split('@')[0]} langgeng dan penuh kebahagiaan.`),
        { react: true, reactDone: '💕', mentions: [m.sender, target] }
      )
    }

  }
}