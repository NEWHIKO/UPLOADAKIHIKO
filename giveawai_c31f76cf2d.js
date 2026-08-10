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

    case 'giveaway': 'menu'; {
      /* CONSTANTS */

      /* HELPER */
      const fmt = (n) => (n || 0).toLocaleString('id-ID')

      function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

      /* HANDLER */
      global.db.data.giveaway = global.db.data.giveaway || {}

      const dbUser = global.db.data.users[m.sender]
      const action = (args[0] || '').toLowerCase()

      if (!global.db.data.giveaway[m.chat]) {
        global.db.data.giveaway[m.chat] = {}
      }

      // ── MENU ──
      if (!action) {
        return sendWithTemplate(
          dino, m,
          decorate(`*🎁 MENU GIVEAWAY*
│
│ 🎁 Mulai giveaway
│ ➤ *${usedPrefix}giveaway start <id> <money>*
│
│ 📥 Join giveaway
│ ➤ *${usedPrefix}giveaway join <id>*
│
│ 🏁 Akhiri giveaway
│ ➤ *${usedPrefix}giveaway end <id>*
│
│ 📜 Lihat giveaway aktif
│ ➤ *${usedPrefix}giveaway list*
│
│ Contoh:
│ ➤ *${usedPrefix}giveaway start hoki100 1000*`),
          { mentions: [m.sender] }
        )
      }

      // ── START ──
      if (action === 'start') {
        const id     = (args[1] || '').toLowerCase()
        const hadiah = parseInt(args[2])

        if (!id || !hadiah || isNaN(hadiah)) {
          return usage(
            'Format salah!',
            'start <id> <jumlah>',
            'Host bebas menentukan ID giveaway',
            ['start hoki100 1000', 'start event123 5000']
          )
        }

        const list = global.db.data.giveaway[m.chat]

        // Cek host sudah punya giveaway aktif
        const existing = Object.entries(list).find(([, g]) => g.host === m.sender && g.active)
        if (existing) {
          return sendWithTemplate(
            dino, m,
            decorate(`*⚠️ Kamu Sudah Punya Giveaway Aktif!*
│
│ 🆔 ID Giveaway : *${existing[0]}*
│
│ Selesaikan dulu sebelum membuat yang baru.
│ ➤ *${usedPrefix}giveaway end ${existing[0]}*`),
            { mentions: [m.sender] }
          )
        }

        if (list[id]) {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ ID Sudah Digunakan!*
│
│ ID *${id}* sudah dipakai. Gunakan ID lain.`),
            { mentions: [m.sender] }
          )
        }

        if ((dbUser.money || 0) < hadiah) {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ Money Tidak Cukup!*
│
│ 💰 Money kamu : *${fmt(dbUser.money)}*
│ 🎁 Hadiah     : *${fmt(hadiah)}*
│ ❌ Kurang     : *${fmt(hadiah - (dbUser.money || 0))}*`),
            { mentions: [m.sender] }
          )
        }

        dbUser.money -= hadiah

        global.db.data.giveaway[m.chat][id] = {
          host: m.sender,
          hadiah,
          peserta: [],
          active: true
        }

        return sendWithTemplate(
          dino, m,
          decorate(`*🎉 GIVEAWAY DIMULAI!*
│
│ 🆔 ID      : *${id}*
│ 👤 Host    : @${m.sender.split('@')[0]}
│ 💰 Hadiah  : *${fmt(hadiah)} Money*
│
│ 📥 Join giveaway:
│ ➤ *${usedPrefix}giveaway join ${id}*
│
│ 📜 Lihat peserta:
│ ➤ *${usedPrefix}giveaway list*`),
          { mentions: [m.sender] }
        )
      }

      // ── JOIN ──
      if (action === 'join') {
        const id = args[1]

        if (!id) {
          return usage(
            'Masukkan ID giveaway!',
            'join <id>',
            'Lihat ID dengan .giveaway list',
            ['join hoki100', 'join event123']
          )
        }

        const gw = global.db.data.giveaway[m.chat][id]

        if (!gw || !gw.active) {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ Giveaway Tidak Ditemukan!*
│
│ ID *${id}* tidak ada atau sudah selesai.
│ ➤ *${usedPrefix}giveaway list* untuk lihat yang aktif.`),
            { mentions: [m.sender] }
          )
        }

        if (gw.host === m.sender) {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ Tidak Bisa Join Giveaway Sendiri!*
│
│ Kamu adalah host giveaway ini.`),
            { mentions: [m.sender] }
          )
        }

        if (gw.peserta.includes(m.sender)) {
          return sendWithTemplate(
            dino, m,
            decorate(`*⚠️ Sudah Join!*
│
│ Kamu sudah terdaftar di giveaway *${id}*.`),
            { mentions: [m.sender] }
          )
        }

        gw.peserta.push(m.sender)

        return sendWithTemplate(
          dino, m,
          decorate(`*✅ Berhasil Join Giveaway!*
│
│ 🆔 ID         : *${id}*
│ 👥 Total Peserta : *${gw.peserta.length}*
│
│ Semoga beruntung! 🍀`),
          { mentions: [m.sender] }
        )
      }

      // ── END ──
      if (action === 'end') {
        const id = args[1]

        if (!id) {
          return usage(
            'Masukkan ID giveaway!',
            'end <id>',
            'Hanya host yang bisa mengakhiri',
            ['end hoki100', 'end event123']
          )
        }

        const gw = global.db.data.giveaway[m.chat][id]

        if (!gw || !gw.active) {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ Giveaway Tidak Ditemukan!*
│
│ ID *${id}* tidak ada atau sudah selesai.`),
            { mentions: [m.sender] }
          )
        }

        if (gw.host !== m.sender) {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ Bukan Host!*
│
│ Hanya host yang bisa mengakhiri giveaway ini.`),
            { mentions: [m.sender] }
          )
        }

        if (gw.peserta.length < 1) {
          delete global.db.data.giveaway[m.chat][id]
          return sendWithTemplate(
            dino, m,
            decorate(`*⚠️ Tidak Ada Peserta!*
│
│ Giveaway *${id}* dihapus karena tidak ada peserta.`),
            { mentions: [m.sender] }
          )
        }

        // Animasi pengacakan
        await sendWithTemplate(
          dino, m,
          decorate(`*🎲 MENGACAK PEMENANG...*
│
│ 🎰 Mengumpulkan peserta...
│ ⏳ Memutar roda keberuntungan...`),
          { react: true, reactDone: '🎲', mentions: [m.sender] }
        )

        await delay(2000)

        const winner = gw.peserta[Math.floor(Math.random() * gw.peserta.length)]
        global.db.data.users[winner].money = (global.db.data.users[winner].money || 0) + gw.hadiah

        delete global.db.data.giveaway[m.chat][id]

        return sendWithTemplate(
          dino, m,
          decorate(`*🎉 GIVEAWAY SELESAI!*
│
│ 🆔 ID       : *${id}*
│ 🏆 Pemenang : @${winner.split('@')[0]}
│ 💰 Hadiah   : *${fmt(gw.hadiah)} Money*
│
│ Selamat! 🎊`),
          { react: true, reactDone: '🎉', mentions: [winner, m.sender] }
        )
      }

      // ── LIST ──
      if (action === 'list') {
        const list = global.db.data.giveaway[m.chat]
        const ids  = Object.keys(list)

        if (ids.length === 0) {
          return sendWithTemplate(
            dino, m,
            decorate(`*📋 Tidak Ada Giveaway Aktif!*
│
│ Mulai dengan: *${usedPrefix}giveaway start <id> <money>*`),
            { mentions: [m.sender] }
          )
        }

        const listStr = ids.map(id => {
          const g = list[id]
          return `│ 🆔 *${id}*
│   👤 Host    : @${g.host.split('@')[0]}
│   💰 Hadiah  : *${fmt(g.hadiah)}*
│   👥 Peserta : *${g.peserta.length}*`
        }).join('\n│\n')

        const mentions = ids.map(id => list[id].host)

        return sendWithTemplate(
          dino, m,
          decorate(`*📋 GIVEAWAY AKTIF*
│
${listStr}
│
│ ➤ *${usedPrefix}giveaway join <id>* untuk ikut`),
          { mentions }
        )
      }

      // ── Action tidak dikenal ──
      return sendWithTemplate(
        dino, m,
        decorate(`*❌ Aksi Tidak Dikenal!*
│
│ Ketik *${usedPrefix}giveaway* untuk lihat menu.`),
        { mentions: [m.sender] }
      )
    }

  }
}