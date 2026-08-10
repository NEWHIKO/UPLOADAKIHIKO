// ══════════════════════════════════════════════════════
//  NABUNG — Sistem Bank dengan Utility & Biaya Admin
//
//  - Biaya admin 1% saat NABUNG (min 500, max 10.000)
//  - Bunga otomatis 0.5%/hari di saldo bank (via daily cek)
//  - Info bunga ditampilkan saat cek saldo
// ══════════════════════════════════════════════════════

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

    case 'nabung': 'menu'; {
      /* CONSTANTS */
      const MAX_SETOR  = 99999999
      const ADMIN_RATE = 0.01
      const ADMIN_MIN  = 500
      const ADMIN_MAX  = 10000

      /* HELPER */
      const dbUser = global.db.data.users[m.sender]
      const fmt = (n) => (n || 0).toLocaleString('id-ID')

      function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

      function pickRandom(list) {
        return list[Math.floor(Math.random() * list.length)]
      }

      /* HANDLER */
      const sapaan = pickRandom([
        '🏦 Mau nabung? Bijak banget!',
        '💳 Simpan uangmu di ATM biar aman!',
        '🐷 Rajin menabung pangkal kaya!',
        '💰 Uang disimpan di bank lebih aman!',
        '🏧 Setor ke ATM sekarang, biar tidak habis!'
      ])

      // ── INFO SETOR jika tidak ada argumen ──
      if (!args[0]) {
        return sendWithTemplate(
          dino, m,
          decorate(`*🏦 NABUNG ATM*\n│\n│ ${sapaan}\n│\n│ ➤ *${usedPrefix}nabung <jumlah>*\n│ ➤ *${usedPrefix}nabung all* — setor semua money\n│ ➤ Contoh: *${usedPrefix}nabung 50000*\n│\n│ *💳 Saldo Kamu:*\n│ ┌────────\n│ │ 💰 Money    : *${fmt(dbUser.money)}*\n│ │ 🏦 ATM/Bank : *${fmt(dbUser.bank)}*\n│ └─────\n│\n│ *ℹ️ Info Biaya Bank:*\n│ ┌────────\n│ │ 📌 Admin nabung : *1%* (min 500, max 10.000)\n│ │ 📈 Bunga harian : *+0.5%* saldo bank/hari\n│ │ 💡 Simpan uang → dapat bunga!\n│ │ ⚠️ Tarik uang   → gratis (no penalty)\n│ └─────`),
          { mentions: [m.sender] }
        )
      }

      // Hitung jumlah setor
      const isAll = args[0].toLowerCase() === 'all'
      let count

      if (isAll) {
        let maxMoney = dbUser.money
        if (maxMoney <= 500) {
          count = 0
        } else {
          let guess = Math.floor(maxMoney / 1.01)
          let feeGuess = Math.max(ADMIN_MIN, Math.min(Math.round(guess * ADMIN_RATE), ADMIN_MAX))
          while (guess + feeGuess > maxMoney && guess > 0) {
            guess--
            feeGuess = Math.max(ADMIN_MIN, Math.min(Math.round(guess * ADMIN_RATE), ADMIN_MAX))
          }
          count = guess
        }
      } else {
        count = parseInt((args[0] || '0').replace(/\./g, '').replace(/,/g, '')) || 0
      }

      count = Math.max(1, Math.min(count, MAX_SETOR))

      if (!count || count <= 0) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Jumlah Tidak Valid!*\n│\n│ Masukkan jumlah yang valid (minimal 1).\n│\n│ ➤ *${usedPrefix}nabung 50000*\n│ ➤ *${usedPrefix}nabung all*`),
          { mentions: [m.sender] }
        )
      }

      // Hitung biaya admin (1%, min 500, max 10.000)
      let adminFee = Math.round(count * ADMIN_RATE)
      adminFee = Math.max(ADMIN_MIN, Math.min(adminFee, ADMIN_MAX))

      const totalNeeded = count + adminFee

      // Cek money cukup
      if (dbUser.money < totalNeeded) {
        let maxTabung = dbUser.money - adminFee
        if (maxTabung <= 0) maxTabung = 0
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Money Tidak Cukup!*\n│\n│ Tidak cukup termasuk biaya admin.\n│\n│ ┌────────\n│ │ 💰 Mau Ditabung    : *${fmt(count)}*\n│ │ 📌 Biaya Admin (1%): *${fmt(adminFee)}*\n│ │ 💳 Total Dibutuhkan: *${fmt(totalNeeded)}*\n│ │ 💰 Money Kamu      : *${fmt(dbUser.money)}*\n│ │ ❌ Kurang          : *${fmt(totalNeeded - dbUser.money)}*\n│ └─────\n│\n│ ${maxTabung > 0 ? `💡 Maksimal bisa nabung sekarang: *${fmt(maxTabung)}*` : ''}\n│\n│ ➤ *${usedPrefix}tarik <jumlah>* untuk ambil dari ATM dulu.`),
          { mentions: [m.sender] }
        )
      }

      // Proses setor
      const moneyBefore = dbUser.money
      const bankBefore  = dbUser.bank

      await sendWithTemplate(
        dino, m,
        decorate(`*🏦 Sedang Memproses Setoran...*\n│\n│ Harap tunggu sebentar...`),
        { react: true, reactDone: '🏦', mentions: [m.sender] }
      )

      await delay(3000)

      dbUser.money -= (count + adminFee)
      dbUser.bank  += count

      const komentar = pickRandom([
        '✅ Nabung berhasil! Uang aman tersimpan di ATM!',
        '🐷 Rajin menabung! Uang sudah masuk bank!',
        '💳 Setor sukses! Saldo ATM bertambah!',
        '🏦 Berhasil! Dana sudah aman di brankas bank!',
        '🎉 Sukses nabung! Makin hari makin kaya!'
      ])

      return sendWithTemplate(
        dino, m,
        decorate(`*✅ Nabung ke ATM Berhasil!*\n│\n│ ${komentar}\n│\n│ *📋 Detail Transaksi:*\n│ ┌────────\n│ │ 💰 Ditabung        : *${fmt(count)}*\n│ │ 📌 Biaya Admin 1%  : *-${fmt(adminFee)}*\n│ │ 💰 Money Berkurang : *-${fmt(count + adminFee)}*\n│ │ 🏦 ATM Bertambah   : *+${fmt(count)}*\n│ └─────\n│\n│ *💳 Saldo Sebelum:*\n│ ┌────────\n│ │ 💰 Money : *${fmt(moneyBefore)}*\n│ │ 🏦 ATM   : *${fmt(bankBefore)}*\n│ └─────\n│\n│ *💳 Saldo Sekarang:*\n│ ┌────────\n│ │ 💰 Money : *${fmt(dbUser.money)}*\n│ │ 🏦 ATM   : *${fmt(dbUser.bank)}*\n│ └─────\n│\n│ 📈 *Uang di ATM mendapat bunga +0.5%/hari!*\n│ ⚠️ Biaya admin 1% diambil dari money saat nabung.\n│\n│ ➤ *${usedPrefix}tarik <jumlah>* untuk ambil dari ATM\n│ ➤ *${usedPrefix}atm* untuk cek saldo lengkap`),
        { react: true, reactDone: '✅', mentions: [m.sender] }
      )
    }

  }
}