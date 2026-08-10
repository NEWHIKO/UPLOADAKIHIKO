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

    case 'heal': 'menu'; {
      /* CONSTANTS */
      const MAX_HEALTH = 200
      const MIN_HEAL = 40
      const MAX_HEAL = 60

      /* HELPER */
      const dbUser = global.db.data.users[m.sender]
      const fmt = (n) => (n || 0).toLocaleString('id-ID')

      function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

      function pickRandom(list) {
        return list[Math.floor(Math.random() * list.length)]
      }

      function progressBar(current, max, len = 10) {
        if (!max || max <= 0) return '░'.repeat(len)
        const filled = Math.max(0, Math.min(Math.round((current / max) * len), len))
        return '█'.repeat(filled) + '░'.repeat(len - filled)
      }

      /* HANDLER */
      // ── CEK HEALTH SUDAH PENUH ──
      if ((dbUser.health || 0) >= MAX_HEALTH) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❤️ Health Sudah Penuh!*
│
│ Health kamu sudah maksimal, tidak perlu heal lagi!
│
│ ❤️ Health: *${dbUser.health} / ${MAX_HEALTH}*
│ [${progressBar(dbUser.health, MAX_HEALTH)}] 100%
│
│ ➤ Lanjut beraktivitas!`),
          { mentions: [m.sender] }
        )
      }

      // ── CEK STOK POTION ──
      if (!dbUser.potion || dbUser.potion < 1) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Potion Tidak Ada!*
│
│ Kamu tidak punya Potion untuk heal!
│
│ ❤️ Health Kamu : *${dbUser.health || 0} / ${MAX_HEALTH}*
│ 🧪 Potion Kamu : *0*
│
│ *💡 Cara Dapat Potion:*
│ ┌─────
│ │ ➤ *${usedPrefix}shop buy potion <jumlah>*
│ │ ➤ *${usedPrefix}daily* — kadang dapat potion
│ │ ➤ *${usedPrefix}open* — buka crate
│ └───`),
          { react: false, mentions: [m.sender] }
        )
      }

      // Hitung jumlah potion yang dipakai
      const countArg = args[0] && !isNaN(args[0]) ? parseInt(args[0]) : null
      const healthNeeded = MAX_HEALTH - (dbUser.health || 0)
      const avgHeal = Math.floor((MIN_HEAL + MAX_HEAL) / 2)
      const estimasiButuh = Math.ceil(healthNeeded / avgHeal)

      let potionUsed = countArg
        ? Math.min(countArg, dbUser.potion)
        : Math.min(estimasiButuh, dbUser.potion)

      potionUsed = Math.max(1, potionUsed)

      // Hitung heal actual (random per potion)
      let totalHeal = 0
      for (let i = 0; i < potionUsed; i++) {
        const healAmount = Math.floor(Math.random() * (MAX_HEAL - MIN_HEAL + 1)) + MIN_HEAL
        totalHeal += healAmount
      }

      // Cap agar tidak melebihi MAX_HEALTH
      const healthBefore = dbUser.health || 0
      const healActual = Math.min(totalHeal, MAX_HEALTH - healthBefore)
      const healthAfter = Math.min(healthBefore + healActual, MAX_HEALTH)
      const isFull = healthAfter >= MAX_HEALTH

      // Update data
      dbUser.potion -= potionUsed
      dbUser.health = healthAfter

      // Komentar variatif
      const komentar = pickRandom(
        isFull
          ? [
              '❤️ Health penuh! Siap terjun ke medan battle!',
              '💪 Pulih total! Tidak ada yang bisa menghentikanmu!',
              '✨ Sembuh sempurna! Full HP siap beraksi!'
            ]
          : [
              '🧪 Potion bekerja! Health berangsur pulih!',
              '💊 Minum potion, badan terasa lebih baik!',
              '✨ Potion bereaksi, luka mulai sembuh!',
              '💉 Healing selesai, health bertambah!',
              '🌟 Efek potion terasa, energi kembali!'
            ]
      )

      // Progress bar sebelum & sesudah
      const barBefore = progressBar(healthBefore, MAX_HEALTH)
      const barAfter = progressBar(healthAfter, MAX_HEALTH)
      const pctBefore = Math.round((healthBefore / MAX_HEALTH) * 100)
      const pctAfter = Math.round((healthAfter / MAX_HEALTH) * 100)

      await sendWithTemplate(
        dino, m,
        decorate(`*🧪 Sedang Heal...*
│
│ Minum potion...`),
        { react: true, reactDone: isFull ? '❤️' : '🧪', mentions: [m.sender] }
      )
      await delay(2000)

      return sendWithTemplate(
        dino, m,
        decorate(`*🧪 Heal Sukses!*
│
│ ${komentar}
│
│ *💊 Detail Heal:*
│ ┌─────
│ │ 🧪 Potion Dipakai : *${potionUsed}x*
│ │ ❤️ Heal per Potion: *${MIN_HEAL}–${MAX_HEAL} HP* (random)
│ │ ❤️ Total Heal     : *+${healActual} HP*
│ └───
│
│ *❤️ Perubahan Health:*
│ ┌─────
│ │ Sebelum : [${barBefore}] ${pctBefore}%
│ │           *${healthBefore} HP*
│ │ Sesudah : [${barAfter}] ${pctAfter}%
│ │           *${healthAfter} HP* (+${healActual})
│ └───
│
│ *📦 Sisa Stok:*
│ ┌─────
│ │ 🧪 Potion : *${fmt(dbUser.potion)}*
│ └───
│
│ ${isFull
    ? '✅ *Health PENUH! Siap beraktivitas!'
    : `💡 Butuh *${MAX_HEALTH - healthAfter} HP* lagi untuk penuh.\n│ ➤ *${usedPrefix}heal* lagi untuk lanjut heal.`}
│
│ ➤ *${usedPrefix}shop buy potion* beli potion
│ ➤ *${usedPrefix}hunter* | *${usedPrefix}berburu* | *${usedPrefix}adventure*`),
        { react: true, reactDone: '✅', mentions: [m.sender] }
      )
    }

  }
}