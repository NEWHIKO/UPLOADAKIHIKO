const { sendWithTemplate } = require('../../sendWithTemplate')
const { getJam, getHari } = require('./rpg-time-system.js')

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

    case 'tomoney': 'menu'; {
      /* CONSTANTS */
      const EXP_PER_MONEY = 2          // Rate dasar: 2 EXP = 1 Money
      const TOMONEY_COOLDOWN = 14400000 // Cooldown 4 jam
      const TOMONEY_DAILY_CAP = 500000  // Maks konversi 500.000 Money per hari

      /* HELPER */
      const dbUser = global.db.data.users[m.sender]
      const fmt = (n) => (n || 0).toLocaleString('id-ID')

      function hitungPajak(jumlah) {
        if (jumlah <= 5000)   return 0.05  // 5%
        if (jumlah <= 50000)  return 0.10  // 10%
        if (jumlah <= 200000) return 0.15  // 15%
        return 0.20                        // 20%
      }

      function msToTime(duration) {
        let seconds = Math.floor((duration / 1000) % 60)
        let minutes = Math.floor((duration / (1000 * 60)) % 60)
        let hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
        return `${hours} jam ${minutes} menit ${seconds} detik`
      }

      /* HANDLER */
      const jam = getJam()
      const hari = getHari()

      // Rate dinamis berdasarkan jam & hari
      let rateBonus = 0
      if (jam.kategori === 'SIBUK' && jam.jam >= 6) rateBonus = -0.3
      else if (jam.kategori === 'SEPI') rateBonus = 0.5
      if (hari.isWeekend) rateBonus -= 0.2

      const effectiveRate = Math.max(1, EXP_PER_MONEY + rateBonus)

      // Cooldown check
      const now = Date.now()
      const sisaCooldown = TOMONEY_COOLDOWN - (now - (dbUser.lastTomoney || 0))
      if (sisaCooldown > 0) {
        return sendWithTemplate(
          dino, m,
          decorate(`*⏳ Kantor Pajak Sedang Tutup!*
│
│ Kamu baru saja melakukan konversi. Tunggu dulu!
│
│ ⏱️ Sisa Waktu  : *${msToTime(sisaCooldown)}*
│ 🕐 Jam Sekarang: *${jam.nama}*
│
│ 💡 Tips: Konversi jam 06–11 (pagi) atau weekend untuk rate lebih hemat!`),
          { mentions: [m.sender] }
        )
      }

      // Daily cap check
      const todayKey = new Date().toDateString()
      if ((dbUser.tomoneyDateKey || '') !== todayKey) {
        dbUser.tomoneyUsedToday = 0
        dbUser.tomoneyDateKey = todayKey
      }
      const sisaHarian = TOMONEY_DAILY_CAP - (dbUser.tomoneyUsedToday || 0)

      // ── MENU ──
      if (!args[0]) {
        const maxBisa = Math.min(
          Math.floor((dbUser.exp || 0) / effectiveRate),
          sisaHarian
        )
        return sendWithTemplate(
          dino, m,
          decorate(`*💱 TUKAR EXP → MONEY*
│
│ 🕐 *${jam.nama}* | 📅 *${hari.nama}*
│
│ ➤ *${usedPrefix}tomoney <jumlah>*
│ ➤ *${usedPrefix}tomoney all* — tukar semua EXP
│ ➤ Contoh: *${usedPrefix}tomoney 1000*
│
│ *📊 Kurs Penukaran (Dinamis):*
│ ┌────────
│ │ 📌 Rate Efektif : *${effectiveRate.toFixed(1)} EXP = 1 Money*
│ │ 🕐 Efek Jam     : ${jam.kategori === 'SIBUK' && jam.jam >= 6 ? '✅ Pagi: hemat!' : jam.kategori === 'SEPI' ? '⚠️ Dini hari: boros' : '➖ Normal'}
│ │ 📅 Efek Hari    : ${hari.isWeekend ? '✅ Weekend: bonus hemat!' : '➖ Hari biasa'}
│ │ 🧾 Pajak        : *progresif 5–20%* (makin besar makin kena)
│ └─────
│
│ *💼 Saldo Kamu:*
│ ┌────────
│ │ ✨ EXP          : *${fmt(dbUser.exp)}*
│ │ 💰 Money        : *${fmt(dbUser.money)}*
│ │ 🔄 Max Tukar    : *${fmt(maxBisa)} Money*
│ │ 📋 Limit Harian : *${fmt(sisaHarian)} Money* tersisa
│ └─────
│
│ ⏱️ Cooldown : *4 jam* setelah konversi
│ 📆 Limit    : *${fmt(TOMONEY_DAILY_CAP)} Money/hari*`),
          { mentions: [m.sender] }
        )
      }

      // Hitung jumlah
      let count
      const isAll = /^all$/i.test(args[0])

      if (isAll) {
        count = Math.min(
          Math.floor((dbUser.exp || 0) / effectiveRate),
          sisaHarian
        )
        if (count <= 0) {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ EXP Tidak Cukup / Limit Harian Habis!*
│
│ ✨ EXP Kamu       : *${fmt(dbUser.exp)}*
│ 📋 Sisa Limit Hari: *${fmt(sisaHarian)} Money*`),
            { mentions: [m.sender] }
          )
        }
      } else {
        if (isNaN(args[0]) || parseInt(args[0]) <= 0) {
          return usage(
            'Jumlah tidak valid!',
            '<jumlah|all>',
            'Masukkan angka atau "all" untuk tukar semua EXP',
            ['1000', '5000', 'all']
          )
        }
        count = parseInt(args[0])
      }

      // Terapkan daily cap
      if (count > sisaHarian) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Melebihi Limit Konversi Harian!*
│
│ Kamu hanya bisa mengonversi *${fmt(sisaHarian)} Money* lagi hari ini.
│
│ 📆 Limit Harian  : *${fmt(TOMONEY_DAILY_CAP)} Money/hari*
│ ✅ Sudah dipakai : *${fmt(dbUser.tomoneyUsedToday || 0)} Money*
│ 🔄 Sisa limit    : *${fmt(sisaHarian)} Money*`),
          { mentions: [m.sender] }
        )
      }

      const expDibutuhkan = Math.ceil(count * effectiveRate)

      if ((dbUser.exp || 0) < expDibutuhkan) {
        const maxBisa = Math.floor((dbUser.exp || 0) / effectiveRate)
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ EXP Tidak Cukup!*
│
│ ✨ EXP Kamu       : *${fmt(dbUser.exp)}*
│ ✨ EXP Dibutuhkan : *${fmt(expDibutuhkan)}* (rate ×${effectiveRate.toFixed(1)})
│ 🔄 Max Bisa Tukar : *${fmt(maxBisa)} Money*
│
│ 💡 Coba: *${usedPrefix}tomoney ${maxBisa > 0 ? maxBisa : 1}*`),
          { mentions: [m.sender] }
        )
      }

      // Hitung pajak
      const tarifPajak = hitungPajak(count)
      const pajakAmount = Math.floor(count * tarifPajak)
      const moneyBersih = count - pajakAmount

      // Proses konversi
      const expBefore = dbUser.exp
      const moneyBefore = dbUser.money

      dbUser.exp -= expDibutuhkan
      dbUser.money = (dbUser.money || 0) + moneyBersih
      dbUser.lastTomoney = now
      dbUser.tomoneyUsedToday = (dbUser.tomoneyUsedToday || 0) + count

      return sendWithTemplate(
        dino, m,
        decorate(`*✅ Penukaran EXP → Money Berhasil!*
│
│ *📋 Detail Penukaran:*
│ ┌────────
│ │ 📌 Rate Efektif  : *${effectiveRate.toFixed(1)} EXP = 1 Money*
│ │ ✨ EXP Digunakan : *-${fmt(expDibutuhkan)}*
│ │ 💰 Money Kotor   : *+${fmt(count)}*
│ │ 🧾 Pajak (${(tarifPajak * 100).toFixed(0)}%)   : *-${fmt(pajakAmount)}*
│ │ 💰 Money Bersih  : *+${fmt(moneyBersih)}*
│ └─────
│
│ 🕐 *${jam.nama}* → Rate ${rateBonus < 0 ? '✅ lebih hemat' : rateBonus > 0 ? '⚠️ lebih boros' : '➖ normal'}
│ 📅 *${hari.nama}* → ${hari.isWeekend ? '✅ Weekend bonus' : '➖ Hari biasa'}
│
│ *📊 Saldo:*
│ ┌────────
│ │ ✨ EXP   : *${fmt(expBefore)}* → *${fmt(dbUser.exp)}*
│ │ 💰 Money : *${fmt(moneyBefore)}* → *${fmt(dbUser.money)}*
│ │ 📆 Limit Sisa Hari: *${fmt(TOMONEY_DAILY_CAP - dbUser.tomoneyUsedToday)} Money*
│ └─────
│
│ ⏱️ Cooldown berikutnya: *4 jam*`),
        { react: true, reactDone: '✅', mentions: [m.sender] }
      )
    }

  }
}