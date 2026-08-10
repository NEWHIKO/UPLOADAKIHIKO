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

    case 'open': 'menu'; {
      /* CONSTANTS */
      const tfinventory = {
        tfcrates: {
          common: true,
          uncommon: true,
          mythic: true,
          legendary: true,
          pet: true,
        },
        tfpets: {
          naga: 1,
          centaur: 1,
          kyubi: 1,
          griffin: 1,
          phonix: 1,
        }
      }

      const maxCrates = 20

      function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min
      }

      function generateArray(length, min, max) {
        return Array.from({ length }, () => getRandomInt(min, max))
      }

      function generateArrayWithChance(length, chance) {
        return Array.from({ length }, () => (Math.random() < chance ? 1 : 0))
      }

      const rewards = {
        common: {
          money:   generateArray(30, 100, 200),
          exp:     generateArray(25, 50, 100),
          trash:   generateArray(30, 0, 5),
          potion:  generateArrayWithChance(15, 0.10),
          common:  generateArrayWithChance(10, 0.10),
        },
        uncommon: {
          money:   generateArray(30, 100, 300),
          exp:     generateArray(25, 50, 200),
          trash:   generateArray(30, 0, 4),
          string:  generateArray(30, 0, 3),
          potion:  generateArrayWithChance(15, 0.20),
          uncommon:generateArrayWithChance(10, 0.10),
          iron:    generateArrayWithChance(10, 0.10),
        },
        mythic: {
          money:   generateArray(35, 100, 1000),
          exp:     generateArray(30, 50, 500),
          trash:   generateArray(35, 0, 10),
          string:  generateArray(33, 0, 10),
          iron:    generateArray(30, 0, 5),
          potion:  generateArrayWithChance(15, 0.50),
          mythic:  generateArrayWithChance(10, 0.10),
          diamond: generateArrayWithChance(10, 0.10),
        },
        legendary: {
          money:   generateArray(35, 100, 1500),
          exp:     generateArray(30, 50, 1000),
          trash:   generateArray(35, 0, 15),
          string:  generateArray(33, 0, 15),
          iron:    generateArray(30, 0, 8),
          potion:  generateArray(40, 0, 10),
          gold:    generateArrayWithChance(20, 0.10),
          coal:    generateArrayWithChance(30, 0.20),
          legendary:generateArrayWithChance(10, 0.10),
          diamond: generateArrayWithChance(25, 0.10),
        },
        pet: {
          naga:    generateArrayWithChance(10, 0.05),
          centaur: generateArrayWithChance(10, 0.05),
          kyubi:   generateArrayWithChance(10, 0.05),
          griffin: generateArrayWithChance(10, 0.05),
          phonix:  generateArrayWithChance(10, 0.05),
        }
      }

      const emojiMap = {
        money: '💰', exp: '✨', trash: '🗑️', potion: '🧪',
        string: '🕸️', iron: '⛓️', diamond: '💎', gold: '🥇',
        coal: '🖤', common: '⚪', uncommon: '🟢', mythic: '🟣',
        legendary: '🟡', pet: '🎫',
        naga: '🐉', centaur: '🐎', kyubi: '🦊', griffin: '🦅', phonix: '🦜'
      }

      const rarityBadge = {
        common: '⚪ COMMON',
        uncommon: '🟢 UNCOMMON',
        mythic: '🟣 MYTHIC',
        legendary: '🟡 LEGENDARY',
        pet: '🎫 PET'
      }

      const zonkChance = {
        common: 0.20,
        uncommon: 0.12,
        mythic: 0.06,
        legendary: 0.03,
        pet: 0.00
      }

      /* HELPER */
      const dbUser = global.db.data.users[m.sender]
      const fmt = (n) => (n || 0).toLocaleString('id-ID')
      const emo = (key) => emojiMap[key] || '📦'

      function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

      function isNumber(number) { return !isNaN(number) && number !== '' }

      function pickRandom(list) {
        return list[Math.floor(Math.random() * list.length)]
      }

      /* HANDLER */
      const sapaan = pickRandom([
        '🎁 Ayo buka hadiahmu, semoga beruntung!',
        '✨ Siapa tau dapat yang legendaris hari ini!',
        '🎰 Keberuntungan ada di tanganmu!',
        '📦 Buka crate, dapatkan kejutan!',
        '🍀 Semoga dapet yang rare ya!'
      ])

      const stokCrate = Object.keys(tfinventory.tfcrates)
        .map(v => dbUser[v] > 0 ? `│ ${emo(v)} ${v.charAt(0).toUpperCase() + v.slice(1).padEnd(9)}: *${fmt(dbUser[v])}*` : null)
        .filter(Boolean)
        .join('\n')

      const menuStr = decorate(`*📦 OPEN CRATE*
│
│ ${sapaan}
│
│ ➤ *${usedPrefix}open <crate> <jumlah>*
│ ➤ Contoh: *${usedPrefix}open mythic 3*
│ ➤ Max buka: *${maxCrates}x* per sekali
│
│ *📦 Stok Crate Kamu:*
│ ┌───────────────────
${stokCrate || '│ ❌ Tidak punya crate apapun'}
│ └──────────────────
│
│ *📋 Jenis Crate:*
│ ┌───────────────────
│ │ ⚪ common    — Dasar, reward kecil
│ │ 🟢 uncommon  — Lumayan, ada bonus
│ │ 🟣 mythic    — Bagus, reward besar
│ │ 🟡 legendary — Terbaik, reward maksimal
│ │ 🎫 pet       — Chance dapat peliharaan!
│ └──────────────────`)

      const type = (args[0] || '').toLowerCase()
      const count = Math.floor(
        isNumber(args[1])
          ? Math.min(Math.max(parseInt(args[1]), 1), maxCrates)
          : 1
      )

      if (!type || !(type in rewards)) {
        return sendWithTemplate(dino, m, menuStr, { mentions: [m.sender] })
      }

      // Cek stok
      if ((dbUser[type] || 0) < count) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Crate Tidak Cukup!*
│
│ ${emo(type)} *${type.charAt(0).toUpperCase() + type.slice(1)} Crate*
│
│ ┌───────────────────
│ │ 📦 Mau Buka  : *${count}x*
│ │ 📦 Stok Kamu : *${fmt(dbUser[type])}*
│ │ ❌ Kurang    : *${count - (dbUser[type] || 0)}x*
│ └──────────────────
│
│ ➤ *${usedPrefix}shop buy ${type} ${count - (dbUser[type] || 0)}* untuk beli crate.`),
          { mentions: [m.sender] }
        )
      }

      // Cek cooldown (8 detik)
      if (dbUser.lastopen && Date.now() - dbUser.lastopen < 8000) {
        const sisa = Math.ceil((8000 - (Date.now() - dbUser.lastopen)) / 1000)
        return sendWithTemplate(
          dino, m,
          decorate(`*⏳ Tunggu Sebentar!*
│
│ Kamu masih dalam cooldown membuka crate.
│
│ ⏱️ Tunggu: *${sisa} detik lagi*`),
          { mentions: [m.sender] }
        )
      }

      const badge = rarityBadge[type] || type.toUpperCase()
      const rare = rewards[type]

      // ── BUKA CRATE ──
      let totalGains = {}
      let zonkCount = 0
      let petGained = []
      let petZonk = false

      // Kurangi crate
      dbUser[type] = (dbUser[type] || 0) - count

      // 🔒 Set cooldown di awal sebelum delay
      dbUser.lastopen = Date.now()

      for (let i = 0; i < count; i++) {
        // ── PET CRATE ──
        if (type === 'pet') {
          const allOwned = Object.keys(tfinventory.tfpets).every(p => dbUser[p] > 0)
          if (allOwned) {
            dbUser.money = (dbUser.money || 0) + 1000
            totalGains.money = (totalGains.money || 0) + 1000
          } else {
            if (Math.random() < 0.02) {
              const available = Object.keys(tfinventory.tfpets).filter(p => !dbUser[p] || dbUser[p] === 0)
              if (available.length > 0) {
                const pet = pickRandom(available)
                dbUser[pet] = 1
                petGained.push(pet)
              }
            } else {
              petZonk = true
            }
          }
          continue
        }

        // ── ZONK CHECK ──
        const isZonk = Math.random() < (zonkChance[type] || 0)
        if (isZonk) {
          zonkCount++
          continue
        }

        // ── NORMAL CRATE ──
        for (let item in rare) {
          const pool = rare[item]
          let gain = 0
          if (Array.isArray(pool)) {
            const rand = pool[Math.floor(Math.random() * pool.length)]
            gain = rand * 1
          } else {
            gain = pool * 1
          }
          if (gain > 0) {
            dbUser[item] = (dbUser[item] || 0) + gain
            totalGains[item] = (totalGains[item] || 0) + gain
          }
        }
      }

      // ── BUILD RESULT ──
      const hasilList = Object.entries(totalGains)
        .filter(([_, v]) => v > 0)
        .map(([k, v]) => `│ ${emo(k)} ${k.padEnd(10)}: *+${fmt(v)}*`)
        .join('\n')

      const petList = petGained.map(p => `│ ${emo(p)} *${p.charAt(0).toUpperCase() + p.slice(1)}* — Pet Baru! 🎉`).join('\n')

      const zonkMsg = zonkCount > 0
        ? `│ 💨 Zonk       : *${zonkCount}x* (tidak dapat apapun)`
        : ''

      const petZonkMsg = (type === 'pet' && petZonk && petGained.length === 0 && !Object.keys(totalGains).length)
        ? `│ 💨 Tidak dapat pet kali ini...` : ''

      const allZonk = zonkCount === count
      const hadLegendary = totalGains.legendary > 0 || totalGains.diamond > 0 || totalGains.gold > 0
      const hadPet = petGained.length > 0

      let reactEmoji = '📦'
      if (hadPet) reactEmoji = '🎉'
      else if (hadLegendary) reactEmoji = '💎'
      else if (allZonk) reactEmoji = '💨'
      else if (Object.keys(totalGains).length > 0) reactEmoji = '✅'

      let komentar = ''
      if (hadPet) {
        komentar = pickRandom([
          '🎉 JACKPOT! Kamu dapat pet baru yang langka!',
          '🌟 LUAR BIASA! Pet baru masuk kandang!',
          '👑 EPIC! Pet impianmu akhirnya didapat!'
        ])
      } else if (hadLegendary) {
        komentar = pickRandom([
          '💎 Wow, dapat item berharga!',
          '🌟 Keberuntunganmu luar biasa hari ini!',
          '🔥 Item langka berhasil didapatkan!'
        ])
      } else if (allZonk) {
        komentar = pickRandom([
          '💨 Apes banget, semua zonk hari ini...',
          '😭 Coba lagi, mungkin besok lebih beruntung!',
          '🎲 Nasib-nasiban, kali ini semua zonk!'
        ])
      } else if (zonkCount > 0) {
        komentar = pickRandom([
          `😅 Lumayan, tapi ada ${zonkCount}x zonk juga...`,
          `🎯 Ada hasilnya, tapi ${zonkCount}x kurang beruntung.`,
          `📊 Campuran nih, ${zonkCount}x zonk tapi ada yang dapat!`
        ])
      } else {
        komentar = pickRandom([
          '✨ Lumayan! Crate terbuka dengan hasil bagus!',
          '🎁 Tidak ada zonk, semua dapat hadiah!',
          '📦 Hasil memuaskan, buka lagi yuk!',
          '😄 Lancar! Semua crate berhasil dibuka!'
        ])
      }

      await sendWithTemplate(
        dino, m,
        decorate(`*⏳ Membuka Crate...*
│
│ ${emo(type)} Membuka *${count}x ${type}*...`),
        { react: true, reactDone: reactEmoji, mentions: [m.sender] }
      )

      await delay(2000)

      return sendWithTemplate(
        dino, m,
        decorate(`*📦 OPEN ${badge}*
│
│ ${komentar}
│
│ 📊 Buka: *${count}x ${emo(type)} ${type}*
│
│ *🎁 Hasil Pembukaan:*
│ ┌───────────────────
${hasilList || ''}
${petList || ''}
${zonkMsg || ''}
${petZonkMsg || ''}
│ └──────────────────
│
│ *📦 Sisa Crate:*
│ ┌───────────────────
│ │ ${emo(type)} ${type.padEnd(10)}: *${fmt(dbUser[type])}*
│ └──────────────────
│
│ ➤ *${usedPrefix}open ${type} <jumlah>* untuk buka lagi
│ ➤ *${usedPrefix}inv* untuk cek semua item`),
        { react: true, reactDone: '✅', mentions: [m.sender] }
      )
    }

  }
}