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

    case 'roleku': 'menu'; {
      /* CONSTANTS */
      const roleList = [
        { level: 2,    role: 'Pendatang Baru 🎉' },
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
      const dbUser = global.db.data.users[m.sender]
      const fmt = (n) => (n || 0).toLocaleString('id-ID')

      function pickRandom(list) {
        return list[Math.floor(Math.random() * list.length)]
      }

      function progressBar(current, max, len = 10) {
        if (!max || max <= 0) return '░'.repeat(len)
        const filled = Math.max(0, Math.min(Math.round((current / max) * len), len))
        return '█'.repeat(filled) + '░'.repeat(len - filled)
      }

      /* HANDLER */
      // Tentukan role saat ini
      const currentRoleObj = roleList.find(r => (dbUser.level || 0) <= r.level) || roleList[roleList.length - 1]
      dbUser.role = currentRoleObj.role

      // Tentukan role berikutnya
      const currentIndex = roleList.indexOf(currentRoleObj)
      const nextRoleObj = roleList[currentIndex + 1] || null
      const levelNeeded = nextRoleObj ? nextRoleObj.level - (dbUser.level || 0) : 0

      // Progress bar
      const prevLevel = currentIndex > 0 ? roleList[currentIndex - 1].level : 0
      const bar = progressBar(
        (dbUser.level || 0) - prevLevel,
        currentRoleObj.level - prevLevel
      )
      const pct = Math.min(100, Math.round(
        (((dbUser.level || 0) - prevLevel) / (currentRoleObj.level - prevLevel)) * 100
      ))

      const sapaan = pickRandom([
        '🎖️ Inilah gelar kebanggaanmu!',
        '⚔️ Role kamu saat ini sudah sangat keren!',
        '🌟 Terus naik level untuk role yang lebih tinggi!',
        '🏆 Perjalananmu masih panjang, terus semangat!',
        '👑 Buktikan dirimu layak dengan role tertinggi!'
      ])

      // Daftar role dengan penanda posisi user
      const roleBoard = roleList.map((r) => {
        const isCurrent = r.role === currentRoleObj.role
        const isPassed  = (dbUser.level || 0) > r.level
        const icon = isCurrent ? '▶' : isPassed ? '✅' : '○'
        return `│ ${icon} Lv.${String(r.level).padEnd(5)} ${r.role}${isCurrent ? ' ← Kamu' : ''}`
      }).join('\n')

      const progressSection = nextRoleObj
        ? `│ 🎯 Target    : *${nextRoleObj.role}*\n│ 📏 Level     : *${dbUser.level || 0} / ${nextRoleObj.level}*\n│ ⬆️ Sisa      : *${levelNeeded} level lagi*\n│ [${bar}] ${pct}%`
        : `│ 👑 *Role Tertinggi sudah dicapai!*\n│ 🏆 Master Tanpa Tanding — kamu terkuat!`

      return sendWithTemplate(
        dino, m,
        decorate(`*🎖️ ROLE & LEVEL*\n│\n│ ${sapaan}\n│\n│ *📊 Status Kamu:*\n│ ┌────────\n│ │ 👤 Level    : *${fmt(dbUser.level || 0)}*\n│ │ ✨ EXP      : *${fmt(dbUser.exp || 0)}*\n│ │ 🎖️ Role     : *${currentRoleObj.role}*\n│ └─────\n│\n│ *📈 Progress ke Role Berikutnya:*\n│ ┌────────\n│ ${progressSection}\n│ └─────\n│\n│ *📋 Daftar Semua Role:*\n│ ┌────────\n${roleBoard}\n│ └─────\n│\n│ ✅ = Sudah dilewati  ▶ = Role kamu  ○ = Belum dicapai\n│\n│ ➤ *${usedPrefix}profile* untuk lihat profil lengkap\n│ ➤ *${usedPrefix}lb level* untuk lihat leaderboard level`),
        { mentions: [m.sender] }
      )
    }

  }
}