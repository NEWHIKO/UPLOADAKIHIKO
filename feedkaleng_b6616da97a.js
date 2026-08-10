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

    case 'feedkaleng': 'menu'; {
      /* CONSTANTS */
      const VALID_PETS = ['naga', 'phonix', 'griffin', 'kyubi', 'centaur']

      /* HELPER */
      const dbUser  = global.db.data.users[m.sender]
      const petName = (args[0] || '').toLowerCase()
      const jumlah  = parseInt(args[1]) || 1

      /* HANDLER */
      if (!petName || !VALID_PETS.includes(petName)) {
        return usage(
          'Tentukan nama pet dan jumlah kaleng!',
          '<nama_pet> [jumlah]',
          'Pakai kaleng dari mulung sebagai makanan darurat pet\n1 kaleng = 10 stamina (lebih hemat dari makanan normal)',
          ['naga 5', 'phonix 3', 'griffin 1']
        )
      }

      if (!dbUser[petName] || dbUser[petName] <= 0) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Kamu tidak punya pet ${petName}!*`),
          { mentions: [m.sender] }
        )
      }

      const staminaKey = `${petName}stamina`
      const curStamina = dbUser[staminaKey] || 0

      if (curStamina >= 100) {
        return sendWithTemplate(
          dino, m,
          decorate(`*✅ Stamina ${petName} sudah penuh (100)!*\n│ Tidak perlu feed.`),
          { mentions: [m.sender] }
        )
      }

      const kaleng = dbUser.kaleng || 0
      if (kaleng < jumlah) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Kaleng tidak cukup!*\n│\n│ Punya  : *${kaleng}*\n│ Butuh  : *${jumlah}*\n│\n│ Dapatkan kaleng dari *${usedPrefix}mulung*`),
          { mentions: [m.sender] }
        )
      }

      const staminaAdd  = Math.min(jumlah * 10, 100 - curStamina)
      const kalengUsed  = Math.ceil(staminaAdd / 10)

      dbUser.kaleng       = (dbUser.kaleng || 0) - kalengUsed
      dbUser[staminaKey]  = curStamina + staminaAdd

      return sendWithTemplate(
        dino, m,
        decorate(`*🥫 Feed ${petName} dengan Kaleng Berhasil!*
│
│ 📦 Kaleng dipakai : *-${kalengUsed}*
│ ⚡ Stamina ${petName} : *${curStamina} → ${dbUser[staminaKey]}*
│
│ Sisa kaleng       : *${dbUser.kaleng}*`),
        { mentions: [m.sender] }
      )
    }

  }
}
