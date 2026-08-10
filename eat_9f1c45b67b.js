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

  switch (command) {

    case 'eat':
    case 'makan': 'menu'; {
      /* CONSTANTS */
      // Satu hewan/ikan = satu makanan, range stamina per tier
      const FOOD_DATA = {
        // ── Tier 1 Basic (+30~50) — dari berburu ──
        ayamgeprek:     { tier: 1, emoji: '🍗', nama: 'Ayam Geprek Pedas',      range: [30, 50], sumber: 'cook' },
        satemadura:     { tier: 1, emoji: '🍢', nama: 'Sate Madura',            range: [30, 50], sumber: 'cook' },
        dendengmonyet:  { tier: 1, emoji: '🐒', nama: 'Dendeng Monyet',         range: [30, 50], sumber: 'cook' },
        lelepenyet:     { tier: 1, emoji: '🐟', nama: 'Lele Penyet Sambal',     range: [30, 50], sumber: 'cook' },
        pepisnila:      { tier: 1, emoji: '🐠', nama: 'Pepes Nila Kemangi',     range: [30, 50], sumber: 'cook' },

        // ── Tier 2 Medium (+50~70) ──
        babikecap:      { tier: 2, emoji: '🐖', nama: 'Babi Kecap Wijen',      range: [50, 70], sumber: 'cook' },
        tonsengbanteng: { tier: 2, emoji: '🐂', nama: 'Tongseng Banteng',       range: [50, 70], sumber: 'cook' },
        sotokerbau:     { tier: 2, emoji: '🐃', nama: 'Soto Kerbau Segar',      range: [50, 70], sumber: 'cook' },
        gulaibabihutan: { tier: 2, emoji: '🐗', nama: 'Gulai Babi Hutan',       range: [50, 70], sumber: 'cook' },
        bawalmanis:     { tier: 2, emoji: '🐡', nama: 'Bawal Bakar Madu',       range: [50, 70], sumber: 'cook' },
        udangcrispy:    { tier: 2, emoji: '🦐', nama: 'Udang Tepung Crispy',    range: [50, 70], sumber: 'cook' },

        // ── Tier 3 Premium (+70~90) ──
        rendang:        { tier: 3, emoji: '🥩', nama: 'Rendang Sapi',           range: [70, 90], sumber: 'cook' },
        harimaurica:   { tier: 3, emoji: '🐅', nama: 'Rica-Rica Harimau',      range: [70, 90], sumber: 'cook' },
        dimsumpanda:    { tier: 3, emoji: '🐼', nama: 'Dimsum Panda Spesial',   range: [70, 90], sumber: 'cook' },
        semurgajah:     { tier: 3, emoji: '🐘', nama: 'Semur Gajah Eksotis',    range: [70, 90], sumber: 'cook' },
        supbuaya:       { tier: 3, emoji: '🐊', nama: 'Sup Buaya Rempah',       range: [70, 90], sumber: 'cook' },
        steakpaus:      { tier: 3, emoji: '🐳', nama: 'Steak Paus Premium',     range: [70, 90], sumber: 'cook' },
        kepitingpadang: { tier: 3, emoji: '🦀', nama: 'Kepiting Saus Padang',   range: [70, 90], sumber: 'cook' },
      }

      const FRUIT_DATA = {
        pisang: { emoji: '🍌', nama: 'Pisang', range: [6, 13] },
        mangga: { emoji: '🥭', nama: 'Mangga', range: [6, 13] },
        jeruk:  { emoji: '🍊', nama: 'Jeruk',  range: [6, 13] },
        anggur: { emoji: '🍇', nama: 'Anggur', range: [6, 13] },
        apel:   { emoji: '🍎', nama: 'Apel',   range: [6, 13] },
      }

      const ALL_FOOD   = { ...FOOD_DATA, ...FRUIT_DATA }
      const MAX_STAMINA = 300

      /* HELPER */
      const dbUser = global.db.data.users[m.sender]
      const fmt    = n => (n || 0).toLocaleString('id-ID')

      function progressBar(cur, max, len = 10) {
        const filled = Math.max(0, Math.min(Math.round((cur / max) * len), len))
        return '█'.repeat(filled) + '░'.repeat(len - filled)
      }
      function ranNumb(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
      function pickRandom(arr)   { return arr[Math.floor(Math.random() * arr.length)] }

      const type  = (args[0] || '').toLowerCase()
      const count = parseInt(args[1]) || 1

      /* HANDLER — MENU */
      if (!type) {
        const tier1List = Object.entries(FOOD_DATA)
          .filter(([, v]) => v.tier === 1 && (dbUser[`${Object.keys(FOOD_DATA).find(k => k)}`] || 0) >= 0)
          .map(([k, v]) => `│   ${v.emoji} ${k.padEnd(16)}: *${fmt(dbUser[k] || 0)}* (+${v.range[0]}~${v.range[1]})`)
          .join('\n')

        const buildList = (tier) => Object.entries(FOOD_DATA)
          .filter(([, v]) => v.tier === tier)
          .map(([k, v]) => `│   ${v.emoji} ${k.padEnd(16)}: *${fmt(dbUser[k] || 0)}* (+${v.range[0]}~${v.range[1]})`)
          .join('\n')

        const fruitList = Object.entries(FRUIT_DATA)
          .filter(([k]) => (dbUser[k] || 0) > 0)
          .map(([k, v]) => `│   ${v.emoji} ${k.padEnd(16)}: *${fmt(dbUser[k])}* (+${v.range[0]}~${v.range[1]})`)
          .join('\n') || '│   ❌ Tidak punya buah'

        const bar = progressBar(dbUser.stamina || 0, MAX_STAMINA)
        const pct = Math.round(((dbUser.stamina || 0) / MAX_STAMINA) * 100)

        return sendWithTemplate(
          dino, m,
          decorate(`*🍽️ MAKAN (EAT)*
│
│ ➤ *${usedPrefix}eat <makanan> <jumlah>*
│ ➤ Contoh: *${usedPrefix}eat rendang 2*
│
│ *⚡ Stamina Kamu:*
│   [${bar}] ${pct}%
│   ⚡ ${dbUser.stamina || 0} / ${MAX_STAMINA}
│
│ ── *⭐ BASIC COOK* (+30~50 stamina) ──
${buildList(1)}
│
│ ── *⭐⭐ MEDIUM COOK* (+50~70 stamina) ──
${buildList(2)}
│
│ ── *⭐⭐⭐ PREMIUM COOK* (+70~90 stamina) ──
${buildList(3)}
│
│ ➤ *${usedPrefix}cook* untuk masak hewan & ikan
│
│ ── *🍎 BUAH SEGAR* (+6~13 stamina) ──
${fruitList}
│
│ ➤ *${usedPrefix}berkebon* untuk panen buah`),
          { mentions: [m.sender] }
        )
      }

      /* HANDLER — MAKAN */
      if (!ALL_FOOD[type]) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Makanan Tidak Dikenali!*\n│\n│ *${type}* bukan makanan yang valid.\n│\n│ ➤ *${usedPrefix}eat* untuk lihat daftar makanan\n│ ➤ *${usedPrefix}cook* untuk masak dulu`),
          { mentions: [m.sender] }
        )
      }

      if ((dbUser.stamina || 0) >= MAX_STAMINA) {
        return sendWithTemplate(
          dino, m,
          decorate(`*✨ Stamina Sudah Penuh!*\n│\n│ ⚡ *${dbUser.stamina} / ${MAX_STAMINA}*\n│ [${progressBar(dbUser.stamina, MAX_STAMINA)}] 100%\n│\n│ Gunakan stamina dulu dengan beraktivitas!`),
          { mentions: [m.sender] }
        )
      }

      if (!dbUser[type] || dbUser[type] < 1) {
        const info   = ALL_FOOD[type]
        const isBuah = !!FRUIT_DATA[type]
        const hint   = isBuah
          ? `│ ➤ *${usedPrefix}berkebon* untuk panen ${type}`
          : `│ ➤ *${usedPrefix}cook ${type} <jumlah>* untuk masak dulu`
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Stok Tidak Cukup!*\n│\n│ Kamu tidak punya *${info.emoji} ${info.nama}*\n│\n${hint}`),
          { mentions: [m.sender] }
        )
      }

      const info      = ALL_FOOD[type]
      const isBuah    = !!FRUIT_DATA[type]
      const [rMin, rMax] = info.range
      const staminaBefore = dbUser.stamina || 0

      const actualCount = Math.min(count, dbUser[type])
      let totalStaminaAdded = 0
      const perPorsiLog = []

      for (let i = 0; i < actualCount; i++) {
        const curStamina = staminaBefore + totalStaminaAdded
        if (curStamina >= MAX_STAMINA) break
        const rand  = ranNumb(rMin, rMax)
        const added = Math.min(rand, MAX_STAMINA - curStamina)
        totalStaminaAdded += added
        perPorsiLog.push(added)
      }

      const realCount    = perPorsiLog.length
      const finalStamina = Math.min(staminaBefore + totalStaminaAdded, MAX_STAMINA)

      dbUser[type]    -= realCount
      dbUser.stamina   = finalStamina

      const tierLabel = isBuah ? '🍎 Buah Segar' : info.tier === 3 ? '⭐⭐⭐ Premium' : info.tier === 2 ? '⭐⭐ Medium' : '⭐ Basic'

      const komentar = pickRandom(
        finalStamina >= MAX_STAMINA
          ? ['🌟 Stamina penuh! Siap beraktivitas lagi!', '💪 Full power! Gas terus!', '⚡ Energi maksimal!']
          : info.tier === 3
          ? [`🔥 WOW! ${info.emoji} ${info.nama} luar biasa!`, '💪 Daging premium! Badan langsung bertenaga!', '😤 Kenyanggg! Stamina melonjak tajam!']
          : info.tier === 2
          ? [`😋 Lezat! ${info.emoji} ${info.nama} enak sekali!`, '🍽️ Nikmat! Stamina bertambah signifikan!', '✨ Masakan bumbu rempah selalu istimewa!']
          : isBuah
          ? ['🍃 Segar! Buah alami selalu menyehatkan!', '😊 Manis dan segar!', '🌿 Vitamin dari buah terasa menyehatkan!']
          : [`💪 ${info.emoji} ${info.nama} terasa enak!`, '🍽️ Nikmat! Stamina bertambah!', '😋 Lezat!']
      )

      const perPorsiStr = perPorsiLog.length <= 5
        ? perPorsiLog.map((s, i) => `│   Porsi ${i + 1}: *+${s}* stamina`).join('\n')
        : perPorsiLog.slice(0, 3).map((s, i) => `│   Porsi ${i + 1}: *+${s}* stamina`).join('\n')
          + `\n│   ... dan ${perPorsiLog.length - 3} porsi lainnya`

      const barBefore = progressBar(staminaBefore, MAX_STAMINA)
      const barAfter  = progressBar(finalStamina, MAX_STAMINA)
      const pctBefore = Math.round((staminaBefore / MAX_STAMINA) * 100)
      const pctAfter  = Math.round((finalStamina / MAX_STAMINA) * 100)

      return sendWithTemplate(
        dino, m,
        decorate(`*🍽️ Makan Sukses!*
│
│ ${komentar}
│
│ *Detail Makan:*
│   ${info.emoji} Makanan : *${info.nama}*
│   🏷️ Jenis   : *${tierLabel}*
│   🍽️ Dimakan : *${realCount}×*
│   ⚡ Range   : *+${rMin}~${rMax} (random)*
│
│ *Stamina per Porsi:*
${perPorsiStr}
│   ─────────────
│   Total: *+${totalStaminaAdded}* stamina
│
│ *Stamina Total:*
│   Sebelum : [${barBefore}] ${pctBefore}% (*${staminaBefore}*)
│   Sesudah : [${barAfter}] ${pctAfter}% (*${finalStamina}*)
│
│ *Sisa Stok:*
│   ${info.emoji} ${type.padEnd(14)}: *${fmt(dbUser[type] || 0)}*
│
│ ${finalStamina >= MAX_STAMINA ? '✅ *Stamina PENUH! Siap beraktivitas!*' : `💡 Butuh *${MAX_STAMINA - finalStamina}* stamina lagi untuk penuh.`}`),
        { react: true, reactDone: finalStamina >= MAX_STAMINA ? '⚡' : '🍽️', mentions: [m.sender] }
      )
    }

  }
}
