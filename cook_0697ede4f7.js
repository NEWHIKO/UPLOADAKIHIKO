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

    case 'cook':
    case 'masak': 'menu'; {
      /* CONSTANTS */
      // 1 hewan/ikan = 1 resep. key = nama makanan di DB
      // [key, bahan_utama, bumbu{}, coal, sumber, emoji, nama_display, tier]
      const RESEP = [
        // ── HEWAN (berburu) ──
        ['ayamgeprek',      'ayam',     { cabai: 3, bawang: 2, garam: 1 },               1, 'berburu', '🍗', 'Ayam Geprek Pedas',        1],
        ['satemadura',      'kambing',  { kecap: 2, bawang: 2, jahe: 1 },                1, 'berburu', '🍢', 'Sate Madura',               1],
        ['rendang',         'sapi',     { santan: 3, bawang: 3, cabai: 2, kunyit: 1 },   3, 'berburu', '🥩', 'Rendang Sapi',              3],
        ['babikecap',       'babi',     { kecap: 2, bawang: 2, jahe: 1, garam: 1 },      2, 'berburu', '🐖', 'Babi Kecap Wijen',          2],
        ['harimaurica',    'harimau',  { cabai: 4, bawang: 3, jahe: 2, kunyit: 1 },     3, 'berburu', '🐅', 'Rica-Rica Harimau',         3],
        ['tonsengbanteng',  'banteng',  { santan: 2, bawang: 2, kecap: 1, cabai: 2 },    2, 'berburu', '🐂', 'Tongseng Banteng',          2],
        ['sotokerbau',      'kerbau',   { bawang: 2, kunyit: 2, jahe: 1, garam: 1 },     2, 'berburu', '🐃', 'Soto Kerbau Segar',         2],
        ['dendengmonyet',   'monyet',   { kecap: 1, garam: 1, bawang: 1 },               1, 'berburu', '🐒', 'Dendeng Monyet',            1],
        ['gulaibabihutan',  'babihutan',{ santan: 2, kunyit: 2, bawang: 2, cabai: 1 },   2, 'berburu', '🐗', 'Gulai Babi Hutan',          2],
        ['dimsumpanda',     'panda',    { mentega: 2, bawang: 2, jahe: 1, garam: 1 },    2, 'berburu', '🐼', 'Dimsum Panda Spesial',      3],
        ['semurgajah',      'gajah',    { kecap: 3, bawang: 3, jahe: 2, mentega: 2 },    3, 'berburu', '🐘', 'Semur Gajah Eksotis',       3],
        ['supbuaya',        'buaya',    { bawang: 2, jahe: 2, garam: 2, kunyit: 1 },     2, 'berburu', '🐊', 'Sup Buaya Rempah',          3],

        // ── IKAN (mancing) ──
        ['steakpaus',       'paus',     { mentega: 3, garam: 2, bawang: 2, jahe: 1 },    3, 'mancing', '🐳', 'Steak Paus Premium',        3],
        ['bawalmanis',      'bawal',    { garam: 1, jahe: 1, bawang: 2, kecap: 1 },      2, 'mancing', '🐡', 'Bawal Bakar Madu',          2],
        ['lelepenyet',      'lele',     { cabai: 2, bawang: 1, garam: 1 },               1, 'mancing', '🐟', 'Lele Penyet Sambal',        1],
        ['pepisnila',       'nila',     { bawang: 1, kunyit: 1, garam: 1, jahe: 1 },     1, 'mancing', '🐠', 'Pepes Nila Kemangi',        1],
        ['kepitingpadang',  'kepiting', { cabai: 3, bawang: 2, kunyit: 1, santan: 1 },   3, 'mancing', '🦀', 'Kepiting Saus Padang',      3],
        ['udangcrispy',     'udang',    { tepung: 2, garam: 1, bawang: 1, minyak: 2 },   2, 'mancing', '🦐', 'Udang Tepung Crispy',       2],
      ]

      const BAHAN_INFO = {
        bawang:  { emoji: '🧅' }, garam:   { emoji: '🧂' },
        minyak:  { emoji: '🫙' }, tepung:  { emoji: '🌾' },
        santan:  { emoji: '🥥' }, kunyit:  { emoji: '💛' },
        cabai:   { emoji: '🌶️' }, mentega: { emoji: '🧈' },
        kecap:   { emoji: '🍶' }, jahe:    { emoji: '🫚' },
        jeruk:   { emoji: '🍊' },
      }

      const TIER_LABEL = { 1: '⭐ Basic (+30~50 stamina)', 2: '⭐⭐ Medium (+50~70)', 3: '⭐⭐⭐ Premium (+70~90)' }

      /* HELPER */
      const dbUser = global.db.data.users[m.sender]
      const fmt    = n => (n || 0).toLocaleString('id-ID')

      function maxBisa(r) {
        const [, bahan, bumbu, coal] = r
        return Math.min(
          dbUser[bahan] || 0,
          ...Object.entries(bumbu).map(([b, n]) => Math.floor((dbUser[b] || 0) / n)),
          Math.floor((dbUser.coal || 0) / coal)
        )
      }

      function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)] }
      function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

      const MAX_COOK  = 20
      const type      = (args[0] || '').toLowerCase()
      const jumlah    = parseInt(args[1]) || 0

      /* HANDLER — MENU */
      if (!type) {
        const hewanList = RESEP
          .filter(r => r[4] === 'berburu')
          .map(r => {
            const [key, bahan, bumbu, coal, , emoji, nama, tier] = r
            const bumbuStr = Object.entries(bumbu).map(([b, n]) => `${BAHAN_INFO[b]?.emoji || '🔸'}${b}×${n}`).join(' ')
            return `│ ${emoji} *${key}* — ${nama}\n│   ${TIER_LABEL[tier]}\n│   📦 ${bahan} + ${bumbuStr} + 🖤coal×${coal}\n│   Stok ${bahan}: *${fmt(dbUser[bahan] || 0)}* | max: *${maxBisa(r)}×*`
          }).join('\n│\n')

        const ikanList = RESEP
          .filter(r => r[4] === 'mancing')
          .map(r => {
            const [key, bahan, bumbu, coal, , emoji, nama, tier] = r
            const bumbuStr = Object.entries(bumbu).map(([b, n]) => `${BAHAN_INFO[b]?.emoji || '🔸'}${b}×${n}`).join(' ')
            return `│ ${emoji} *${key}* — ${nama}\n│   ${TIER_LABEL[tier]}\n│   📦 ${bahan} + ${bumbuStr} + 🖤coal×${coal}\n│   Stok ${bahan}: *${fmt(dbUser[bahan] || 0)}* | max: *${maxBisa(r)}×*`
          }).join('\n│\n')

        const bumbuStok = Object.entries(BAHAN_INFO)
          .map(([b, info]) => `│   ${info.emoji} ${b.padEnd(9)}: *${fmt(dbUser[b] || 0)}*`)
          .join('\n')

        return sendWithTemplate(
          dino, m,
          decorate(`*🍳 MASAK (COOK)*
│
│ ➤ *${usedPrefix}cook <masakan> <jumlah>*
│ ➤ Contoh: *${usedPrefix}cook ayamgeprek 3*
│ ➤ Max masak: *${MAX_COOK}×* per sekali
│
│ *🖤 Stok Coal: ${fmt(dbUser.coal || 0)}*
│
│ *🧂 Stok Bumbu:*
${bumbuStok}
│
│ ── *MASAKAN HEWAN* (dari ${usedPrefix}berburu) ──
│
${hewanList}
│
│ ── *MASAKAN IKAN* (dari ${usedPrefix}mancing) ──
│
${ikanList}
│
│ ➤ *${usedPrefix}eat* untuk makan hasil masakan`),
          { mentions: [m.sender] }
        )
      }

      /* HANDLER — MASAK */
      const targetResep = RESEP.find(r => r[0] === type)
      if (!targetResep) {
        return usage(
          `Masakan *${type}* tidak dikenali!`,
          '<nama_masakan> <jumlah>',
          'Ketik .cook untuk lihat daftar masakan',
          ['ayamgeprek 5', 'rendang 2', 'lelepenyet 3']
        )
      }

      const [key, bahan, bumbu, coalPerMasak, sumber, emoji, namaDisplay, tier] = targetResep

      if (!args[1]) {
        const bumbuDetail = Object.entries(bumbu)
          .map(([b, n]) => `│   ${BAHAN_INFO[b]?.emoji || '🔸'} ${b.padEnd(9)}: *${n}×* per porsi | stok: *${fmt(dbUser[b] || 0)}*`)
          .join('\n')
        return sendWithTemplate(
          dino, m,
          decorate(`*❓ Berapa Porsi ${namaDisplay}?*
│
│ ${emoji} *${namaDisplay}* — ${TIER_LABEL[tier]}
│
│ Bahan per porsi:
│   ${emoji} ${bahan.padEnd(9)}: stok *${fmt(dbUser[bahan] || 0)}*
${bumbuDetail}
│   🖤 coal      : *${coalPerMasak}×* | stok: *${fmt(dbUser.coal || 0)}*
│   Max masak    : *${maxBisa(targetResep)}×*
│
│ ➤ *${usedPrefix}cook ${type} <jumlah>*`),
          { mentions: [m.sender] }
        )
      }

      if (isNaN(jumlah) || jumlah < 1) {
        return usage('Jumlah tidak valid!', `${type} <jumlah>`, 'Masukkan angka minimal 1', [`${type} 1`])
      }
      if (jumlah > MAX_COOK) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Jumlah Melebihi Batas!*\n│\n│ Max masak: *${MAX_COOK}×* per sekali`),
          { mentions: [m.sender] }
        )
      }

      // Cek semua bahan
      const kurang = []
      if ((dbUser[bahan] || 0) < jumlah) kurang.push({ item: bahan, emoji, butuh: jumlah, punya: dbUser[bahan] || 0 })
      if ((dbUser.coal || 0) < jumlah * coalPerMasak) kurang.push({ item: 'coal', emoji: '🖤', butuh: jumlah * coalPerMasak, punya: dbUser.coal || 0 })
      for (const [b, perPorsi] of Object.entries(bumbu)) {
        const butuh = jumlah * perPorsi
        const punya = dbUser[b] || 0
        if (punya < butuh) kurang.push({ item: b, emoji: BAHAN_INFO[b]?.emoji || '🔸', butuh, punya })
      }

      if (kurang.length > 0) {
        const kurangStr = kurang.map(k =>
          `│   ${k.emoji} ${k.item.padEnd(9)}: butuh *${k.butuh}*, punya *${k.punya}* (kurang *${k.butuh - k.punya}*)`
        ).join('\n')
        const hintStr = kurang.map(k => {
          if (k.item === 'coal') return `│   🖤 coal    : *${usedPrefix}shop buy coal ${k.butuh - k.punya}*`
          if (k.item === bahan)  return `│   ${k.emoji} ${k.item}: *${usedPrefix}${sumber}*`
          return `│   ${k.emoji} ${k.item}: *${usedPrefix}shop buy ${k.item} ${k.butuh - k.punya}*`
        }).join('\n')
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Bahan Tidak Cukup!*
│
│ Mau masak *${jumlah}× ${namaDisplay}* tapi kurang!
│
│ Kekurangan:
${kurangStr}
│
│ Cara dapat:
${hintStr}`),
          { mentions: [m.sender] }
        )
      }

      // Proses masak
      await sendWithTemplate(
        dino, m,
        decorate(`*🍳 Memulai Masak...*\n│\n│ ${pickRandom([
          `🔥 Api menyala, ${namaDisplay} mulai dimasak!`,
          `🌶️ Bumbu dituang, aroma ${namaDisplay} menyebar!`,
          `👨‍🍳 Tangan terampil mengolah ${namaDisplay}!`,
          `🫕 ${namaDisplay} mendidih sempurna di wajan!`,
          `🔪 Bumbu dipotong halus, ${namaDisplay} hampir jadi!`,
        ])}\n│\n│ Harap tunggu sebentar...`),
        { react: true, reactDone: '🍳', mentions: [m.sender] }
      )

      await new Promise(r => setTimeout(r, 2000))

      // Kurangi bahan
      dbUser[bahan]  -= jumlah
      dbUser.coal    -= jumlah * coalPerMasak
      for (const [b, perPorsi] of Object.entries(bumbu)) dbUser[b] = (dbUser[b] || 0) - (jumlah * perPorsi)
      dbUser[key]     = (dbUser[key] || 0) + jumlah

      const bahanStr = [
        `│   ${emoji} ${bahan.padEnd(9)}: *-${jumlah}* (sisa ${fmt(dbUser[bahan])})`,
        ...Object.entries(bumbu).map(([b, perPorsi]) =>
          `│   ${BAHAN_INFO[b]?.emoji || '🔸'} ${b.padEnd(9)}: *-${jumlah * perPorsi}* (sisa ${fmt(dbUser[b] || 0)})`
        ),
        `│   🖤 coal      : *-${jumlah * coalPerMasak}* (sisa ${fmt(dbUser.coal)})`
      ].join('\n')

      return sendWithTemplate(
        dino, m,
        decorate(`*✅ Masak Sukses!*
│
│ ${pickRandom([
  `🍽️ ${namaDisplay} siap disajikan!`,
  `✨ ${namaDisplay} matang sempurna!`,
  `🎉 ${namaDisplay} harum dan lezat!`,
  `🌟 Resep berhasil! ${namaDisplay} siap dimakan!`,
])}
│
│ *Detail Masakan:*
│   ${emoji} Masakan : *${namaDisplay}*
│   🏷️ Tier    : *${TIER_LABEL[tier]}*
│   🍽️ Porsi   : *${jumlah}×*
│
│ *Bahan Terpakai:*
${bahanStr}
│
│ *Hasil:*
│   ${emoji} ${namaDisplay}: *+${jumlah}* (total ${fmt(dbUser[key])})
│
│ ➤ *${usedPrefix}eat ${key}* untuk makan
│ ➤ *${usedPrefix}inv* untuk cek stok`),
        { react: true, reactDone: '✅', mentions: [m.sender] }
      )
    }

  }
}
