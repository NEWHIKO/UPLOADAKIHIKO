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

    case 'obatpet': 'menu'; {
      /* CONSTANTS */
      const HEAL_COST = {
        naga:    { money: 15000, herb: 2, potion: 0, icon: '🐲' },
        phonix:  { money: 12000, herb: 2, potion: 0, icon: '🔥' },
        griffin: { money: 12000, herb: 1, potion: 1, icon: '🦅' },
        kyubi:   { money: 14000, herb: 2, potion: 0, icon: '🐉' },
        centaur: { money: 10000, herb: 1, potion: 0, icon: '🐎' },
      }
      const PET_NAMES  = { naga: 'Naga', phonix: 'Phonix', griffin: 'Griffin', kyubi: 'Kyubi', centaur: 'Centaur' }
      const ALL_PETS   = Object.keys(HEAL_COST)
      const VALID_PETS = ALL_PETS

      /* HELPER */
      function isNumber(n) { return !isNaN(parseFloat(n)) && isFinite(n) }

      /* HANDLER */
      const dbUser = global.db.data.users[m.sender]
      if (!dbUser) {
        return sendWithTemplate(
          dino, m,
          decorate('*❌ Data kamu tidak ditemukan.*\n│ Silakan daftar dulu.'),
          { mentions: [m.sender] }
        )
      }

      // Init field
      for (let p of ALL_PETS) {
        if (dbUser[p + 'sick'] === undefined) dbUser[p + 'sick'] = false
      }
      if (!isNumber(dbUser.herb))   dbUser.herb   = 0
      if (!isNumber(dbUser.potion)) dbUser.potion = 0
      if (!isNumber(dbUser.money))  dbUser.money  = 0

      const petKey = (args[0] || '').toLowerCase().trim()

      // ── OBAT ALL ────────────────────────────────────────────────
      if (petKey === 'all') {
        const sickList = ALL_PETS.filter(p => dbUser[p] > 0 && dbUser[p + 'sick'])
        if (sickList.length === 0) {
          return sendWithTemplate(
            dino, m,
            decorate('*✅ Semua pet kamu sehat!*\n│ Tidak ada yang perlu diobati.'),
            { mentions: [m.sender] }
          )
        }

        let totalMoney = 0, totalHerb = 0, totalPotion = 0
        for (let p of sickList) {
          totalMoney  += HEAL_COST[p].money
          totalHerb   += HEAL_COST[p].herb
          totalPotion += HEAL_COST[p].potion
        }

        const missingItems = []
        if (dbUser.money < totalMoney)  missingItems.push(`│ 💰 Money kurang ${(totalMoney - dbUser.money).toLocaleString('id-ID')} (butuh ${totalMoney.toLocaleString('id-ID')})`)
        if (dbUser.herb  < totalHerb)   missingItems.push(`│ 🌿 Herb kurang ${totalHerb - dbUser.herb} (butuh ${totalHerb})`)
        if (totalPotion > 0 && dbUser.potion < totalPotion) missingItems.push(`│ 🧪 Potion kurang ${totalPotion - dbUser.potion} (butuh ${totalPotion})`)

        if (missingItems.length > 0) {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ Bahan Pengobatan Kurang (All)!*
│
│ Pet sakit: ${sickList.map(p => PET_NAMES[p]).join(', ')}
│
│ _Total biaya yang dibutuhkan:_
│ 💰 ${totalMoney.toLocaleString('id-ID')} money
│ 🌿 ${totalHerb} herb${totalPotion ? `\n│ 🧪 ${totalPotion} potion` : ''}
│
│ _Kekurangan:_
${missingItems.join('\n')}
│
│ 🌿 Craft herb: *${usedPrefix}craft herb [jumlah]*
│    5 Rock + 3 Wood = 1 Herb`),
            { mentions: [m.sender] }
          )
        }

        dbUser.money  -= totalMoney
        dbUser.herb   -= totalHerb
        if (totalPotion > 0) dbUser.potion -= totalPotion

        let healed = ''
        for (let p of sickList) {
          dbUser[p + 'sick'] = false
          healed += `│ ${HEAL_COST[p].icon} *${PET_NAMES[p]}* ✅ Sembuh!\n`
        }

        return sendWithTemplate(
          dino, m,
          decorate(`*💊 Pengobatan ALL Berhasil!*
│
${healed.trimEnd()}
│
│ _Total biaya yang dikeluarkan:_
│ 💰 Money  : -${totalMoney.toLocaleString('id-ID')}
│ 🌿 Herb   : -${totalHerb}${totalPotion ? `\n│ 🧪 Potion : -${totalPotion}` : ''}
│
│ 💰 Sisa Money : ${dbUser.money.toLocaleString('id-ID')}
│ 🌿 Sisa Herb  : ${dbUser.herb}
│
│ ✅ Semua pet sudah sehat! Siap adventure!`),
          { mentions: [m.sender] }
        )
      }

      // ── LIST STATUS (tanpa arg / arg tidak valid) ────────────────
      if (!petKey || !VALID_PETS.includes(petKey)) {
        let statusList = ''
        for (let p of ALL_PETS) {
          if (dbUser[p] <= 0) continue
          const cost   = HEAL_COST[p]
          const status = dbUser[p + 'sick'] ? '🤒 Sakit' : '✅ Sehat'
          const costStr = dbUser[p + 'sick']
            ? `Obat: 💰${cost.money.toLocaleString('id-ID')} + 🌿${cost.herb}herb${cost.potion ? ` + 🧪${cost.potion}potion` : ''}`
            : ''
          statusList += `│ ${cost.icon} *${PET_NAMES[p]}* — ${status}${costStr ? `\n│    ${costStr}` : ''}\n`
        }
        if (!statusList) statusList = '│ Kamu tidak memiliki pet.\n'

        return sendWithTemplate(
          dino, m,
          decorate(`*💊 Sistem Pengobatan Pet*
│
│ _Status Pet Kamu:_
${statusList.trimEnd()}
│
│ Satu per satu : *${usedPrefix}obatpet <nama_pet>*
│ Sekaligus     : *${usedPrefix}obatpet all*
│
│ 🌿 Craft herb : *${usedPrefix}craft herb [jumlah]*
│    5 Rock + 3 Wood = 1 Herb`),
          { mentions: [m.sender] }
        )
      }

      // ── OBAT SATU PET ───────────────────────────────────────────
      if (!isNumber(dbUser[petKey])) dbUser[petKey] = 0

      if (dbUser[petKey] <= 0) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Kamu tidak memiliki pet *${PET_NAMES[petKey]}*.*`),
          { mentions: [m.sender] }
        )
      }

      if (!dbUser[petKey + 'sick']) {
        return sendWithTemplate(
          dino, m,
          decorate(`*${HEAL_COST[petKey].icon} ${PET_NAMES[petKey]} sehat-sehat saja!*\n│ Tidak perlu diobati. 😊`),
          { mentions: [m.sender] }
        )
      }

      const cost        = HEAL_COST[petKey]
      const missingItems = []
      if ((dbUser.money || 0) < cost.money)   missingItems.push(`│ 💰 Money kurang ${(cost.money - (dbUser.money || 0)).toLocaleString('id-ID')} (butuh ${cost.money.toLocaleString('id-ID')})`)
      if ((dbUser.herb  || 0) < cost.herb)    missingItems.push(`│ 🌿 Herb kurang ${cost.herb - (dbUser.herb || 0)} (butuh ${cost.herb})`)
      if (cost.potion > 0 && (dbUser.potion || 0) < cost.potion) missingItems.push(`│ 🧪 Potion kurang ${cost.potion - (dbUser.potion || 0)} (butuh ${cost.potion})`)

      if (missingItems.length > 0) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Bahan Pengobatan Kurang!*
│
│ ${cost.icon} Mengobati *${PET_NAMES[petKey]}* membutuhkan:
│ 💰 ${cost.money.toLocaleString('id-ID')} money
│ 🌿 ${cost.herb} herb${cost.potion ? `\n│ 🧪 ${cost.potion} potion` : ''}
│
│ _Kekurangan:_
${missingItems.join('\n')}
│
│ 🌿 Craft herb: *${usedPrefix}craft herb [jumlah]*
│    5 Rock + 3 Wood = 1 Herb`),
          { mentions: [m.sender] }
        )
      }

      dbUser.money -= cost.money
      dbUser.herb  -= cost.herb
      if (cost.potion > 0) dbUser.potion -= cost.potion
      dbUser[petKey + 'sick'] = false

      const stillSick    = ALL_PETS.filter(p => dbUser[p] > 0 && dbUser[p + 'sick'])
      const stillSickMsg = stillSick.length > 0
        ? `│ ⚠️ Masih ada ${stillSick.length} pet sakit: ${stillSick.map(p => PET_NAMES[p]).join(', ')}\n│ ➤ *${usedPrefix}obatpet all* untuk sembuhkan sekaligus`
        : '│ ✅ Semua pet sudah sehat! Siap adventure!'

      return sendWithTemplate(
        dino, m,
        decorate(`*💊 Pengobatan Berhasil!*
│
│ ${cost.icon} *${PET_NAMES[petKey]}* berhasil disembuhkan! 🎉
│
│ _Biaya yang dikeluarkan:_
│ 💰 Money  : -${cost.money.toLocaleString('id-ID')}
│ 🌿 Herb   : -${cost.herb}${cost.potion ? `\n│ 🧪 Potion : -${cost.potion}` : ''}
│
│ 💰 Sisa Money : ${dbUser.money.toLocaleString('id-ID')}
│ 🌿 Sisa Herb  : ${dbUser.herb}
│
${stillSickMsg}`),
        { mentions: [m.sender] }
      )
    }

  }
}
