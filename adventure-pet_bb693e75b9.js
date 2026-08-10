const { sendWithTemplate } = require('../../../sendWithTemplate')
const { hitungReward, hitungDebuff, buildTimeInfo, getDropBonus } = require('../rpg-time-system.js')

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

  switch (command) {

    case 'adventurepet': 'menu'; {
      /* CONSTANTS */
      const PETS = ['naga', 'phonix', 'griffin', 'kyubi', 'centaur']
      const PET_DATA = [
        { key: 'naga',    icon: '🐲', name: 'Naga'    },
        { key: 'phonix',  icon: '🔥', name: 'Phonix'  },
        { key: 'griffin', icon: '🦅', name: 'Griffin' },
        { key: 'kyubi',   icon: '🐉', name: 'Kyubi'   },
        { key: 'centaur', icon: '🐎', name: 'Centaur' },
      ]
      const HEAL_COST = {
        naga:    { money: 15000, herb: 2, potion: 0 },
        phonix:  { money: 12000, herb: 2, potion: 0 },
        griffin: { money: 12000, herb: 1, potion: 1 },
        kyubi:   { money: 14000, herb: 2, potion: 0 },
        centaur: { money: 10000, herb: 1, potion: 0 },
      }

      /* HELPER */
      function isNumber(n) { return !isNaN(parseFloat(n)) && isFinite(n) }
      function clockString(ms) {
        let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
        let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
        let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
        return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
      }
      function xpUntukNaikLevel(level) { return Math.floor(1000 * Math.pow(level, 1.8)) }
      function baseUangCap(level)       { return 10000 + (level * 4000) }

      /* HANDLER */
      const dbUser = global.db.data.users[m.sender]

      // Init field
      for (let p of PETS) {
        if (!isNumber(dbUser[p]))              dbUser[p]              = 0
        if (!isNumber(dbUser[p + 'stamina']))  dbUser[p + 'stamina']  = 0
        if (!isNumber(dbUser[p + 'exp']))      dbUser[p + 'exp']      = 0
        if (dbUser[p + 'sick'] === undefined)  dbUser[p + 'sick']     = false
      }
      if (!isNumber(dbUser.lastadventurepet)) dbUser.lastadventurepet = 0
      if (!isNumber(dbUser.herb))             dbUser.herb             = 0

      const hasPet = PETS.some(p => dbUser[p] > 0)
      if (!hasPet) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Kamu tidak memiliki pet.*\n│ Ketik *${usedPrefix}shop buy pet* untuk beli crate pet.`),
          { mentions: [m.sender] }
        )
      }

      // Pisahkan pet sehat vs sakit
      const sickPets    = PETS.filter(p => dbUser[p] > 0 && dbUser[p + 'sick'])
      const healthyPets = PETS.filter(p => dbUser[p] > 0 && !dbUser[p + 'sick'])

      // Blokir hanya jika SEMUA sakit
      if (healthyPets.length === 0) {
        const sickList = sickPets.map(p => {
          const pd   = PET_DATA.find(d => d.key === p)
          const cost = HEAL_COST[p]
          return `│ ${pd.icon} *${pd.name}* 🤒\n│    ➤ *${usedPrefix}obatpet ${p}*\n│    💰${cost.money.toLocaleString('id-ID')} + 🌿${cost.herb}herb${cost.potion ? ` + 🧪${cost.potion}potion` : ''}`
        }).join('\n')

        return sendWithTemplate(
          dino, m,
          decorate(`*🤒 Semua Pet Sedang Sakit!*\n│\n│ Sembuhkan dulu:\n│\n${sickList}\n│\n│ 💡 *${usedPrefix}obatpet all* untuk sembuhkan sekaligus!`),
          { mentions: [m.sender] }
        )
      }

      // Cek stamina pet sehat
      const lowStamina = healthyPets.filter(p => dbUser[p + 'stamina'] < 20)
      if (lowStamina.length > 0) {
        const info = lowStamina.map(p => `│ • ${p}: ${dbUser[p + 'stamina']}`).join('\n')
        return sendWithTemplate(
          dino, m,
          decorate(`*⚡ Stamina Pet Kurang (min 20)!*\n│\n${info}\n│\n│ Gunakan: *${usedPrefix}feed [nama_pet]*`),
          { mentions: [m.sender] }
        )
      }

      const totalStamina = healthyPets.reduce((s, p) => s + dbUser[p + 'stamina'], 0)
      if (totalStamina < 80) {
        return sendWithTemplate(
          dino, m,
          decorate(`*⚡ Total stamina pet sehat kurang dari 80!*\n│\n│ Saat ini: ${totalStamina}\n│\n│ Gunakan *${usedPrefix}feed [nama_pet]*`),
          { mentions: [m.sender] }
        )
      }

      // Cooldown
      const elapsed = new Date() - dbUser.lastadventurepet
      const remain  = 3600000 - elapsed
      if (elapsed <= 3600000) {
        return sendWithTemplate(
          dino, m,
          decorate(`*⏳ Adventure Pet Cooldown!*\n│\n│ Tunggu *${clockString(remain)}* lagi.`),
          { mentions: [m.sender] }
        )
      }

      // === TIME SYSTEM ===
      const debuff    = hitungDebuff(0, 0, 0, 0.10)
      const timeInfo  = buildTimeInfo('adventurepet')
      const dropBonus = getDropBonus()

      let petStaminaMult = 1.0
      if (debuff.jam.kategori === 'SEPI')           petStaminaMult = 1.4
      else if (debuff.jam.jam >= 6 && debuff.jam.jam <= 11) petStaminaMult = 0.85
      else if (debuff.jam.kategori === 'SIBUK')     petStaminaMult = 1.15
      if (debuff.musim.key === 'kemarau')            petStaminaMult *= 1.2
      else if (debuff.musim.key === 'semi')          petStaminaMult *= 0.85

      const seasonMult = debuff.musim.mult['adventurepet'] || 1.0
      const dayMult    = debuff.hari.dayMult
      const timeMult   = debuff.jam.timeMult
      const capMult    = Math.min(timeMult * dayMult * seasonMult, 2.0)

      let totalExp = 0, petResult = ''
      let totalUang = 0, totalPotion = 0, totalDiamond = 0
      let newSickPets = [], failedPets = []

      // Info pet sakit yang dilewati
      if (sickPets.length > 0) {
        const skippedNames = sickPets.map(p => {
          const pd = PET_DATA.find(d => d.key === p)
          return `${pd.icon}${pd.name}`
        }).join(', ')
        petResult += `│ ⏭️ *Pet Dilewati (Sakit):* ${skippedNames}\n│\n`
      }

      // Proses pet SEHAT saja
      for (let pd of PET_DATA) {
        if (dbUser[pd.key] <= 0)        continue
        if (dbUser[pd.key + 'sick'])     continue

        const lvl = Math.max(1, Math.min(10, dbUser[pd.key]))

        // Stamina drain — selalu terjadi meski gagal
        const baseStaminaDrain  = Math.floor(Math.random() * 10) + 15
        const finalStaminaDrain = Math.floor(baseStaminaDrain * petStaminaMult)
        dbUser[pd.key + 'stamina'] = Math.max(0, dbUser[pd.key + 'stamina'] - finalStaminaDrain)

        // Chance gagal
        let failChance = 0.20 - (lvl * 0.01)
        if (debuff.jam.kategori === 'SEPI') failChance += 0.10
        if (debuff.musim.key === 'kemarau') failChance += 0.05
        failChance = Math.max(0.05, Math.min(0.35, failChance))

        const gagal = Math.random() < failChance
        if (gagal) {
          failedPets.push(pd)
          petResult += `│ ${pd.icon} *${pd.name}* Lv.${lvl} — ❌ *GAGAL* ⚡-${finalStaminaDrain}\n`
          // 8% chance langsung sakit
          if (Math.random() < 0.08) {
            dbUser[pd.key + 'sick'] = true
            newSickPets.push(pd)
            petResult += `│    🤒 *${pd.name} jatuh sakit akibat kegagalan!*\n`
          }
          continue
        }

        // Berhasil — hitung reward
        const cap         = baseUangCap(lvl)
        const baseUang    = Math.floor(Math.random() * cap)
        const baseExp     = Math.floor(Math.random() * 101) + 100
        const basePotion  = Math.floor(Math.random() * 3)
        const baseDiamond = Math.random() < 0.25 ? 1 : 0

        const finalUang    = Math.floor(baseUang * capMult)
        const finalExp     = Math.floor(baseExp * Math.min(timeMult * dayMult, 2.0))
        const finalPotion  = Math.max(0, Math.floor(basePotion * (1 + dropBonus / 200)))
        const finalDiamond = Math.random() < (baseDiamond * 0.25 + dropBonus / 400) ? 1 : 0

        totalUang    += finalUang
        totalPotion  += finalPotion
        totalDiamond += finalDiamond
        totalExp     += finalExp
        dbUser[pd.key + 'exp'] = (dbUser[pd.key + 'exp'] || 0) + finalExp

        petResult += `│ ${pd.icon} *${pd.name}* Lv.${lvl} [cap ${cap.toLocaleString('id-ID')}]\n`
        petResult += `│    💰${finalUang.toLocaleString('id-ID')} | 🧪${finalPotion} | 💎${finalDiamond} | ⚡-${finalStaminaDrain} | ✨+${finalExp}xp\n`

        // Chance sakit setelah berhasil
        let sickChance = 0.12
        if (petStaminaMult > 1.2)           sickChance += 0.05
        if (dbUser[pd.key + 'stamina'] < 30) sickChance += 0.08
        if (Math.random() < sickChance) {
          dbUser[pd.key + 'sick'] = true
          newSickPets.push(pd)
          petResult += `│    🤒 *${pd.name} jatuh sakit setelah petualangan!*\n`
        }
      }

      dbUser.money   = (dbUser.money || 0) + totalUang
      dbUser.potion  = (dbUser.potion || 0) + totalPotion
      dbUser.diamond = (dbUser.diamond || 0) + totalDiamond

      // Auto level up
      let levelUpMsg = ''
      for (let pd of PET_DATA) {
        if (dbUser[pd.key] <= 0 || dbUser[pd.key] >= 10) continue
        let xpNeeded = xpUntukNaikLevel(dbUser[pd.key])
        let looped   = 0
        while (dbUser[pd.key + 'exp'] >= xpNeeded && dbUser[pd.key] < 10 && looped < 10) {
          dbUser[pd.key + 'exp'] -= xpNeeded
          dbUser[pd.key]         += 1
          xpNeeded                = xpUntukNaikLevel(dbUser[pd.key])
          looped++
          levelUpMsg += `\n│ 🎉 *${pd.name}* naik ke Level *${dbUser[pd.key]}*! (Next: ${xpUntukNaikLevel(dbUser[pd.key]).toLocaleString('id-ID')} xp)`
        }
      }

      // XP Progress
      let xpProgressMsg = ''
      for (let pd of PET_DATA) {
        if (dbUser[pd.key] <= 0) continue
        const sickTag = dbUser[pd.key + 'sick'] ? ' 🤒' : ''
        if (dbUser[pd.key] >= 10) {
          xpProgressMsg += `│ ${pd.icon} ${pd.name} Lv.MAX${sickTag}\n`
        } else {
          const needed  = xpUntukNaikLevel(dbUser[pd.key])
          const current = dbUser[pd.key + 'exp']
          const pct     = Math.floor((current / needed) * 100)
          xpProgressMsg += `│ ${pd.icon} ${pd.name} Lv.${dbUser[pd.key]}${sickTag}: ${current.toLocaleString('id-ID')}/${needed.toLocaleString('id-ID')} xp (${pct}%)\n`
        }
      }

      // Pesan pet sakit baru
      let sickMsg = ''
      if (newSickPets.length > 0) {
        sickMsg = `\n│\n│ 🤒 *PET SAKIT SETELAH ADVENTURE!*\n`
        for (let pd of newSickPets) {
          const cost = HEAL_COST[pd.key]
          sickMsg += `│ ${pd.icon} *${pd.name}* perlu diobati!\n│    ➤ *${usedPrefix}obatpet ${pd.key}*\n│    💰${cost.money.toLocaleString('id-ID')} + 🌿${cost.herb}herb${cost.potion ? ` + 🧪${cost.potion}potion` : ''}\n`
        }
        const stillHealthy = PETS.filter(p => dbUser[p] > 0 && !dbUser[p + 'sick']).length
        const totalOwned   = PETS.filter(p => dbUser[p] > 0).length
        sickMsg += `│\n│ ⚠️ Pet sehat tersisa: *${stillHealthy}/${totalOwned}*`
        sickMsg += stillHealthy > 0 ? ` — Adventure masih bisa jalan!` : ` — Semua sakit, sembuhkan dulu!`
        sickMsg += `\n│ 💡 *${usedPrefix}obatpet all* untuk sembuhkan sekaligus`
      }

      const skippedSummary = sickPets.length > 0
        ? `\n│ ⏭️ Dilewati (sakit): ${sickPets.map(p => PET_DATA.find(d => d.key === p).name).join(', ')}`
        : ''

      dbUser.lastadventurepet = new Date() * 1

      return sendWithTemplate(
        dino, m,
        decorate(`*🐾 Hasil Adventure Pet!*
│
${petResult.trimEnd()}
│
│ 💰 Total Money   : *+${totalUang.toLocaleString('id-ID')}*
│ 🧪 Total Potion  : *+${totalPotion}*
│ 💎 Total Diamond : *+${totalDiamond}*
│ ✨ Total EXP     : *+${totalExp}*
│ ${failedPets.length > 0 ? `❌ Gagal (${failedPets.length}): ${failedPets.map(p => p.name).join(', ')}` : '✅ Semua pet sehat berhasil!'}${skippedSummary}
│
│ ⏱️ *Efek Waktu & Musim:*
│ ${timeInfo}
│ 🔢 Total Mult    : ×${capMult.toFixed(2)}
│ 🐾 Stamina Drain : ×${petStaminaMult.toFixed(2)} ${petStaminaMult > 1 ? '⬆️ (pet cepat lapar!)' : '⬇️ (kondisi prima!)'}${debuff.jam.kategori === 'SEPI' ? '\n│ ⚠️ JAM SEPI: Reward ×0.70, chance gagal +10%!' : ''}${debuff.musim.key === 'kemarau' ? '\n│ ☀️ KEMARAU: Drain ×1.2, chance gagal +5%!' : ''}${debuff.musim.key === 'semi' ? '\n│ 🌸 MUSIM SEMI: Stamina hemat & drop bonus!' : ''}${sickMsg}
│
│ 📊 *XP Progress Pet:*
${xpProgressMsg.trimEnd()}
│ 💡 XP naik level makin tinggi makin besar (exponential)!${levelUpMsg ? '\n│\n│ 🎊 *LEVEL UP!*' + levelUpMsg : ''}`),
        { mentions: [m.sender] }
      )
    }

  }
}
