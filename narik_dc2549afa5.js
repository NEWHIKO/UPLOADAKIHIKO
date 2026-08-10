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

    case 'narik':
    case 'tarik': 'menu'; {
      /* CONSTANTS */
      const MAX_TARIK = 99999999

      /* HELPER */
      const dbUser = global.db.data.users[m.sender]
      const fmt = (n) => (n || 0).toLocaleString('id-ID')

      function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

      function pickRandom(list) {
        return list[Math.floor(Math.random() * list.length)]
      }

      /* HANDLER */
      const sapaan = pickRandom([
        '🏦 Mau tarik uang dari ATM? Siap!',
        '💳 ATM siap melayani penarikan!',
        '💰 Ambil uangmu dari bank sekarang!',
        '🏧 Mesin ATM online, silakan tarik!',
        '💵 Dana siap dicairkan!'
      ])

      // ── INFO ATM jika tidak ada argumen ──
      if (!args[0]) {
        return sendWithTemplate(
          dino, m,
          decorate(`*🏦 TARIK ATM*\n│\n│ ${sapaan}\n│\n│ ➤ *${usedPrefix}tarik <jumlah>*\n│ ➤ *${usedPrefix}tarik all* — tarik semua\n│ ➤ Contoh: *${usedPrefix}tarik 50000*\n│\n│ *💳 Saldo Kamu:*\n│ ┌────────\n│ │ 🏦 ATM/Bank : *${fmt(dbUser.bank)}*\n│ │ 💰 Money    : *${fmt(dbUser.money)}*\n│ └─────`),
          { mentions: [m.sender] }
        )
      }

      // Hitung jumlah tarik
      const isAll = args[0].toLowerCase() === 'all'
      let count = isAll
        ? dbUser.bank
        : parseInt((args[0] || '0').replace(/\./g, '').replace(/,/g, '')) || 0

      count = Math.max(1, Math.min(count, MAX_TARIK))

      if (!count || count <= 0) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Jumlah Tidak Valid!*\n│\n│ Masukkan jumlah yang valid (minimal 1).\n│\n│ ➤ *${usedPrefix}tarik 50000*\n│ ➤ *${usedPrefix}tarik all*`),
          { mentions: [m.sender] }
        )
      }

      // Cek saldo cukup
      if (dbUser.bank < count) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Saldo ATM Tidak Cukup!*\n│\n│ Saldo ATM kamu tidak cukup untuk penarikan ini.\n│\n│ ┌────────\n│ │ 💳 Mau Tarik   : *${fmt(count)}*\n│ │ 🏦 Saldo ATM   : *${fmt(dbUser.bank)}*\n│ │ ❌ Kurang      : *${fmt(count - dbUser.bank)}*\n│ └─────\n│\n│ ➤ *${usedPrefix}nabung <jumlah>* untuk isi ATM dulu.`),
          { mentions: [m.sender] }
        )
      }

      // Proses tarik
      const bankBefore  = dbUser.bank
      const moneyBefore = dbUser.money

      await sendWithTemplate(
        dino, m,
        decorate(`*🏧 Sedang Memproses Penarikan...*\n│\n│ Harap tunggu sebentar...`),
        { react: true, reactDone: '🏧', mentions: [m.sender] }
      )

      await delay(3000)

      dbUser.bank  -= count
      dbUser.money += count

      const komentar = pickRandom([
        '✅ Penarikan berhasil! Uang sudah di tangan!',
        '💵 Cair! Dana sudah masuk ke kantong!',
        '🎉 Sukses! Uang berhasil ditarik dari ATM!',
        '💰 Berhasil! Saldo sudah dipindahkan ke money!',
        '🏧 Transaksi selesai! Uang siap digunakan!'
      ])

      return sendWithTemplate(
        dino, m,
        decorate(`*✅ Tarik ATM Berhasil!*\n│\n│ ${komentar}\n│\n│ *📋 Detail Transaksi:*\n│ ┌────────\n│ │ 💳 Ditarik        : *${fmt(count)}*\n│ │ 🏦 ATM Berkurang  : *-${fmt(count)}*\n│ │ 💰 Money Bertambah: *+${fmt(count)}*\n│ └─────\n│\n│ *💳 Saldo Sebelum:*\n│ ┌────────\n│ │ 🏦 ATM   : *${fmt(bankBefore)}*\n│ │ 💰 Money : *${fmt(moneyBefore)}*\n│ └─────\n│\n│ *💳 Saldo Sekarang:*\n│ ┌────────\n│ │ 🏦 ATM   : *${fmt(dbUser.bank)}*\n│ │ 💰 Money : *${fmt(dbUser.money)}*\n│ └─────\n│\n│ ➤ *${usedPrefix}nabung <jumlah>* untuk simpan ke ATM\n│ ➤ *${usedPrefix}atm* untuk cek saldo lengkap`),
        { react: true, reactDone: '✅', mentions: [m.sender] }
      )
    }

  }
}