const { sendWithTemplate }           = require('../../sendWithTemplate')
const { xpRange, getLevelInfo, progressBar } = require('./rpg-levelling')

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

    case 'levelup': 'menu'; {
      /* CONSTANTS */
      const roleList = [
        { level: 2,    role: 'Pendatang Baru! 🎉' },
        { level: 4,    role: 'Pejuang Awal ⚔️' },
        { level: 6,    role: 'Petualang Pemula 🛡️' },
        { level: 8,    role: 'Penjelajah Berani 🧭' },
        { level: 10,   role: 'Pahlawan Muda 🦸' },
        { level: 20,   role: 'Kesatria Tangguh ⚔️' },
        { level: 30,   role: 'Penakluk Medan 🎯' },
        { level: 40,   role: 'Komandan Siaga 🏹' },
        { level: 50,   role: 'Jenderal Perkasa 🛡️' },
        { level: 60,   role: 'Penjaga Legenda 🔥' },
        { level: 70,   role: 'Pemburu Harta 💎' },
        { level: 80,   role: 'Pelindung Alam 🌳' },
        { level: 90,   role: 'Pencipta Sejarah 📜' },
        { level: 100,  role: 'Legenda Hidup 🌟' },
        { level: 200,  role: 'Penguasa Dunia 🌍' },
        { level: 300,  role: 'Penguasa Alam Semesta 🌌' },
        { level: 400,  role: 'Penguasa Dimensi ⚡' },
        { level: 500,  role: 'Dewa Petir ⚡' },
        { level: 600,  role: 'Dewa Api 🔥' },
        { level: 700,  role: 'Dewa Air 🌊' },
        { level: 800,  role: 'Dewa Angin 🌪️' },
        { level: 900,  role: 'Penguasa Absolut 👑' },
        { level: 1000, role: 'Master Tanpa Tanding 🏆' },
      ]

      /* HELPER */

      /* HANDLER */
      const dbUser = global.db.data.users[m.sender]

      // Proses naik level — loop sampai EXP tidak cukup lagi
      let levelUp    = false
      let levelsGained = 0
      let { xp } = xpRange(dbUser.level)

      while (dbUser.exp >= xp) {
        dbUser.exp   -= xp
        dbUser.level++
        levelUp       = true
        levelsGained++

        const newRole = roleList.slice().reverse().find(r => dbUser.level >= r.level)
        if (newRole) dbUser.role = newRole.role

        ;({ xp } = xpRange(dbUser.level))
      }

      if (levelUp) {
        const { xpNeeded, progressXP, pct } = getLevelInfo(dbUser.level, dbUser.exp)
        const bar = progressBar(pct, 12)
        return sendWithTemplate(
          dino, m,
          decorate(`*🥳 Selamat Naik Level!*
│
│ ${levelsGained > 1 ? `⬆️ Naik *${levelsGained}* level sekaligus!` : '⬆️ Level UP!'}
│ 🎖️ Level baru : *${dbUser.level}*
│ 🏅 Role baru  : *${dbUser.role || 'Tidak Ada'}*
│
│ 📊 Progress ke level ${dbUser.level + 1}:
│ [${bar}] ${pct}%
│ ✨ *${progressXP.toLocaleString('id-ID')}* / *${xpNeeded.toLocaleString('id-ID')}* EXP
│
│ 📈 Tetap aktif untuk naik level lagi!`),
          { react: true, reactDone: '🎉', mentions: [m.sender] }
        )
      }

      // Belum naik level — tampilkan status
      const { xpNeeded, progressXP, sisaXP, pct } = getLevelInfo(dbUser.level, dbUser.exp)
      const bar = progressBar(pct, 12)

      return sendWithTemplate(
        dino, m,
        decorate(`*🌟 Status Level Kamu*
│
│ 🎖️ Level    : *${dbUser.level}*
│ 🏅 Role     : *${dbUser.role || '-'}*
│
│ 📊 Progress ke level ${dbUser.level + 1}:
│ [${bar}] ${pct}%
│ ✨ *${progressXP.toLocaleString('id-ID')}* / *${xpNeeded.toLocaleString('id-ID')}* EXP
│ 📈 Kurang   : *${sisaXP.toLocaleString('id-ID')} EXP* lagi
│
│ 💡 Tetap aktif untuk naik level dan buka role baru!`),
        { mentions: [m.sender] }
      )
    }

  }
}