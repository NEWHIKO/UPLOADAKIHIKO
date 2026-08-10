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

    case 'leaderboard': 'menu';
    case 'lb':  {
      /* CONSTANTS */
      const len = 10

      /* HELPER */
      // Hitung total hewan & ikan
      const totalHewan = (u) =>
        (u.ayam||0)+(u.kambing||0)+(u.sapi||0)+(u.kerbau||0)+(u.babi||0)+
        (u.harimau||0)+(u.banteng||0)+(u.monyet||0)+(u.babihutan||0)+
        (u.panda||0)+(u.gajah||0)+(u.buaya||0)

      const totalIkan = (u) =>
        (u.paus||0)+(u.lele||0)+(u.bawal||0)+(u.nila||0)+
        (u.kepiting||0)+(u.udang||0)

      function pickRandom(list) {
        return list[Math.floor(Math.random() * list.length)]
      }

      const getRoleName = (level) => {
        const roles = [
          [2,    'Pendatang Baru 🎉'],
          [4,    'Pejuang Awal ⚔️'],
          [6,    'Petualang Pemula 🛡️'],
          [8,    'Penjelajah Berani 🧭'],
          [10,   'Pahlawan Muda 🦸'],
          [20,   'Kesatria Tangguh ⚔️'],
          [30,   'Penakluk Medan 🎯'],
          [40,   'Komandan Siaga 🏹'],
          [50,   'Jenderal Perkasa 🛡️'],
          [60,   'Penjaga Legenda 🔥'],
          [70,   'Pemburu Harta 💎'],
          [80,   'Pelindung Alam 🌳'],
          [90,   'Pencipta Sejarah 📜'],
          [100,  'Legenda Hidup 🌟'],
          [200,  'Penguasa Dunia 🌍'],
          [300,  'Penguasa Alam Semesta 🌌'],
          [400,  'Penguasa Dimensi ⚡'],
          [500,  'Dewa Petir ⚡'],
          [600,  'Dewa Api 🔥'],
          [700,  'Dewa Air 🌊'],
          [800,  'Dewa Angin 🌪️'],
          [900,  'Penguasa Absolut 👑'],
          [1000, 'Master Tanpa Tanding 🏆']
        ]
        for (const [lvl, name] of roles) {
          if (level <= lvl) return name
        }
        return 'Master Tanpa Tanding 🏆'
      }

      /* HANDLER */
      const users = global.db.data.users
      const type = (args[0] || '').toLowerCase()

      // Semua kategori
      const kategori = {
        // ── UMUM ──
        level:    { title: '🌟 Level',          key: 'level',    fmt: v => `Lv.${v}` },
        exp:      { title: '✨ EXP',             key: 'exp',      fmt: v => v.toLocaleString('id-ID') },
        role:     { title: '🎖️ Role',            key: 'level',    fmt: v => getRoleName(v) },
        // ── KEUANGAN ──
        money:    { title: '💰 Money',           key: 'money',    fmt: v => v.toLocaleString('id-ID') },
        bank:     { title: '🏦 ATM/Bank',        key: 'bank',     fmt: v => v.toLocaleString('id-ID') },
        // ── ITEM BERHARGA ──
        diamond:  { title: '💎 Diamond',         key: 'diamond',  fmt: v => v.toLocaleString('id-ID') },
        gold:     { title: '🥇 Gold',            key: 'gold',     fmt: v => v.toLocaleString('id-ID') },
        iron:     { title: '⛓️ Iron',            key: 'iron',     fmt: v => v.toLocaleString('id-ID') },
        // ── MATERIAL ──
        wood:     { title: '🪵 Wood',            key: 'wood',     fmt: v => v.toLocaleString('id-ID') },
        rock:     { title: '🪨 Rock',            key: 'rock',     fmt: v => v.toLocaleString('id-ID') },
        string:   { title: '🕸️ String',          key: 'string',   fmt: v => v.toLocaleString('id-ID') },
        coal:     { title: '🖤 Coal',            key: 'coal',     fmt: v => v.toLocaleString('id-ID') },
        // ── SAMPAH & MULUNG ──
        botol:    { title: '🍶 Botol',           key: 'botol',    fmt: v => v.toLocaleString('id-ID') },
        kaleng:   { title: '🥫 Kaleng',          key: 'kaleng',   fmt: v => v.toLocaleString('id-ID') },
        kardus:   { title: '📦 Kardus',          key: 'kardus',   fmt: v => v.toLocaleString('id-ID') },
        trash:    { title: '🗑️ Trash',           key: 'trash',    fmt: v => v.toLocaleString('id-ID') },
        // ── CRATE ──
        common:   { title: '⚪ Common Crate',    key: 'common',   fmt: v => v.toLocaleString('id-ID') },
        uncommon: { title: '🟢 Uncommon Crate',  key: 'uncommon', fmt: v => v.toLocaleString('id-ID') },
        mythic:   { title: '🟣 Mythic Crate',    key: 'mythic',   fmt: v => v.toLocaleString('id-ID') },
        legendary:{ title: '🟡 Legendary Crate', key: 'legendary',fmt: v => v.toLocaleString('id-ID') },
        // ── BUAH ──
        pisang:   { title: '🍌 Pisang',          key: 'pisang',   fmt: v => v.toLocaleString('id-ID') },
        mangga:   { title: '🥭 Mangga',          key: 'mangga',   fmt: v => v.toLocaleString('id-ID') },
        anggur:   { title: '🍇 Anggur',          key: 'anggur',   fmt: v => v.toLocaleString('id-ID') },
        jeruk:    { title: '🍊 Jeruk',           key: 'jeruk',    fmt: v => v.toLocaleString('id-ID') },
        apel:     { title: '🍎 Apel',            key: 'apel',     fmt: v => v.toLocaleString('id-ID') },
        // ── HEWAN & IKAN (total gabungan) ──
        hewan:    { title: '🐾 Total Hewan',     key: '__hewan',  fmt: v => v.toLocaleString('id-ID') + ' ekor', custom: totalHewan },
        ikan:     { title: '🐟 Total Ikan',      key: '__ikan',   fmt: v => v.toLocaleString('id-ID') + ' ekor', custom: totalIkan },
      }

      // Grup kategori untuk menu
      const grup = {
        umum:      { label: '📊 UMUM',             items: ['level','exp','role'] },
        keuangan:  { label: '💰 KEUANGAN',          items: ['money','bank'] },
        item:      { label: '💎 ITEM BERHARGA',     items: ['diamond','gold','iron'] },
        material:  { label: '📦 MATERIAL',          items: ['wood','rock','string','coal'] },
        mulung:    { label: '♻️ SAMPAH & MULUNG',   items: ['botol','kaleng','kardus','trash'] },
        crate:     { label: '📦 CRATE',             items: ['common','uncommon','mythic','legendary'] },
        buah:      { label: '🌿 BUAH',              items: ['pisang','mangga','anggur','jeruk','apel'] },
        makhluk:   { label: '🐾 HEWAN & IKAN',      items: ['hewan','ikan'] },
      }

      // ── Menu utama ──
      if (!type || type === 'help') {
        const menuStr = Object.entries(grup).map(([key, g]) => {
          const lines = g.items.map(k => `➤ *${usedPrefix}lb ${k}*`).join('\n')
          return `*${g.label}*\n${lines}`
        }).join('\n\n')

        return sendWithTemplate(
          dino, m,
          decorate(`*🏆 LEADERBOARD*
│
│ Pilih kategori yang ingin dilihat:
│
${menuStr}
│
│ Atau ketik kategori grup:
│ ➤ *${usedPrefix}lb umum*
│ ➤ *${usedPrefix}lb keuangan*
│ ➤ *${usedPrefix}lb item*
│ ➤ *${usedPrefix}lb material*
│ ➤ *${usedPrefix}lb mulung*
│ ➤ *${usedPrefix}lb crate*
│ ➤ *${usedPrefix}lb buah*
│ ➤ *${usedPrefix}lb makhluk*`),
          { mentions: [m.sender] }
        )
      }

      const medal = (i) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`

      // ── Cek apakah input adalah nama grup ──
      if (grup[type]) {
        const g = grup[type]
        const sapaan = pickRandom([
          `🔥 Para jawara kategori *${g.label}*!`,
          `🏆 Siapa yang terdepan di *${g.label}*?`,
          `⚔️ Persaingan sengit di *${g.label}*!`,
          `👑 Raja-raja *${g.label}* sudah berkumpul!`,
          `🌟 Daftar terkuat *${g.label}* saat ini!`
        ])

        await sendWithTemplate(
          dino, m,
          decorate(`*⏳ Generate Leaderboard...*
│
│ Sedang menyusun data ${g.label}...`),
          { mentions: [m.sender] }
        )

        // Beri jeda async agar event loop tidak blocking
        await new Promise(resolve => setImmediate(resolve))

        let allMentions = []
        const sections = []

        for (const catKey of g.items) {
          const cat = kategori[catKey]
          if (!cat) continue

          // Beri jeda tiap kategori agar tidak ngelag
          await new Promise(resolve => setImmediate(resolve))

          let sorted
          if (cat.custom) {
            sorted = Object.entries(users)
              .map(([jid, u]) => [jid, cat.custom(u)])
              .sort((a, b) => b[1] - a[1])
          } else {
            sorted = Object.entries(users)
              .filter(([_, u]) => typeof u[cat.key] === 'number')
              .sort(([, a], [, b]) => (b[cat.key] || 0) - (a[cat.key] || 0))
              .map(([jid, u]) => [jid, u[cat.key] || 0])
          }

          const myRank = sorted.findIndex(([jid]) => jid === m.sender) + 1
          const myData = users[m.sender]
          const myVal = myData
            ? cat.fmt(cat.custom ? cat.custom(myData) : (myData[cat.key] || 0))
            : '0'

          const board = sorted.slice(0, len).map(([jid, val], i) => {
            const isMe = jid === m.sender ? ' ◀ Kamu' : ''
            allMentions.push(jid)
            return `│ ${medal(i)} @${jid.split('@')[0]}${isMe}\n│    ${cat.fmt(val)}`
          }).join('\n')

          sections.push(`*${cat.title} TOP ${Math.min(len, sorted.length)}*
┌───▣[ ${namabot} ]▣─⬣
│ 🎯 Rank: *#${myRank || 'N/A'}* | Nilai: *${myVal}*
├──────
${board}
└──▣[ ${namabot} ]▣─⬣`)
        }

        return sendWithTemplate(
          dino, m,
          decorate(`*🏆 LB ${g.label.toUpperCase()}*
│
│ ${sapaan}
│
${sections.join('\n\n')}
│
│ ➤ *${usedPrefix}lb* untuk lihat semua kategori`),
          { mentions: [...new Set(allMentions)] }
        )
      }

      // ── LB spesifik satu kategori ──
      const cat = kategori[type]
      if (!cat) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Kategori Tidak Ditemukan!*
│
│ Kategori *${type}* tidak tersedia.
│
│ ➤ Ketik *${usedPrefix}lb* untuk lihat semua kategori.`),
          { mentions: [m.sender] }
        )
      }

      await sendWithTemplate(
        dino, m,
        decorate(`*⏳ Generate Leaderboard...*
│
│ Sedang menyusun data ${cat.title}...`),
        { mentions: [m.sender] }
      )

      // Beri jeda async
      await new Promise(resolve => setImmediate(resolve))

      let sorted
      if (cat.custom) {
        sorted = Object.entries(users)
          .map(([jid, u]) => [jid, cat.custom(u)])
          .sort((a, b) => b[1] - a[1])
      } else {
        sorted = Object.entries(users)
          .filter(([_, u]) => typeof u[cat.key] === 'number')
          .sort(([, a], [, b]) => (b[cat.key] || 0) - (a[cat.key] || 0))
          .map(([jid, u]) => [jid, u[cat.key] || 0])
      }

      const myRank = sorted.findIndex(([jid]) => jid === m.sender) + 1
      const myData = users[m.sender]
      const myVal = myData
        ? cat.fmt(cat.custom ? cat.custom(myData) : (myData[cat.key] || 0))
        : '0'

      const mentionJids = sorted.slice(0, len).map(([jid]) => jid)

      const board = sorted.slice(0, len).map(([jid, val], i) => {
        const isMe = jid === m.sender ? ' ◀ Kamu' : ''
        return `│ ${medal(i)} @${jid.split('@')[0]}${isMe}\n│    ${cat.fmt(val)}`
      }).join('\n')

      const sapaan = pickRandom([
        `🏆 Siapa yang teratas di ${cat.title}?`,
        `🔥 Para jawara ${cat.title} sudah hadir!`,
        `⚔️ Persaingan makin ketat di ${cat.title}!`,
        `🌟 Daftar terkuat ${cat.title} saat ini!`,
        `👑 Siapa raja ${cat.title} hari ini?`
      ])

      return sendWithTemplate(
        dino, m,
        decorate(`*🏆 LEADERBOARD ${cat.title.toUpperCase()}*
│
│ ${sapaan}
│
│ *📊 Posisimu*
│ ┌───▣[ ${namabot} ]▣─⬣
│ │ 🎯 Rank   : *#${myRank || 'N/A'}* dari *${sorted.length}* user
│ │ 📦 Nilai  : *${myVal}*
│ └──▣[ ${namabot} ]▣─⬣
│
│ *🏅 TOP ${Math.min(len, sorted.length)} ${cat.title.toUpperCase()}*
│ ┌───▣[ ${namabot} ]▣─⬣
${board}
│ └──▣[ ${namabot} ]▣─⬣
│
│ ➤ *${usedPrefix}lb* untuk lihat semua kategori`),
        { mentions: mentionJids }
      )
    }

  }
}