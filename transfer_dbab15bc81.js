// ====================================================
// TRANSFER.JS — Sistem pajak dinamis
// Pajak berdasarkan jumlah, musim, jam, weekend
// Anti tax-dodge: 3x kecil dalam 1 jam → locked
// Simulasi pajak: .tf cek <item> <jumlah>
// Time system dipusatkan dari rpg-time-system.js
// ====================================================
// TIER PAJAK BERDASARKAN HARGA JUAL:
//   💎 MEWAH  : diamond, gold                      → rate tertinggi
//   🔥 MAHAL  : hewan (7k-9k), seafood (7k)        → rate tinggi
//   🟣 MEDIUM : mythic, legendary, iron, string, rock, makanan → rate sedang
//   🟢 MURAH  : common, uncommon, wood, buah, bibit  → rate rendah
//   ♻️ RECEH  : botol/kaleng/kardus, trash           → rate kecil
// ====================================================

const { sendWithTemplate } = require('../../sendWithTemplate')
const { getMusim, getJam, getHari } = require('./rpg-time-system.js')

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

    case 'transfer':
    case 'tf': 'menu'; {
      /* CONSTANTS */

      /* HELPER */
      const dbUser = global.db.data.users[m.sender]
      const fmt = (n) => (n || 0).toLocaleString('id-ID')
      const now = Date.now()

      function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

      function getSeasonInfo() {
        const musim = getMusim()
        const boostMap = {
          hujan:   ['wood', 'botol', 'kaleng', 'kardus'],
          semi:    ['pisang', 'mangga', 'anggur', 'jeruk', 'apel', 'bibitpisang', 'bibitmangga', 'bibitanggur', 'bibitjeruk', 'bibitapel'],
          kemarau: ['ayam', 'sapi', 'kambing', 'banteng', 'harimau', 'gajah', 'buaya', 'panda'],
          gugur:   ['paus', 'lele', 'bawal', 'nila', 'kepiting', 'udang']
        }
        return { name: musim.nama, boost: boostMap[musim.key] || [] }
      }

      function getHourMultiplier() {
        const jam = getJam()
        if (jam.kategori === 'SIBUK') return { mult: 1.3, label: jam.icon + ' ' + jam.nama }
        if (jam.kategori === 'SEPI')  return { mult: 0.8, label: '🌙 Jam Sepi' }
        return { mult: 1.0, label: '☀️ Jam Normal' }
      }

      function isWeekend() {
        return getHari().isWeekend
      }

      function freeTaxThreshold(type) {
        const free = {
          money: 500000, bank: 500000,
          diamond: 1, gold: 1,
          iron: 3, potion: 10,
          wood: 100, rock: 30, string: 30, coal: 20, herb: 50,
          botol: 200, kaleng: 200, kardus: 100, trash: 200,
          common: 1, uncommon: 1, mythic: 1, legendary: 1,
          ayam: 1, sapi: 1, kambing: 1, kerbau: 1, babi: 1,
          harimau: 1, banteng: 1, monyet: 1, babihutan: 1,
          panda: 1, gajah: 1, buaya: 1,
          paus: 1, lele: 1, bawal: 1, nila: 1, kepiting: 1, udang: 1,
          // makanan baru
          ayamgeprek: 3, satemadura: 3, dendengmonyet: 3, lelepenyet: 3, pepisnila: 3,
          babikecap: 3, tonsengbanteng: 3, sotokerbau: 3, gulaibabihutan: 3, bawalmanis: 3, udangcrispy: 3,
          rendang: 3, harimaurica: 3, dimsumpanda: 3, semurgajah: 3, supbuaya: 3, steakpaus: 3, kepitingpadang: 3,
          // bumbu
          bawang: 20, cabai: 20, garam: 20, jahe: 20,
          kecap: 20, kunyit: 20, mentega: 20, minyak: 20, santan: 20, tepung: 20,
          // buah & bibit
          pisang: 30, mangga: 30, anggur: 30, jeruk: 30, apel: 30,
          bibitpisang: 300, bibitmangga: 300, bibitanggur: 300,
          bibitjeruk: 300, bibitapel: 300,
        }
        return free[type] || 10
      }

      function baseTaxRate(count, type) {
        const freeThreshold = freeTaxThreshold(type)
        if (count <= freeThreshold) return 0

        const tierMewah = ['diamond', 'gold']
        if (tierMewah.includes(type)) {
          if (count >= 1000000) return 0.40
          if (count >= 100000)  return 0.35
          if (count >= 10000)   return 0.30
          if (count >= 1000)    return 0.25
          if (count >= 100)     return 0.20
          return 0.15
        }

        const tierMahal = [
          'ayam', 'sapi', 'kambing', 'kerbau', 'babi', 'harimau', 'banteng',
          'monyet', 'babihutan', 'panda', 'gajah', 'buaya',
          'paus', 'lele', 'bawal', 'nila', 'kepiting', 'udang'
        ]
        if (tierMahal.includes(type)) {
          if (count >= 1000000) return 0.35
          if (count >= 100000)  return 0.30
          if (count >= 10000)   return 0.25
          if (count >= 1000)    return 0.20
          if (count >= 100)     return 0.15
          return 0.10
        }

        const tierMedium = [
          'mythic', 'legendary', 'iron', 'string', 'rock',
          // makanan baru semua tier
          'ayamgeprek', 'satemadura', 'dendengmonyet', 'lelepenyet', 'pepisnila',
          'babikecap', 'tonsengbanteng', 'sotokerbau', 'gulaibabihutan', 'bawalmanis', 'udangcrispy',
          'rendang', 'harimaurica', 'dimsumpanda', 'semurgajah', 'supbuaya', 'steakpaus', 'kepitingpadang',
        ]
        if (tierMedium.includes(type)) {
          if (count >= 1000000) return 0.22
          if (count >= 100000)  return 0.18
          if (count >= 10000)   return 0.14
          if (count >= 1000)    return 0.10
          return 0.07
        }

        const tierMurah = [
          'common', 'uncommon', 'wood',
          'pisang', 'mangga', 'anggur', 'jeruk', 'apel',
          'bibitpisang', 'bibitmangga', 'bibitanggur', 'bibitjeruk', 'bibitapel',
          // bumbu termasuk murah
          'bawang', 'cabai', 'garam', 'jahe', 'kecap', 'kunyit', 'mentega', 'minyak', 'santan', 'tepung',
        ]
        if (tierMurah.includes(type)) {
          if (count >= 1000000) return 0.15
          if (count >= 100000)  return 0.12
          if (count >= 10000)   return 0.09
          return 0.06
        }

        // Tier Receh (botol, kaleng, kardus, trash, herb, potion, dll)
        if (count >= 1000000) return 0.10
        if (count >= 100000)  return 0.08
        if (count >= 10000)   return 0.06
        if (count >= 1000)    return 0.04
        return 0.02
      }

      function smallThreshold(type) {
        const thresholds = {
          money: 200, bank: 200,
          diamond: 1, gold: 1,
          iron: 2, potion: 1,
          wood: 50, rock: 10, string: 15, coal: 10, herb: 20,
          botol: 100, kaleng: 100, kardus: 50, trash: 100,
          common: 1, uncommon: 1, mythic: 1, legendary: 1,
          ayam: 1, sapi: 1, kambing: 1, kerbau: 1, babi: 1,
          harimau: 1, banteng: 1, monyet: 1, babihutan: 1,
          panda: 1, gajah: 1, buaya: 1,
          paus: 1, lele: 1, bawal: 1, nila: 1, kepiting: 1, udang: 1,
          // makanan baru
          ayamgeprek: 1, satemadura: 1, dendengmonyet: 1, lelepenyet: 1, pepisnila: 1,
          babikecap: 1, tonsengbanteng: 1, sotokerbau: 1, gulaibabihutan: 1, bawalmanis: 1, udangcrispy: 1,
          rendang: 1, harimaurica: 1, dimsumpanda: 1, semurgajah: 1, supbuaya: 1, steakpaus: 1, kepitingpadang: 1,
          // bumbu
          bawang: 10, cabai: 10, garam: 10, jahe: 10,
          kecap: 10, kunyit: 10, mentega: 10, minyak: 10, santan: 10, tepung: 10,
          // buah & bibit
          pisang: 15, mangga: 15, anggur: 15, jeruk: 15, apel: 15,
          bibitpisang: 150, bibitmangga: 150, bibitanggur: 150,
          bibitjeruk: 150, bibitapel: 150,
        }
        return thresholds[type] || 3
      }

      function kalkulasiPajak(type, count, season, hourInfo, weekend) {
        let taxRate = baseTaxRate(count, type)
        const isFree = taxRate === 0
        const isSeasonBoost = season.boost.includes(type)
        const freeLimit = freeTaxThreshold(type)

        if (taxRate > 0) {
          taxRate *= hourInfo.mult
          if (weekend) taxRate *= 1.25
          if (isSeasonBoost) taxRate *= 1.20
          taxRate = Math.min(0.50, taxRate)
        }

        const pajakJumlah = Math.max(0, Math.floor(count * taxRate))
        const terima = count - pajakJumlah
        const pajakPct = (taxRate * 100).toFixed(1)
        const baseRate = (baseTaxRate(count, type) * 100).toFixed(0)

        return { taxRate, isFree, isSeasonBoost, freeLimit, pajakJumlah, terima, pajakPct, baseRate }
      }

      /* HANDLER */
      const season   = getSeasonInfo()
      const hourInfo = getHourMultiplier()
      const weekend  = isWeekend()

      if (!dbUser._tfDodge) dbUser._tfDodge = { count: 0, firstTime: 0, locked: false, lockUntil: 0 }

      const items = {
        // ─── KEUANGAN ───────────────────────────────────────────
        money:            { label: '💰 Money',              emoji: '💰' },
        bank:             { label: '🏦 ATM/Bank',            emoji: '🏦' },
        // ─── MEWAH ──────────────────────────────────────────────
        diamond:          { label: '💎 Diamond',             emoji: '💎' },
        gold:             { label: '🥇 Gold',                emoji: '🥇' },
        // ─── ITEM ───────────────────────────────────────────────
        iron:             { label: '⛓️ Iron',               emoji: '⛓️' },
        potion:           { label: '🧪 Potion',              emoji: '🧪' },
        // ─── MATERIAL ───────────────────────────────────────────
        wood:             { label: '🪵 Wood',                emoji: '🪵' },
        rock:             { label: '🪨 Rock',                emoji: '🪨' },
        string:           { label: '🕸️ String',             emoji: '🕸️' },
        coal:             { label: '🖤 Coal',                emoji: '🖤' },
        herb:             { label: '🌿 Herb',                emoji: '🌿' },
        // ─── MULUNG ─────────────────────────────────────────────
        botol:            { label: '🍶 Botol',               emoji: '🍶' },
        kaleng:           { label: '🥫 Kaleng',              emoji: '🥫' },
        kardus:           { label: '📦 Kardus',              emoji: '📦' },
        trash:            { label: '🗑️ Trash',              emoji: '🗑️' },
        // ─── CRATE ──────────────────────────────────────────────
        common:           { label: '⚪ Common Crate',        emoji: '⚪' },
        uncommon:         { label: '🟢 Uncommon Crate',      emoji: '🟢' },
        mythic:           { label: '🟣 Mythic Crate',        emoji: '🟣' },
        legendary:        { label: '🟡 Legendary Crate',     emoji: '🟡' },
        // ─── HEWAN ──────────────────────────────────────────────
        ayam:             { label: '🐔 Ayam',                emoji: '🐔' },
        sapi:             { label: '🐄 Sapi',                emoji: '🐄' },
        kambing:          { label: '🐐 Kambing',             emoji: '🐐' },
        kerbau:           { label: '🐃 Kerbau',              emoji: '🐃' },
        babi:             { label: '🐖 Babi',                emoji: '🐖' },
        harimau:          { label: '🐅 Harimau',             emoji: '🐅' },
        banteng:          { label: '🐂 Banteng',             emoji: '🐂' },
        monyet:           { label: '🐒 Monyet',              emoji: '🐒' },
        babihutan:        { label: '🐗 BabiHutan',           emoji: '🐗' },
        panda:            { label: '🐼 Panda',               emoji: '🐼' },
        gajah:            { label: '🐘 Gajah',               emoji: '🐘' },
        buaya:            { label: '🐊 Buaya',               emoji: '🐊' },
        // ─── SEAFOOD ─────────────────────────────────────────────
        paus:             { label: '🐳 Paus',                emoji: '🐳' },
        lele:             { label: '🐟 Lele',                emoji: '🐟' },
        bawal:            { label: '🐡 Bawal',               emoji: '🐡' },
        nila:             { label: '🐠 Nila',                emoji: '🐠' },
        kepiting:         { label: '🦀 Kepiting',            emoji: '🦀' },
        udang:            { label: '🦐 Udang',               emoji: '🦐' },
        // ─── MAKANAN BASIC ────────────────────────────────────────
        ayamgeprek:       { label: '🍗 AyamGeprek',          emoji: '🍗' },
        satemadura:       { label: '🍢 SateMadura',          emoji: '🍢' },
        dendengmonyet:    { label: '🐒 DendengMonyet',        emoji: '🐒' },
        lelepenyet:       { label: '🐟 LelePenyet',          emoji: '🐟' },
        pepisnila:        { label: '🐠 PepisNila',           emoji: '🐠' },
        // ─── MAKANAN MEDIUM ───────────────────────────────────────
        babikecap:        { label: '🐖 BabiKecap',           emoji: '🐖' },
        tonsengbanteng:   { label: '🐂 TonsengBanteng',      emoji: '🐂' },
        sotokerbau:       { label: '🐃 SotoKerbau',          emoji: '🐃' },
        gulaibabihutan:   { label: '🐗 GulaiBabiHutan',      emoji: '🐗' },
        bawalmanis:       { label: '🐡 BawalManis',          emoji: '🐡' },
        udangcrispy:      { label: '🦐 UdangCrispy',         emoji: '🦐' },
        // ─── MAKANAN PREMIUM ──────────────────────────────────────
        rendang:          { label: '🥩 Rendang',             emoji: '🥩' },
        harimaurica:     { label: '🐅 HarimauRica',         emoji: '🐅' },
        dimsumpanda:      { label: '🐼 DimsumPanda',         emoji: '🐼' },
        semurgajah:       { label: '🐘 SemurGajah',          emoji: '🐘' },
        supbuaya:         { label: '🐊 SupBuaya',            emoji: '🐊' },
        steakpaus:        { label: '🐳 SteakPaus',           emoji: '🐳' },
        kepitingpadang:   { label: '🦀 KepitingPadang',      emoji: '🦀' },
        // ─── BUMBU MASAK ──────────────────────────────────────────
        bawang:           { label: '🧅 Bawang',              emoji: '🧅' },
        cabai:            { label: '🌶️ Cabai',              emoji: '🌶️' },
        garam:            { label: '🧂 Garam',               emoji: '🧂' },
        jahe:             { label: '🫚 Jahe',                emoji: '🫚' },
        kecap:            { label: '🍶 Kecap',               emoji: '🍶' },
        kunyit:           { label: '💛 Kunyit',              emoji: '💛' },
        mentega:          { label: '🧈 Mentega',             emoji: '🧈' },
        minyak:           { label: '🫙 Minyak',              emoji: '🫙' },
        santan:           { label: '🥥 Santan',              emoji: '🥥' },
        tepung:           { label: '🌾 Tepung',              emoji: '🌾' },
        // ─── BUAH & BIBIT ─────────────────────────────────────────
        pisang:           { label: '🍌 Pisang',              emoji: '🍌' },
        mangga:           { label: '🥭 Mangga',              emoji: '🥭' },
        anggur:           { label: '🍇 Anggur',              emoji: '🍇' },
        jeruk:            { label: '🍊 Jeruk',               emoji: '🍊' },
        apel:             { label: '🍎 Apel',                emoji: '🍎' },
        bibitpisang:      { label: '🌾 Bibit Pisang',        emoji: '🌾' },
        bibitmangga:      { label: '🌾 Bibit Mangga',        emoji: '🌾' },
        bibitanggur:      { label: '🌾 Bibit Anggur',        emoji: '🌾' },
        bibitjeruk:       { label: '🌾 Bibit Jeruk',         emoji: '🌾' },
        bibitapel:        { label: '🌾 Bibit Apel',          emoji: '🌾' },
      }

      const type = (args[0] || '').toLowerCase()
      const who  = m.mentionedJid?.[0]

      // ── MENU ──
      if (!type) {
        const seasonBoostList = season.boost.slice(0, 4).join(', ')
        return sendWithTemplate(
          dino, m,
          decorate(`*💸 TRANSFER ITEM*\n│\n│ ➤ *${usedPrefix}tf <item> <jumlah> @target*\n│ ➤ *${usedPrefix}tf cek <item> <jumlah>* — Simulasi pajak\n│ ➤ Contoh: *${usedPrefix}tf money 5000 @teman*\n│ ➤ Contoh: *${usedPrefix}tf cek money 50000*\n│\n│ *📊 INFO PAJAK SAAT INI*\n│ ┌───\n│ │ 🕐 Waktu  : ${hourInfo.label}\n│ │ 📅 Hari   : ${weekend ? '🎉 WEEKEND (pajak +25%)' : '📅 Hari Biasa'}\n│ │ 🌿 Musim  : ${season.name}\n│ │ 🔥 Boost  : ${seasonBoostList}...\n│ │\n│ │ 💎 Tier Mewah  : diamond, gold → pajak 7–25%\n│ │ 🔥 Tier Mahal  : hewan, seafood → pajak 5–22%\n│ │ 🟣 Tier Medium : mythic, leg, iron, makanan → 3–12%\n│ │ 🟢 Tier Murah  : common, wood, buah, bumbu → 2–7%\n│ │ ♻️ Tier Receh  : botol, kardus, trash → 1–5%\n│ │\n│ │ 💡 Transfer kecil = BEBAS PAJAK\n│ └─────\n│\n│ *💰 KEUANGAN*\n│ ┌───\n│ │ 💰 money | 🏦 bank\n│ └─────\n│ *💎 ITEM MEWAH*\n│ ┌───\n│ │ 💎 diamond | 🥇 gold\n│ └─────\n│ *⚙️ ITEM*\n│ ┌───\n│ │ ⛓️ iron | 🧪 potion | 🌿 herb\n│ └─────\n│ *📦 MATERIAL*\n│ ┌───\n│ │ 🪵 wood | 🪨 rock | 🕸️ string | 🖤 coal\n│ └─────\n│ *♻️ MULUNG*\n│ ┌───\n│ │ 🍶 botol | 🥫 kaleng | 📦 kardus | 🗑️ trash\n│ └─────\n│ *📦 CRATE*\n│ ┌───\n│ │ ⚪ common | 🟢 uncommon | 🟣 mythic | 🟡 legendary\n│ └─────\n│ *🐾 HEWAN*\n│ ┌───\n│ │ ayam | sapi | kambing | kerbau | babi\n│ │ harimau | banteng | monyet | babihutan\n│ │ panda | gajah | buaya\n│ └─────\n│ *🐟 SEAFOOD*\n│ ┌───\n│ │ paus | lele | bawal | nila | kepiting | udang\n│ └─────\n│ *🍱 MAKANAN*\n│ ┌───\n│ │ ⭐ Basic   : ayamgeprek | satemadura | dendengmonyet\n│ │             lelepenyet | pepisnila\n│ │ ⭐⭐ Medium : babikecap | tonsengbanteng | sotokerbau\n│ │             gulaibabihutan | bawalmanis | udangcrispy\n│ │ ⭐⭐⭐ Premium: rendang | harimaurica | dimsumpanda\n│ │             semurgajah | supbuaya | steakpaus | kepitingpadang\n│ └─────\n│ *🧂 BUMBU MASAK*\n│ ┌───\n│ │ bawang | cabai | garam | jahe | kecap\n│ │ kunyit | mentega | minyak | santan | tepung\n│ └─────\n│ *🌿 BUAH & BIBIT*\n│ ┌───\n│ │ pisang | mangga | anggur | jeruk | apel\n│ │ bibitpisang | bibitmangga | bibitanggur\n│ │ bibitjeruk | bibitapel\n│ └─────`),
          { mentions: [m.sender] }
        )
      }

      // ── SIMULASI / CEK PAJAK ──
      if (type === 'cek' || type === 'sim' || type === 'simulasi') {
        const simType  = (args[1] || '').toLowerCase()
        const simCount = parseInt(args[2]) || 0

        if (!simType || !simCount) {
          return sendWithTemplate(
            dino, m,
            decorate(`*🧮 Simulasi Pajak Transfer*\n│\n│ ➤ *${usedPrefix}tf cek <item> <jumlah>*\n│ ➤ Contoh: *${usedPrefix}tf cek money 50000*\n│ ➤ Contoh: *${usedPrefix}tf cek rendang 100*`),
            { mentions: [m.sender] }
          )
        }

        if (!items[simType]) {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ Item Tidak Valid!*\n│\n│ Item *${simType}* tidak dikenali.\n│ ➤ Ketik *${usedPrefix}tf* untuk daftar item.`),
            { mentions: [m.sender] }
          )
        }

        const simItem  = items[simType]
        const hasil    = kalkulasiPajak(simType, simCount, season, hourInfo, weekend)

        const simValues = [
          Math.floor(simCount * 0.1),
          Math.floor(simCount * 0.25),
          Math.floor(simCount * 0.5),
          simCount,
          simCount * 2,
          simCount * 5,
        ].filter(v => v > 0 && v <= 99999999)

        const tabelSim = simValues.map(v => {
          const h      = kalkulasiPajak(simType, v, season, hourInfo, weekend)
          const status = h.isFree ? '✅ Bebas' : `${h.pajakPct}%`
          return `│ ${fmt(v).padStart(9)} → terima ${fmt(h.terima).padStart(9)} [${status}]`
        }).join('\n')

        const musimInfo   = hasil.isSeasonBoost ? `│ 🌿 Musim Boost: *+20%* (${season.name})\n` : ''
        const weekendInfo = weekend ? `│ 🎉 Weekend    : *+25%*\n` : ''
        const jamInfo     = hourInfo.mult !== 1.0 ? `│ 🕐 ${hourInfo.label}: *x${hourInfo.mult}*\n` : ''

        const tierMewah  = ['diamond', 'gold']
        const tierMahal  = ['ayam', 'sapi', 'kambing', 'kerbau', 'babi', 'harimau', 'banteng', 'monyet', 'babihutan', 'panda', 'gajah', 'buaya', 'paus', 'lele', 'bawal', 'nila', 'kepiting', 'udang']
        const tierMedium = ['mythic', 'legendary', 'iron', 'string', 'rock', 'ayamgeprek', 'satemadura', 'dendengmonyet', 'lelepenyet', 'pepisnila', 'babikecap', 'tonsengbanteng', 'sotokerbau', 'gulaibabihutan', 'bawalmanis', 'udangcrispy', 'rendang', 'harimaurica', 'dimsumpanda', 'semurgajah', 'supbuaya', 'steakpaus', 'kepitingpadang']
        const tierMurah  = ['common', 'uncommon', 'wood', 'pisang', 'mangga', 'anggur', 'jeruk', 'apel', 'bibitpisang', 'bibitmangga', 'bibitanggur', 'bibitjeruk', 'bibitapel', 'bawang', 'cabai', 'garam', 'jahe', 'kecap', 'kunyit', 'mentega', 'minyak', 'santan', 'tepung']

        let tierLabel = '♻️ Receh'
        if (tierMewah.includes(simType))  tierLabel = '💎 Mewah'
        else if (tierMahal.includes(simType))  tierLabel = '🔥 Mahal'
        else if (tierMedium.includes(simType)) tierLabel = '🟣 Medium'
        else if (tierMurah.includes(simType))  tierLabel = '🟢 Murah'

        return sendWithTemplate(
          dino, m,
          decorate(`*🧮 Simulasi Pajak Transfer*\n│\n│ ${simItem.emoji} Item: *${simItem.label}*\n│ 🏷️ Tier Pajak: *${tierLabel}*\n│ 📦 Jumlah yang dicek: *${fmt(simCount)}*\n│\n│ *📊 Hasil untuk ${fmt(simCount)} ${simType}:*\n│ ┌───\n│ │ 📤 Dikirim  : *${fmt(simCount)}*\n│ │ 💸 Pajak    : *-${fmt(hasil.pajakJumlah)}* (${hasil.pajakPct}%)\n│ │ 📥 Diterima : *${fmt(hasil.terima)}*\n│ │ 💡 Bebas    : ≤${fmt(hasil.freeLimit)} ${simType}\n│ └─────\n│\n│ *⚙️ Komponen Pajak:*\n│ ┌───\n│ │ 📋 Base Rate : *${hasil.baseRate}%*\n│ ${jamInfo}${weekendInfo}${musimInfo}│ 💯 Total     : *${hasil.pajakPct}%*\n│ └─────\n│\n│ *📈 Tabel Simulasi Berbagai Jumlah:*\n│ ┌───\n${tabelSim}\n│ └─────\n│\n│ 💡 *✅ Bebas* = tidak kena pajak sama sekali\n│\n│ ➤ *${usedPrefix}tf ${simType} ${simCount} @target* untuk transfer langsung`),
          { mentions: [m.sender] }
        )
      }

      // ── VALIDASI TRANSFER ──
      const count = args[1] ? Math.max(1, Math.min(99999999, parseInt(args[1]) || 0)) : 0

      const item = items[type]
      if (!item) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Item Tidak Valid!*\n│\n│ Item *${type}* tidak bisa ditransfer.\n│ ➤ Ketik *${usedPrefix}tf* untuk daftar item.`),
          { mentions: [m.sender] }
        )
      }

      if (!count || count <= 0) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Jumlah Tidak Valid!*\n│\n│ Masukkan jumlah minimal 1.\n│ ➤ Contoh: *${usedPrefix}tf ${type} 100 @teman*`),
          { mentions: [m.sender] }
        )
      }

      if (!who) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Target Tidak Ditemukan!*\n│\n│ Tag seseorang sebagai target transfer.\n│ ➤ Contoh: *${usedPrefix}tf ${type} ${count} @teman*`),
          { mentions: [m.sender] }
        )
      }

      if (who === m.sender) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Tidak Bisa Transfer ke Diri Sendiri!*\n│\n│ Kamu tidak bisa transfer ke akunmu sendiri.`),
          { mentions: [m.sender] }
        )
      }

      if (!global.db.data.users[who]) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Target Tidak Terdaftar!*\n│\n│ User yang kamu tag belum terdaftar di bot.`),
          { mentions: [m.sender] }
        )
      }

      // ── ANTI TAX-DODGE ──
      const dodge      = dbUser._tfDodge
      const smallLimit = smallThreshold(type)
      const isSmall    = count <= smallLimit
      const WINDOW     = 60 * 60 * 1000  // 1 jam

      const LOCK_FREE  = 60 * 60 * 1000   // 1 jam
      const LOCK_TAXED = 30 * 60 * 1000   // 30 mnt

      if (!dbUser._tfDodgeTaxed) dbUser._tfDodgeTaxed = { count: 0, firstTime: 0, locked: false, lockUntil: 0 }

      const isTaxed     = !kalkulasiPajak(type, count, season, hourInfo, weekend).isFree
      const activeDodge = isTaxed ? dbUser._tfDodgeTaxed : dodge

      const LOCK_DURATION = isTaxed ? LOCK_TAXED : LOCK_FREE
      const MAX_ATTEMPTS  = 3

      if (now - activeDodge.firstTime > WINDOW) {
        activeDodge.count    = 0
        activeDodge.firstTime = now
        activeDodge.locked   = false
      }

      if (activeDodge.locked && now < activeDodge.lockUntil) {
        const sisaDetik = activeDodge.lockUntil - now
        const sisaMenit = Math.floor(sisaDetik / 60000)
        const sisaSec   = Math.ceil((sisaDetik % 60000) / 1000)
        const jenisTf   = isTaxed ? 'kena pajak' : 'bebas pajak'
        return sendWithTemplate(
          dino, m,
          decorate(`*⛔ Transfer Terkunci!*\n│\n│ Terlalu sering transfer *${jenisTf}* (${type})!\n│\n│ ⏳ Sisa kunci: *${sisaMenit} menit ${sisaSec} detik*\n│\n│ ${isTaxed ? 'Coba lagi setelah kunci habis.' : `Kamu tetap bisa transfer jumlah >${smallLimit} ${type}.`}`),
          { mentions: [m.sender] }
        )
      } else if (activeDodge.locked && now >= activeDodge.lockUntil) {
        activeDodge.locked = false
        activeDodge.count  = 0
      }

      activeDodge.count === 0 && (activeDodge.firstTime = now)
      activeDodge.count++

      if (activeDodge.count > MAX_ATTEMPTS) {
        activeDodge.locked    = true
        activeDodge.lockUntil = now + LOCK_DURATION
        activeDodge.count     = 0

        const lockMenit = Math.round(LOCK_DURATION / 60000)
        const jenisTf   = isTaxed ? 'kena pajak' : 'bebas pajak'
        return sendWithTemplate(
          dino, m,
          decorate(`*⚠️ Terlalu Banyak Transfer ${isTaxed ? 'Kena Pajak' : 'Bebas Pajak'}!*\n│\n│ *${MAX_ATTEMPTS}x transfer ${jenisTf}* terdeteksi dalam 1 jam!\n│ Transfer *${type}* dikunci selama *${lockMenit} menit*.\n│\n│ ${isTaxed ? 'Coba lagi setelah kunci habis.' : `Selama kunci aktif, kamu tetap bisa transfer\njumlah lebih dari ${smallLimit} ${type}.`}`),
          { mentions: [m.sender] }
        )
      }

      // ── HITUNG PAJAK ──
      const hasil    = kalkulasiPajak(type, count, season, hourInfo, weekend)
      const stokKamu = dbUser[type] || 0

      if (stokKamu < count) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ ${item.label} Tidak Cukup!*\n│\n│ ┌───\n│ │ ${item.emoji} Mau Transfer : *${fmt(count)}*\n│ │ ${item.emoji} Stok Kamu   : *${fmt(stokKamu)}*\n│ │ ❌ Kurang      : *${fmt(count - stokKamu)}*\n│ └─────\n│\n│ 💡 Gunakan *${usedPrefix}tf cek ${type} ${count}* untuk\n│    simulasi sebelum transfer.`),
          { mentions: [m.sender] }
        )
      }

      // ── PROSES TRANSFER ──
      try {
        const target     = global.db.data.users[who]
        const targetName = who.split('@')[0]

        dbUser[type]   -= count
        target[type]    = (target[type] || 0) + hasil.terima

        const musimInfo   = hasil.isSeasonBoost ? `\n│ │ 🌿 Extra Musim : *+20%* (${season.name})` : ''
        const weekendInfo = weekend ? `\n│ │ 🎉 Weekend     : *+25%*` : ''
        const jamInfo     = hourInfo.mult !== 1.0 ? `\n│ │ 🕐 ${hourInfo.label}: *x${hourInfo.mult}*` : ''
        const pajakStatus = hasil.isFree
          ? '✅ BEBAS PAJAK'
          : `*-${fmt(hasil.pajakJumlah)}* (${hasil.pajakPct}%)`

        await sendWithTemplate(
          dino, m,
          decorate(`*⏳ Sedang Memproses Transfer...*\n│\n│ Harap tunggu sebentar...`),
          { react: true, reactDone: '⏳', mentions: [m.sender] }
        )

        await delay(2000)

        return sendWithTemplate(
          dino, m,
          decorate(`*✅ Transfer Berhasil!*\n│\n│ Kamu berhasil kirim ke *@${targetName}*!\n│\n│ *📦 Detail Transfer:*\n│ ┌───\n│ │ ${item.emoji} Item       : *${item.label}*\n│ │ 📤 Dikirim    : *${fmt(count)}*\n│ │ 💸 Pajak      : ${pajakStatus}\n│ │ 📥 Diterima   : *${fmt(hasil.terima)}*\n│ │ 👤 Ke         : *@${targetName}*\n│ └─────\n│\n│ *⚙️ Komponen Pajak:*\n│ ┌───\n│ │ 📋 Base Rate   : *${hasil.baseRate}%*${jamInfo}${weekendInfo}${musimInfo}\n│ │ 💯 Total Pajak : *${hasil.pajakPct}%*\n│ └─────\n│\n│ *Sisa ${item.label} kamu:*\n│ ┌───\n│ │ ${item.emoji} Sisa : *${fmt(dbUser[type])}*\n│ └─────\n│\n│ 💡 Gunakan *${usedPrefix}tf cek ${type} <jumlah>*\n│    untuk simulasi pajak sebelum transfer berikutnya.`),
          { react: true, reactDone: '✅', mentions: [who] }
        )

      } catch (err) {
        dbUser[type] += count
        console.error(err)
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Transfer Gagal!*\n│\n│ Data dikembalikan, coba lagi nanti.`),
          { mentions: [m.sender] }
        )
      }
    }

  }
}