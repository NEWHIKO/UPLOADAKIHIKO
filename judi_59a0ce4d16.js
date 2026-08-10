const { sendWithTemplate } = require('../../sendWithTemplate')

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

    case 'judi': 'menu'; {
      /* CONSTANTS */
      const COOLDOWN = 5000 // 5 detik

      /* HELPER */
      const dbUser = global.db.data.users[m.sender]
      const fmt = (n) => (n || 0).toLocaleString('id-ID')

      function clockString(ms) {
        let h = Math.floor(ms / 3600000)
        let m = Math.floor(ms / 60000) % 60
        let s = Math.floor(ms / 1000) % 60
        return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
      }

      /* HANDLER */
      // Mutex per chat — cegah race condition
      dino.judi = dino.judi || {}
      if (m.chat in dino.judi) {
        return sendWithTemplate(
          dino, m,
          decorate(`*⏳ Sedang Ada Permainan!*
│
│ Masih ada yang melakukan judi di sini.
│ Tunggu sampai selesai dulu ya!`),
          { mentions: [m.sender] }
        )
      }

      dino.judi[m.chat] = true

      try {
        // Cooldown check
        const elapsed = Date.now() - (dbUser.judilast || 0)
        if (elapsed < COOLDOWN) {
          const sisa = clockString(COOLDOWN - elapsed)
          return sendWithTemplate(
            dino, m,
            decorate(`*⏳ Cooldown Judi!*
│
│ Kamu baru saja melakukan judi.
│ Tunggu *${sisa}* lagi untuk bermain kembali.`),
            { mentions: [m.sender] }
          )
        }

        if (!args[0]) {
          return usage(
            'Masukkan jumlah taruhan!',
            '<jumlah|all>',
            'Masukkan angka atau "all" untuk bertaruh semua uang',
            ['1000', '50000', 'all']
          )
        }

        dbUser.judilast = Date.now()

        let taruhan = /^all$/i.test(args[0])
          ? Math.floor(dbUser.money || 0)
          : parseInt(args[0])

        if (isNaN(taruhan) || taruhan <= 0) {
          return usage(
            'Jumlah taruhan tidak valid!',
            '<jumlah|all>',
            'Gunakan angka positif atau "all" untuk bertaruh semua uang',
            ['1000', '50000', 'all']
          )
        }

        if ((dbUser.money || 0) < taruhan) {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ Uang Tidak Cukup!*
│
│ 💰 Money kamu : *${fmt(dbUser.money)}*
│ 🎲 Taruhan    : *${fmt(taruhan)}*
│ ❌ Kurang     : *${fmt(taruhan - (dbUser.money || 0))}*`),
            { mentions: [m.sender] }
          )
        }

        const rollBot    = Math.floor(Math.random() * 101) // 0–100
        const rollPlayer = Math.floor(Math.random() * 75)  // 0–74

        dbUser.money -= taruhan

        if (rollBot > rollPlayer) {
          // Kalah
          return sendWithTemplate(
            dino, m,
            decorate(`*🎲 HASIL JUDI*
│
│ 🤖 Bot roll   : *${rollBot}*
│ 🎮 Kamu roll  : *${rollPlayer}*
│
│ 💸 Kamu *KALAH!*
│ Uangmu berkurang *${fmt(taruhan)}* money.
│
│ 💰 Sisa Money : *${fmt(dbUser.money)}*`),
            { react: true, reactDone: '💸', mentions: [m.sender] }
          )
        } else if (rollPlayer > rollBot) {
          // Menang
          dbUser.money += taruhan * 2
          return sendWithTemplate(
            dino, m,
            decorate(`*🎲 HASIL JUDI*
│
│ 🤖 Bot roll   : *${rollBot}*
│ 🎮 Kamu roll  : *${rollPlayer}*
│
│ 🎉 Kamu *MENANG!*
│ Kamu mendapatkan *+${fmt(taruhan * 2)}* money.
│
│ 💰 Total Money : *${fmt(dbUser.money)}*`),
            { react: true, reactDone: '🎉', mentions: [m.sender] }
          )
        } else {
          // Seri
          dbUser.money += taruhan
          return sendWithTemplate(
            dino, m,
            decorate(`*🎲 HASIL JUDI*
│
│ 🤖 Bot roll   : *${rollBot}*
│ 🎮 Kamu roll  : *${rollPlayer}*
│
│ 🤝 Kamu *SERI!*
│ Uangmu kembali *${fmt(taruhan)}* money.
│
│ 💰 Total Money : *${fmt(dbUser.money)}*`),
            { react: true, reactDone: '🤝', mentions: [m.sender] }
          )
        }
      } catch (e) {
        console.error(e)
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Terjadi Kesalahan!*
│
│ Coba lagi nanti.`),
          { mentions: [m.sender] }
        )
      } finally {
        delete dino.judi[m.chat]
      }
    }

  }
}