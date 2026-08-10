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

    case 'feed': 'menu'; {
      /* CONSTANTS */
      const PET_LIST = [
        { key: 'naga',    makanan: 'makanannaga',    stamina: 'nagastamina',    icon: 'Naga'    },
        { key: 'phonix',  makanan: 'makananphonix',   stamina: 'phonixstamina',  icon: 'Phonix'  },
        { key: 'kyubi',   makanan: 'makanankyubi',    stamina: 'kyubistamina',   icon: 'Kyubi'   },
        { key: 'griffin', makanan: 'makanangriffin',  stamina: 'griffinstamina', icon: 'Griffin' },
        { key: 'centaur', makanan: 'makanancentaur',  stamina: 'centaurstamina', icon: 'Centaur' },
      ]

      /* HELPER */
      const dbUser = global.db.data.users[m.sender]
      const type   = (args[0] || '').toLowerCase()

      function feedOnePet(petInfo) {
        if (dbUser[petInfo.key] <= 0) return `❌ Kamu tidak memiliki ${petInfo.icon}.`
        if (dbUser[petInfo.stamina] >= 100) return `⚡ Stamina ${petInfo.icon} sudah penuh.`
        let needed = Math.ceil((100 - dbUser[petInfo.stamina]) / 20)
        if (dbUser[petInfo.makanan] >= needed) {
          dbUser[petInfo.makanan] -= needed
          dbUser[petInfo.stamina] = 100
          return `✅ ${petInfo.icon} diberi makan ${needed}x → stamina penuh!`
        } else {
          return `⚠️ Makanan ${petInfo.icon} kurang. Butuh ${needed}, punya ${dbUser[petInfo.makanan] || 0}.`
        }
      }

      /* HANDLER */
      if (!type) {
        return usage(
          'Pilih pet yang ingin diberi makan!',
          '<nama_pet | all>',
          'Beri makan pet untuk memulihkan stamina',
          ['naga', 'phonix', 'kyubi', 'griffin', 'centaur', 'all']
        )
      }

      if (type === 'all') {
        const hasPet = PET_LIST.some(p => dbUser[p.key] > 0)
        if (!hasPet) {
          return sendWithTemplate(
            dino, m,
            decorate('*❌ Kamu tidak memiliki pet.*\n│ Beli pet dulu di shop!'),
            { mentions: [m.sender] }
          )
        }

        let results = ''
        for (let p of PET_LIST) {
          if (dbUser[p.key] <= 0) continue
          results += `│ ${feedOnePet(p)}\n`
        }

        return sendWithTemplate(
          dino, m,
          decorate(`*🍖 Feed All Pet*\n│\n${results.trimEnd()}`),
          { mentions: [m.sender] }
        )
      }

      const found = PET_LIST.find(p => p.key === type)
      if (!found) {
        return usage(
          'Nama pet tidak dikenali!',
          '<nama_pet | all>',
          'Beri makan pet untuk memulihkan stamina',
          ['naga', 'phonix', 'kyubi', 'griffin', 'centaur', 'all']
        )
      }

      const result = feedOnePet(found)
      return sendWithTemplate(
        dino, m,
        decorate(`*🍖 Feed Pet — ${found.icon}*\n│\n│ ${result}`),
        { mentions: [m.sender] }
      )
    }

  }
}
