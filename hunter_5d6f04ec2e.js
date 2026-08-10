const { sendWithTemplate } = require('../../sendWithTemplate')
const { hitungReward, hitungDebuff, buildTimeInfo } = require('./rpg-time-system.js')
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

    case 'hunter': 'menu'; {
      /* CONSTANTS */
      const TIMEOUT = 1800000 // 30 menit

      const MONSTERS = [
        { area: 1,  name: 'Goblin' },          { area: 1,  name: 'Slime' },             { area: 1,  name: 'Wolf' },
        { area: 2,  name: 'Nymph' },           { area: 2,  name: 'Skeleton' },           { area: 2,  name: 'Wolf' },
        { area: 3,  name: 'Baby Demon' },      { area: 3,  name: 'Ghost' },              { area: 3,  name: 'Zombie' },
        { area: 4,  name: 'Imp' },             { area: 4,  name: 'Witch' },              { area: 4,  name: 'Zombie' },
        { area: 5,  name: 'Ghoul' },           { area: 5,  name: 'Giant Scorpion' },     { area: 5,  name: 'Unicorn' },
        { area: 6,  name: 'Baby Robot' },      { area: 6,  name: 'Sorcerer' },           { area: 6,  name: 'Unicorn' },
        { area: 7,  name: 'Cecaelia' },        { area: 7,  name: 'Giant Piranha' },      { area: 7,  name: 'Mermaid' },
        { area: 8,  name: 'Giant Crocodile' }, { area: 8,  name: 'Nereid' },             { area: 8,  name: 'Mermaid' },
        { area: 9,  name: 'Demon' },           { area: 9,  name: 'Harpy' },              { area: 9,  name: 'Killer Robot' },
        { area: 10, name: 'Dullahan' },        { area: 10, name: 'Manticore' },          { area: 10, name: 'Killer Robot' },
        { area: 11, name: 'Baby Dragon' },     { area: 11, name: 'Young Dragon' },       { area: 11, name: 'Scaled Baby Dragon' },
        { area: 12, name: 'Kid Dragon' },      { area: 12, name: 'Not so young Dragon' },{ area: 12, name: 'Scaled Kid Dragon' },
        { area: 13, name: 'Definitely not so young Dragon' }, { area: 13, name: 'Teen Dragon' }, { area: 13, name: 'Scaled Teen Dragon' }
      ]

      /* HELPER */
      function ranNumb(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
      const dbUser = global.db.data.users[m.sender]
      const fmt = (n) => (n || 0).toLocaleString('id-ID')

      function delay(ms) { return new Promise(r => setTimeout(r, ms)) }
      function msToTime(duration) {
        let s = Math.floor((duration / 1000) % 60)
        let mi = Math.floor((duration / 60000) % 60)
        let h = Math.floor(duration / 3600000)
        return `${h} jam ${mi} menit ${s} detik`
      }

      /* HANDLER */
      if (dbUser.armor === 0 && dbUser.sword === 0) {
        return sendWithTemplate(dino, m, decorate(`*❌ Perlengkapan Tidak Lengkap!*
│
│ ➤ *${usedPrefix}craft armor* & *${usedPrefix}craft sword*`), { mentions: [m.sender] })
      }
      if (dbUser.armor === 0) {
        return sendWithTemplate(dino, m, decorate(`*❌ Armor Tidak Ada!*
│
│ ➤ *${usedPrefix}craft armor*`), { mentions: [m.sender] })
      }
      if (dbUser.sword === 0) {
        return sendWithTemplate(dino, m, decorate(`*❌ Sword Tidak Ada!*
│
│ ➤ *${usedPrefix}craft sword*`), { mentions: [m.sender] })
      }
      if ((dbUser.stamina || 0) < 30) {
        return sendWithTemplate(dino, m, decorate(`*❌ Stamina Tidak Cukup!*
│
│ Stamina Dibutuhkan : *30*
│ Stamina Kamu       : *${dbUser.stamina || 0}*
│
│ ➤ *${usedPrefix}eat*`), { mentions: [m.sender] })
      }

      const now = Date.now()
      if (now - (dbUser.lasthunter || 0) < TIMEOUT) {
        const sisa = msToTime((dbUser.lasthunter + TIMEOUT) - now)
        return sendWithTemplate(dino, m, decorate(`*⏳ Masih Cape Bang!*
│
│ Tunggu: *${sisa}*`), { mentions: [m.sender] })
      }

      // Set cooldown di awal — cegah race condition
      dbUser.lasthunter = now

      const area_monster = MONSTERS[Math.floor(Math.random() * MONSTERS.length)]
      const monster = area_monster.name
      const area = area_monster.area
      const monsterName = monster.toUpperCase()

      const debuff = hitungDebuff(
        ranNumb(18, 42),
        ranNumb(5, 80),
        ranNumb(15, 65),
        0.15
      )
      const timeInfo = buildTimeInfo('hunter')

      if (debuff.jam.kategori === 'SEPI') {
        debuff.finalChanceGagal = Math.min(0.85, debuff.finalChanceGagal + 0.08)
        debuff.finalHealthLoss += 10
      } else if (debuff.jam.kategori === 'SIBUK' && debuff.jam.jam >= 20) {
        debuff.finalHealthLoss += 5
      }

      await sendWithTemplate(dino, m, decorate(`*⚔️ Memulai Berburu Monster...*
│
│ Kamu memeriksa perlengkapan dan memasuki zona berbahaya...
│
│ 🥼 Armor Tier : *${dbUser.armor}*
│ ⚔️ Sword Tier : *${dbUser.sword}*
│
│ ${timeInfo}
${debuff.jam.kategori === 'SEPI' ? '│ ⚠️ JAM SEPI: Monster aktif tapi kamu mengantuk → Lebih berisiko!' : ''}
${debuff.jam.kategori === 'SIBUK' ? '│ 🔥 JAM SIBUK: Reward ×1.35 tapi monster lebih agresif!' : ''}
${debuff.musim.key === 'gugur' ? '│ 🍂 Musim Gugur: Monster paling gemuk dan banyak. Hunter bonus ×1.2!' : ''}`),
        { react: true, reactDone: '⚔️', mentions: [m.sender] })

      await delay(3000)
      await sendWithTemplate(dino, m, decorate(`*🗺️ Menjelajahi Area ${area}...*
│
│ Kamu bergerak menelusuri area berbahaya, mengincar monster...`),
        { mentions: [m.sender] })
      await delay(3000)
      await sendWithTemplate(dino, m, decorate(`*👁️ Monster Terdeteksi!*
│
│ Seekor *${monsterName}* muncul${debuff.jam.kategori === 'SEPI' ? ' dari kegelapan pekat' : ''}!
│ Kamu bersiap untuk menyerang...`),
        { mentions: [m.sender] })
      await delay(3000)

      const gagal = Math.random() < debuff.finalChanceGagal
      if (gagal) {
        const armorLoss = ranNumb(8, 35)
        const swordLoss = ranNumb(8, 35)
        const healthLoss = debuff.finalHealthLoss
        const staminaLoss = debuff.finalStaminaLoss

        dbUser.stamina = (dbUser.stamina || 0) - staminaLoss
        dbUser.health = (dbUser.health || 100) - healthLoss
        const armorRes = applyDurabilityLoss(dbUser, 'armor', armorLoss)
        const swordRes = applyDurabilityLoss(dbUser, 'sword', swordLoss)
        if (dbUser.health <= 0) dbUser.health = 10

        let gagalMsg = `*${monsterName}* terlalu kuat dan berhasil mengalahkanmu!\nKamu mundur dengan luka yang cukup parah.`
        if (debuff.jam.kategori === 'SEPI') gagalMsg = `Mengantuk di jam sepi, refleksmu melambat!\n*${monsterName}* memanfaatkan kelemahanmu dan menyerang balik dengan brutal!`

        return sendWithTemplate(dino, m, decorate(`*❌ Kalah Melawan Monster!*
│
│ ${gagalMsg}
│
│ 📊 *Status Setelah Pertarungan:*
│ ❤️ Health Berkurang    : *-${healthLoss}* (Sisa: ${dbUser.health})
│ ⚡ Stamina Berkurang   : *-${staminaLoss}* (Sisa: ${dbUser.stamina})
│ 🥼 Durability Armor    : *-${armorLoss}* (Sisa: ${dbUser.armordurability})${armorRes.msg}
│ ⚔️ Durability Sword    : *-${swordLoss}* (Sisa: ${dbUser.sworddurability})${swordRes.msg}
│ ⚠️ Chance Gagal        : ${Math.round(debuff.finalChanceGagal * 100)}% (${debuff.jam.nama})
│
│ ➤ *${usedPrefix}heal* untuk memulihkan health.
│ ➤ *${usedPrefix}eat* untuk mengisi stamina.`),
          { react: true, reactDone: '❌', mentions: [m.sender] })
      }

      const areaMultiplier = area / 13
      const gearBonus = Math.min(1 + ((dbUser.sword || 0) * 0.15) + ((dbUser.armor || 0) * 0.10), 4.0)
      const baseCoins = Math.min(
        Math.floor((Math.random() * 150000 + 5000) * areaMultiplier * gearBonus),
        150000
      )
      const baseExp = Math.floor((Math.random() * 20000 + 2000) * areaMultiplier * gearBonus)
      const reward = hitungReward('hunter', baseCoins, baseExp, 1, gearBonus)

      const healthLoss = debuff.finalHealthLoss
      const staminaLoss = debuff.finalStaminaLoss
      const armorLoss = ranNumb(20, 65)
      const swordLoss = ranNumb(15, 70)

      dbUser.health = (dbUser.health || 100) - healthLoss
      dbUser.stamina = (dbUser.stamina || 0) - staminaLoss
      const armorRes = applyDurabilityLoss(dbUser, 'armor', armorLoss)
      const swordRes = applyDurabilityLoss(dbUser, 'sword', swordLoss)
      if (dbUser.health <= 0) dbUser.health = 10

      dbUser.exp = (dbUser.exp || 0) + reward.finalExp
      dbUser.money = (dbUser.money || 0) + reward.finalMoney

      return sendWithTemplate(dino, m, decorate(`*✅ Monster Dikalahkan!*
│
│ *${monsterName}* berhasil dikalahkan!
│ Area: *${area}* | Gear Bonus: *×${gearBonus.toFixed(2)}*
│
│ 💰 Money : *+${fmt(reward.finalMoney)}*
│ ✨ EXP   : *+${fmt(reward.finalExp)}*
│
│ 📊 *Status Setelah Pertarungan:*
│ ❤️ Health Berkurang    : *-${healthLoss}* (Sisa: ${dbUser.health})
│ ⚡ Stamina Berkurang   : *-${staminaLoss}* (Sisa: ${dbUser.stamina})
│ 🥼 Durability Armor    : *-${armorLoss}* (Sisa: ${dbUser.armordurability})${armorRes.msg}
│ ⚔️ Durability Sword    : *-${swordLoss}* (Sisa: ${dbUser.sworddurability})${swordRes.msg}
${dbUser.armor === 0 ? `│ ❌ ARMOR RUSAK! ➤ *${usedPrefix}craft armor*` : ''}
${dbUser.sword === 0 ? `│ ❌ SWORD RUSAK! ➤ *${usedPrefix}craft sword*` : ''}
│
│ ⏱️ *Efek Waktu & Musim:*
│ ${timeInfo}
│ 🔢 Total Multiplier: ×${reward.totalMult}
│
│ ➤ *${usedPrefix}inv* untuk cek semua item.`),
        { react: true, reactDone: '✅', mentions: [m.sender] })
    }

  }
}