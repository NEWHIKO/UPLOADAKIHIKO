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

    case 'tembak': 'menu'; {
      /* CONSTANTS */

      /* HELPER */
      function format(num) {
        const n = String(num), p = n.indexOf('.')
        return n.replace(/\d(?=(?:\d{3})+(?:\.|$))/g, (m, i) => p < 0 || i < p ? `${m},` : m)
      }

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
          'Mention atau reply pesan target!',
          '@user',
          'Mengajak seseorang berpacaran',
          ['@6281234567890']
        )
      }

      if (target === m.sender) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Tidak Bisa!*
│
│ Kamu tidak bisa mengajak diri sendiri berpacaran.`),
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

      const dbSender = global.db.data.users[m.sender]
      const dbTarget = global.db.data.users[target]

      // Sender masih nunggu jawaban dari orang lain
      if (
        dbSender.pasangan !== '' &&
        global.db.data.users[dbSender.pasangan]?.pasangan !== m.sender
      ) {
        return sendWithTemplate(
          dino, m,
          decorate(`*⏳ Masih Menunggu Jawaban!*
│
│ Kamu masih punya ajakan yang belum dijawab oleh @${dbSender.pasangan.split('@')[0]}.
│
│ Tunggu dulu atau gunakan *${usedPrefix}ikhlasin* untuk membatalkan.`),
          { mentions: [m.sender, dbSender.pasangan] }
        )
      }

      // Sender sudah punya pasangan dan mau tembak orang lain → denda
      if (
        dbSender.pasangan !== '' &&
        global.db.data.users[dbSender.pasangan]?.pasangan === m.sender &&
        dbSender.pasangan !== target
      ) {
        const denda = Math.ceil((dbSender.exp / 1000) * 20)
        dbSender.exp -= denda
        return sendWithTemplate(
          dino, m,
          decorate(`*💔 Kamu Sudah Punya Pasangan!*
│
│ Kamu sudah berpacaran dengan @${dbSender.pasangan.split('@')[0]}.
│
│ Putus dulu pakai *${usedPrefix}putus* sebelum tembak @${target.split('@')[0]}.
│
│ ⚠️ *Denda ketidaksetiaan:* *-${format(denda)} EXP* (20%)`),
          { mentions: [m.sender, target, dbSender.pasangan] }
        )
      }

      // Target sudah punya pasangan aktif → denda
      if (dbTarget.pasangan !== '') {
        const pacar = dbTarget.pasangan
        if (global.db.data.users[pacar]?.pasangan === target) {
          // target resmi berpacaran dgn orang lain
          if (m.sender === pacar && dbSender.pasangan === target) {
            // edge case: sender IS the pacar
            const denda = Math.ceil((dbSender.exp / 1000) * 20)
            dbSender.exp -= denda
            return sendWithTemplate(
              dino, m,
              decorate(`*💕 Kamu Sudah Berpacaran!*
│
│ Kamu sudah berpacaran dengan @${target.split('@')[0]}.
│
│ ⚠️ *Denda:* *-${format(denda)} EXP* (20%)`),
              { mentions: [m.sender, target] }
            )
          }
          const denda = Math.ceil((dbSender.exp / 1000) * 20)
          dbSender.exp -= denda
          return sendWithTemplate(
            dino, m,
            decorate(`*💔 Target Sudah Ada yang Punya!*
│
│ @${target.split('@')[0]} sudah berpacaran dengan @${pacar.split('@')[0]}.
│
│ Cari pasangan lain ya!
│
│ ⚠️ *Denda:* *-${format(denda)} EXP* (20%)`),
            { mentions: [m.sender, target, pacar] }
          )
        }
      }

      // Target sudah tembak sender duluan → langsung jadian
      if (dbTarget.pasangan === m.sender) {
        dbSender.pasangan = target
        return sendWithTemplate(
          dino, m,
          decorate(`*🎉 Selamat! Resmi Berpacaran!*
│
│ Kamu dan @${target.split('@')[0]} resmi berpacaran! 💕
│
│ Semoga hubungan kalian langgeng dan penuh kebahagiaan.`),
          { react: true, reactDone: '💕', mentions: [m.sender, target] }
        )
      }

      // Normal: kirim ajakan
      dbSender.pasangan = target
      return sendWithTemplate(
        dino, m,
        decorate(`*💌 Ajakan Berpacaran Terkirim!*
│
│ Kamu telah mengajak @${target.split('@')[0]} untuk berpacaran.
│ Silakan tunggu balasannya.
│
│ *Perintah untuk target:*
│ • Terima : *${usedPrefix}terima @user*
│ • Tolak  : *${usedPrefix}tolak @user*
│
│ Kalau tidak ada jawaban, pakai *${usedPrefix}ikhlasin* untuk batalkan.`),
        { react: true, reactDone: '💌', mentions: [m.sender, target] }
      )
    }

  }
}