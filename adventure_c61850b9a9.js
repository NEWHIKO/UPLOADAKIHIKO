const { sendWithTemplate } = require('../../sendWithTemplate')
const { hitungReward, hitungDebuff, buildTimeInfo, getDropBonus } = require('./rpg-time-system.js')
const { applyDurabilityLoss } = require('./rpg-durability-helper.js')

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

    case 'adventure': 'menu'; {
      /* CONSTANTS */
      const COOLDOWN     = 3600000 // 1 jam
      const MIN_HEALTH   = 80
      const MIN_STAMINA  = 35

      /* HELPER */
      function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }
      function ranNumb(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
      function pickRandom(list) { return list[Math.floor(Math.random() * list.length)] }
      function msToTime(duration) {
        const s = Math.floor((duration / 1000) % 60)
        const mn = Math.floor((duration / 60000) % 60)
        const h = Math.floor(duration / 3600000)
        return `${h} jam ${mn} menit ${s} detik`
      }

      /* HANDLER */
      const dbUser = global.db.data.users[m.sender]

      // Validasi armor
      if ((dbUser.armor || 0) === 0) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Armor Tidak Ada!*\n│\n│ ➤ Ketik: *${usedPrefix}craft armor*`),
          { react: false, mentions: [m.sender] }
        )
      }

      // Validasi health
      if ((dbUser.health || 0) < MIN_HEALTH) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Health Tidak Cukup!*\n│\n│ Health Dibutuhkan: *${MIN_HEALTH}*\n│ Health Kamu: *${dbUser.health || 0}*\n│\n│ ➤ Ketik: *${usedPrefix}heal*`),
          { react: false, mentions: [m.sender] }
        )
      }

      // Validasi stamina
      if ((dbUser.stamina || 0) < MIN_STAMINA) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Stamina Tidak Cukup!*\n│\n│ Stamina Dibutuhkan: *${MIN_STAMINA}*\n│ Stamina Kamu: *${dbUser.stamina || 0}*\n│\n│ ➤ Ketik: *${usedPrefix}eat*`),
          { react: false, mentions: [m.sender] }
        )
      }

      // Validasi cooldown
      const now = Date.now()
      const sisaCooldown = COOLDOWN - (now - (dbUser.lastadventure || 0))
      if (sisaCooldown > 0) {
        return sendWithTemplate(
          dino, m,
          decorate(`*⏳ Masih Cape Bang!*\n│\n│ Tunggu: *${msToTime(sisaCooldown)}*`),
          { react: false, mentions: [m.sender] }
        )
      }

      // Set cooldown di awal — cegah spam/race condition
      dbUser.lastadventure = now

      const armorMultiplier = [0, 1, 1.5, 2, 3, 4][dbUser.armor] || 1
      const gearBonus = armorMultiplier

      // Time system
      const debuff   = hitungDebuff(ranNumb(20, 45), ranNumb(5, 55), ranNumb(10, 45), 0.20)
      const timeInfo = buildTimeInfo('adventure')
      const dropBonus = getDropBonus()

      let extraNote = ''
      if (debuff.jam.kategori === 'SEPI') {
        debuff.finalChanceGagal = Math.min(0.90, debuff.finalChanceGagal + 0.05)
        extraNote = '⚠️ JAM SEPI: Adventure sangat tidak efisien! Reward ×0.70 dan risiko naik.'
      } else if (debuff.jam.kategori === 'SIBUK') {
        extraNote = '🔥 JAM SIBUK: Waktu terbaik untuk adventure! Reward ×1.35!'
      }

      const lokasi = pickRandom([
        'Jepang 🗾', 'Korea 🇰🇷', 'Bali 🌴', 'Amerika 🗽', 'Iraq 🏜️',
        'Arab 🕌', 'Pakistan 🌙', 'Jerman 🏰', 'Finlandia ❄️',
        'Dunia Mimpi 🌌', 'Ujung Dunia 🌊', 'Mars 🔴',
        'Zimbabwe 🦁', 'Bulan 🌕', 'Pluto 🪐', 'Matahari ☀️',
        'Hatinya Dia 💔', 'Atlantis 🐚', 'Negeri Awan ☁️', 'Hutan Terlarang 🌲'
      ])

      // Loading: mulai petualangan
      await sendWithTemplate(
        dino, m,
        decorate(`*🗺️ Memulai Petualangan...*\n│\n│ Kamu menyiapkan ransel dan bekal untuk perjalanan jauh...\n│ Tujuan: *${lokasi}*\n│\n│ 🥼 Armor Tier : *${dbUser.armor}* (x${armorMultiplier} multiplier)\n│\n│ ${timeInfo}\n│ ${extraNote}`),
        { react: true, reactDone: '🗺️', mentions: [m.sender] }
      )

      await delay(3000)

      await sendWithTemplate(
        dino, m,
        decorate(`*🌍 Dalam Perjalanan...*\n│\n│ Kamu melewati berbagai rintangan dalam perjalanan menuju ${lokasi}...`),
        { mentions: [m.sender] }
      )

      await delay(3000)

      // Cek gagal
      const gagal = Math.random() < debuff.finalChanceGagal
      if (gagal) {
        const healthLoss  = debuff.finalHealthLoss + ranNumb(5, 20)
        const staminaLoss = debuff.finalStaminaLoss
        const armorLoss   = ranNumb(10, 30)

        dbUser.health  = Math.max(5, (dbUser.health || 0) - healthLoss)
        dbUser.stamina = Math.max(0, (dbUser.stamina || 0) - staminaLoss)
        const armorResult1 = applyDurabilityLoss(dbUser, 'armor', armorLoss)

        let gagalMsg = 'Kamu diserang oleh makhluk misterius di tengah perjalanan!\nKamu berhasil kabur tapi tidak membawa apa-apa.'
        if (debuff.jam.kategori === 'SEPI')       gagalMsg = 'Kelelahan total di jam sepi dini hari! Kamu tertidur di jalan\ndan dijarah oleh orang tak dikenal saat tidak sadar.'
        else if (debuff.musim.key === 'kemarau')  gagalMsg = 'Kepanasan di musim kemarau! Kamu dehidrasi parah\ndan terpaksa balik sebelum sampai tujuan.'
        else if (debuff.musim.key === 'hujan')    gagalMsg = 'Banjir bandang menghadang perjalanan!\nKamu terpaksa putar balik dengan kondisi lelah.'

        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Petualangan Gagal!*\n│\n│ ${gagalMsg}\n│\n│ 📊 *Status Setelah Gagal:*\n│ ❤️ Health Berkurang    : *-${healthLoss}* (Sisa: ${dbUser.health})\n│ ⚡ Stamina Berkurang   : *-${staminaLoss}* (Sisa: ${dbUser.stamina})\n│ 🥼 Durability Armor    : *-${armorLoss}* (Sisa: ${dbUser.armordurability || 0})${armorResult1.msg}\n│ ⚠️ Chance Gagal: ${Math.round(debuff.finalChanceGagal * 100)}% (${debuff.jam.nama})\n│\n│ ➤ Ketik: *${usedPrefix}heal* dan *${usedPrefix}eat* untuk recover.`),
          { react: true, reactDone: '❌', mentions: [m.sender] }
        )
      }

      await sendWithTemplate(
        dino, m,
        decorate(`*🎉 Tiba di Tujuan!*\n│\n│ Kamu berhasil tiba di *${lokasi}* dan mulai menjelajahi tempat ini...`),
        { mentions: [m.sender] }
      )

      await delay(3000)

      // Hitung reward
      const baseExp   = Math.floor((Math.random() * 25000 + 5000) * gearBonus)
      const baseMoney = Math.floor((Math.random() * 60000 + 10000) * gearBonus)
      const reward    = hitungReward('adventure', baseMoney, baseExp, 1, gearBonus)

      const seasonAdv = reward.seasonMult
      const trash   = Math.floor((Math.random() * 80 + 5) * seasonAdv)
      const potion  = pickRandom([0, 1, 1, 2, 3, 4])
      const diamond = Math.floor((pickRandom([0, 1, 1, 2, 3, 5])) * gearBonus * seasonAdv)
      const common  = pickRandom([0, 1, 2, 3, 4])
      const uncommon = pickRandom([0, 1, 1, 2])
      const mythic  = pickRandom([0, 0, 1, 1, 2, 3])
      const legendary = pickRandom([0, 0, 0, 1, 1, 2])
      const wood    = Math.floor((Math.random() * 500 + 50) * gearBonus * seasonAdv)
      const rock    = Math.floor((Math.random() * 300 + 30) * gearBonus * seasonAdv)
      const gold    = Math.floor((pickRandom([0, 1, 1, 2, 3, 5])) * gearBonus)
      const string  = Math.floor((Math.random() * 60 + 5) * gearBonus)
      const iron    = Math.floor((Math.random() * 30 + 5) * gearBonus)

      // Rare drop logic
      const rareBase = 0.03 + (dropBonus / 300)
      const rareRoll = Math.random()
      let finalMythic = 0
      let finalLegendary = 0
      let rareMsg = ''
      if (rareRoll < rareBase) {
        finalMythic = mythic
        rareMsg = `\n│ ✨ *JACKPOT! Kamu menemukan ${mythic} Mythic Crate langka!*`
      } else if (rareRoll < rareBase * 2.5) {
        finalLegendary = legendary
        rareMsg = `\n│ 🌟 *LUCKY! Kamu menemukan ${legendary} Legendary Crate tersembunyi!*`
      } else {
        finalMythic = mythic
        finalLegendary = legendary
      }

      const healthLoss  = debuff.finalHealthLoss
      const staminaLoss = debuff.finalStaminaLoss
      const armorLoss   = debuff.finalDurabilityLoss

      dbUser.health  = Math.max(5, (dbUser.health || 0) - healthLoss)
      dbUser.stamina = Math.max(0, (dbUser.stamina || 0) - staminaLoss)
      const armorResult2 = applyDurabilityLoss(dbUser, 'armor', armorLoss)

      dbUser.exp      = (dbUser.exp || 0) + reward.finalExp
      dbUser.money    = (dbUser.money || 0) + reward.finalMoney
      dbUser.trash    = (dbUser.trash || 0) + trash
      dbUser.potion   = (dbUser.potion || 0) + potion
      dbUser.diamond  = (dbUser.diamond || 0) + diamond
      dbUser.common   = (dbUser.common || 0) + common
      dbUser.uncommon = (dbUser.uncommon || 0) + uncommon
      dbUser.wood     = (dbUser.wood || 0) + wood
      dbUser.rock     = (dbUser.rock || 0) + rock
      dbUser.gold     = (dbUser.gold || 0) + gold
      dbUser.string   = (dbUser.string || 0) + string
      dbUser.iron     = (dbUser.iron || 0) + iron
      dbUser.mythic   = (dbUser.mythic || 0) + finalMythic
      dbUser.legendary = (dbUser.legendary || 0) + finalLegendary

      return sendWithTemplate(
        dino, m,
        decorate(`*✅ Petualangan Sukses!*\n│\n│ Perjalananmu ke *${lokasi}* sangat menegangkan!\n│ Kamu berhasil pulang membawa banyak barang berharga.\n│\n│ ⚙️ *Gear Bonus:* x${gearBonus.toFixed(2)} (Armor Tier ${dbUser.armor === 0 ? 'Rusak' : dbUser.armor})\n│\n│ 📊 *Status Setelah Petualangan:*\n│ ❤️ Health Berkurang    : *-${healthLoss}* (Sisa: ${dbUser.health})\n│ ⚡ Stamina Berkurang   : *-${staminaLoss}* (Sisa: ${dbUser.stamina})\n│ 🥼 Durability Armor    : *-${armorLoss}* (Sisa: ${dbUser.armordurability || 0})${armorResult2.msg}\n│ ${dbUser.armor === 0 ? `\n│ *❌ Armor kamu rusak! Ketik: ${usedPrefix}craft armor*\n│` : ''}\n│ 💰 *Reward Utama:*\n│ ✨ EXP    : *+${reward.finalExp.toLocaleString('id-ID')}*\n│ 💵 Money  : *+Rp ${reward.finalMoney.toLocaleString('id-ID')}*\n│\n│ 🎒 *Item yang Kamu Bawa Pulang:*\n│ 🗑️ Trash   : *+${trash}*\n│ 🧪 Potion  : *+${potion}*\n│ 💎 Diamond : *+${diamond}*\n│ 🥇 Gold    : *+${gold}*\n│ 🪵 Wood    : *+${wood}*\n│ 🪨 Rock    : *+${rock}*\n│ 🕸️ String  : *+${string}*\n│ 🔩 Iron    : *+${iron}*\n│\n│ 📦 *Crate yang Kamu Temukan:*\n│ ⚪ Common Crate    : *+${common}*\n│ 🟢 Uncommon Crate  : *+${uncommon}*\n│ 🟣 Mythic Crate    : *+${finalMythic}*\n│ 🟡 Legendary Crate : *+${finalLegendary}*\n│ ${rareMsg}\n│ ⏱️ *Efek Waktu & Musim:*\n│ ${timeInfo}\n│ 🔢 Total Multiplier: ×${reward.totalMult} | Season: ×${reward.seasonMult}\n│\n│ ➤ *${usedPrefix}inventory* untuk cek semua item.\n│ ➤ *${usedPrefix}open* untuk membuka crate.`),
        { react: true, reactDone: '✅', mentions: [m.sender] }
      )
    }

  }
}