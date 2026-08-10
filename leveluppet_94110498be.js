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

  switch (command) {

    case 'leveluppet': 'menu'; {
      /* CONSTANTS */
      const PETS = [
        { name: 'naga',    exp: 'nagaexp'    },
        { name: 'phonix',  exp: 'phonixexp'  },
        { name: 'griffin', exp: 'griffinexp' },
        { name: 'kyubi',   exp: 'kyubiexp'   },
        { name: 'centaur', exp: 'centaurexp' },
      ]

      /* HELPER */
      const dbUser = global.db.data.users[m.sender]

      // Init EXP semua pet
      for (let pet of PETS) {
        if (!dbUser[pet.exp] || isNaN(dbUser[pet.exp])) dbUser[pet.exp] = 0
      }

      /* HANDLER */
      let petStatus   = []
      let maxLvlPets  = []
      let allMaxLevel = true
      let hasPets     = false

      for (let pet of PETS) {
        const { name, exp: expKey } = pet

        if (!dbUser[expKey] || isNaN(dbUser[expKey])) dbUser[expKey] = 0
        if (dbUser[name] <= 0) continue

        hasPets = true

        if (dbUser[name] >= 10) {
          maxLvlPets.push(name)
          petStatus.push(`│ Pet: *${name}*\n│ Level: *MAX (10)*\n│ Exp saat ini: *${dbUser[expKey].toLocaleString('id-ID')}*`)
          continue
        }

        allMaxLevel = false

        // Formula exponential — konsisten dengan adventure-pet
        let xpNeeded  = Math.floor(1000 * Math.pow(dbUser[name], 1.8))
        let leveledUp = false

        while (dbUser[expKey] >= xpNeeded && dbUser[name] < 10) {
          dbUser[expKey] -= xpNeeded
          dbUser[name]   += 1
          xpNeeded        = Math.floor(1000 * Math.pow(dbUser[name], 1.8))
          leveledUp       = true
        }

        const nextXp  = Math.floor(1000 * Math.pow(dbUser[name], 1.8))
        let statusLine = `│ Pet: *${name}*\n│ Level: *${dbUser[name]}*${dbUser[name] >= 10 ? ' (MAX)' : ''}\n│ Exp saat ini: *${dbUser[expKey].toLocaleString('id-ID')}*\n│ Butuh *${Math.max(0, nextXp - dbUser[expKey]).toLocaleString('id-ID')}* exp lagi (formula: 1000×lv^1.8)`
        if (leveledUp) statusLine += `\n│ ✅ *${name}* naik level ke *${dbUser[name]}*!`
        petStatus.push(statusLine)
      }

      if (!hasPets) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Kamu tidak memiliki pet saat ini.*\n│ Beli pet crate di *${usedPrefix}shop buy pet*`),
          { mentions: [m.sender] }
        )
      }

      let finalMsg = `*🐾 Status Pet*\n│\n${petStatus.join('\n│\n')}`
      if (maxLvlPets.length > 0) finalMsg += `\n│\n│ 🏆 Pet MAX Level: *${maxLvlPets.join(', ')}*`
      if (allMaxLevel)            finalMsg += `\n│\n│ ⭐ Semua pet sudah level maksimal (10)!`

      return sendWithTemplate(
        dino, m,
        decorate(finalMsg),
        { mentions: [m.sender] }
      )
    }

  }
}
