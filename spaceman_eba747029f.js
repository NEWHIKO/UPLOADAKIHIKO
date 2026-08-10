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

    case 'spaceman': 'menu'; {
      /* CONSTANTS */
      const GAME_TIMEOUT  = 5 * 60 * 1000 // 5 menit max per game
      const MAX_BET       = 500000
      const MAX_MULTIPLIER = 5.0

      /* HELPER */
      const dbUser = global.db.data.users[m.sender]
      const fmt = (n) => (n || 0).toLocaleString('id-ID')

      function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

      /* HANDLER */
      if (!args[0]) {
        return usage(
          'Masukkan jumlah taruhan!',
          '<jumlah>',
          'Taruhan maksimal 500.000',
          ['10000', '100000', '500000']
        )
      }

      // BUG #6 FIX: cek dan refund game zombie dari sesi sebelumnya
      if (dbUser.spacemanActive && dbUser.spacemanBet > 0) {
        const elapsed = Date.now() - (dbUser.spacemanStartTime || 0)
        if (elapsed > GAME_TIMEOUT) {
          const refund = dbUser.spacemanBet
          dbUser.money = (dbUser.money || 0) + refund
          dbUser.spacemanActive = false
          dbUser.spacemanBet = 0
          dbUser.spacemanStartTime = 0
          await sendWithTemplate(
            dino, m,
            decorate(`*⚠️ Refund Otomatis!*
│
│ Game spaceman sebelumnya tidak selesai (timeout).
│ Bet *${fmt(refund)}* dikembalikan ke akun kamu.`),
            { mentions: [m.sender] }
          )
        } else {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ Game Masih Berjalan!*
│
│ Kamu masih punya game spaceman aktif.
│ Tunggu selesai atau timeout dalam *${Math.ceil((GAME_TIMEOUT - elapsed) / 60000)} menit* lagi.
│
│ ➤ Ketik *${usedPrefix}cashout* untuk keluar sekarang.`),
            { mentions: [m.sender] }
          )
        }
      }

      const betAmount = parseInt(args[0])

      if (isNaN(betAmount) || betAmount <= 0) {
        return usage(
          'Jumlah taruhan tidak valid!',
          '<jumlah>',
          'Gunakan angka positif',
          ['10000', '100000']
        )
      }

      if (betAmount > MAX_BET) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Taruhan Terlalu Besar!*
│
│ Maksimal taruhan: *${fmt(MAX_BET)}*`),
          { mentions: [m.sender] }
        )
      }

      if ((dbUser.money || 0) < betAmount) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Uang Tidak Cukup!*
│
│ 💰 Money kamu : *${fmt(dbUser.money)}*
│ 🎲 Taruhan    : *${fmt(betAmount)}*`),
          { mentions: [m.sender] }
        )
      }

      dbUser.money -= betAmount

      // Simpan state ke db (persisten)
      dbUser.spacemanActive    = true
      dbUser.spacemanBet       = betAmount
      dbUser.spacemanStartTime = Date.now()

      let multiplier = 1.0

      // Simpan ke global untuk cashout handler
      global.spacemanGames = global.spacemanGames || {}
      global.spacemanGames[m.sender] = {
        isCashedOut: false,
        multiplier: 1.0,
        betAmount,
        startTime: Date.now()
      }

      // Fallback refund timeout
      const fallbackRefund = setTimeout(() => {
        try {
          const u = global.db.data.users[m.sender]
          if (u && u.spacemanActive && u.spacemanBet > 0) {
            u.money = (u.money || 0) + u.spacemanBet
            u.spacemanActive    = false
            u.spacemanBet       = 0
            u.spacemanStartTime = 0
            sendWithTemplate(
              dino, m,
              decorate(`*⚠️ Refund Timeout!*
│
│ Game spaceman melebihi batas waktu.
│ Bet *${fmt(betAmount)}* dikembalikan ke akun kamu.`),
              { mentions: [m.sender] }
            )
          }
          if (global.spacemanGames) delete global.spacemanGames[m.sender]
        } catch (e) { /* silent */ }
      }, GAME_TIMEOUT)

      // Kirim pesan awal
      let initialMessage = await dino.sendMessage(from, {
        text: decorate(`*🚀 SPACEMAN*
│
│ 👤 *Pemain* : @${m.sender.split('@')[0]}
│ 🪙 *Bet*    : ${fmt(betAmount)}
│
│ ⚡ Ketik *${usedPrefix}cashout* sebelum Spaceman jatuh!
│
│ Multiplier: *x${multiplier.toFixed(2)}*`),
        mentions: [m.sender]
      }, { quoted: m })

      const updateMessage = async () => {
        await dino.relayMessage(m.chat, {
          protocolMessage: {
            key: initialMessage.key,
            type: 14,
            editedMessage: {
              conversation: decorate(`*🚀 SPACEMAN*
│
│ 👤 *Pemain* : @${m.sender.split('@')[0]}
│ 🪙 *Bet*    : ${fmt(betAmount)}
│
│ ⚡ Ketik *${usedPrefix}cashout* sebelum Spaceman jatuh!
│
│ Multiplier: *x${multiplier.toFixed(2)}*`)
            }
          }
        }, {})
      }

      const randomCrash = () =>
        Math.random() < 0.05 + (multiplier * 0.1) + (Math.floor(betAmount / 100000) * 0.1)

      // Loop game
      for (let i = 0; i < 100; i++) {
        await delay(1500)
        if (
          !global.spacemanGames[m.sender] ||
          global.spacemanGames[m.sender].isCashedOut ||
          randomCrash() ||
          multiplier >= MAX_MULTIPLIER
        ) break
        multiplier += 0.1
        global.spacemanGames[m.sender].multiplier = multiplier
        await updateMessage()
      }

      clearTimeout(fallbackRefund)

      if (global.spacemanGames[m.sender]?.isCashedOut) {
        const winnings = Math.round(betAmount * multiplier)
        dbUser.money = (dbUser.money || 0) + winnings
        await sendWithTemplate(
          dino, m,
          decorate(`*✅ CASHOUT BERHASIL!*
│
│ 🚀 Multiplier  : *x${multiplier.toFixed(2)}*
│ 🪙 Bet         : *${fmt(betAmount)}*
│ 💰 Kemenangan  : *+${fmt(winnings)}*
│
│ 💰 Total Money : *${fmt(dbUser.money)}*`),
          { react: true, reactDone: '✅', mentions: [m.sender] }
        )
      } else {
        await sendWithTemplate(
          dino, m,
          decorate(`*💥 SPACEMAN JATUH!*
│
│ Sayang sekali, Spaceman jatuh di *x${multiplier.toFixed(2)}*!
│ Kamu kehilangan *${fmt(betAmount)}* money.
│
│ 💰 Sisa Money : *${fmt(dbUser.money)}*`),
          { react: true, reactDone: '💥', mentions: [m.sender] }
        )
      }

      // Bersihkan state
      dbUser.spacemanActive    = false
      dbUser.spacemanBet       = 0
      dbUser.spacemanStartTime = 0
      delete global.spacemanGames[m.sender]
    }

  }
}