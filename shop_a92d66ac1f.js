const { sendWithTemplate } = require('../../sendWithTemplate')
const { getMusim, getHari, getJam } = require('./rpg-time-system.js')

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

    case 'shop': 'menu';
    case 'toko':
    case 'buy':
    case 'beli':
    case 'sell':
    case 'jual':  {
      /* CONSTANTS */
      const BASE = {
        potion:         { B: 1000,   S: 120 },
        coal:           { B: 1500,   S: null },
        diamond:        { B: 55000,  S: 2200 },
        common:         { B: 500,    S: 60 },
        uncommon:       { B: 1000,   S: 120 },
        pet:            { B: 2500,   S: 300 },
        mythic:         { B: 5000,   S: 350 },
        legendary:      { B: 7000,   S: 450 },
        trash:          { B: 500,    S: 80 },
        string:         { B: 1500,   S: 180 },
        iron:           { B: 2500,   S: 250 },
        rock:           { B: 1000,   S: 150 },
        botol:          { B: 30,     S: 8 },
        kaleng:         { B: 30,     S: 8 },
        kardus:         { B: 30,     S: 8 },
        wood:           { B: 40,     S: 8 },
        gold:           { B: 50000,  S: 2500 },
        bibitpisang:    { B: 5,      S: 3 },
        bibitanggur:    { B: 5,      S: 3 },
        bibitmangga:    { B: 5,      S: 3 },
        bibitjeruk:     { B: 5,      S: 3 },
        bibitapel:      { B: 5,      S: 3 },
        pisang:         { B: 525,    S: 70 },
        anggur:         { B: 525,    S: 70 },
        mangga:         { B: 525,    S: 70 },
        jeruk:          { B: 525,    S: 70 },
        apel:           { B: 525,    S: 70 },
        bawang:         { B: 200,    S: null },
        garam:          { B: 100,    S: null },
        minyak:         { B: 300,    S: null },
        tepung:         { B: 250,    S: null },
        santan:         { B: 400,    S: null },
        kunyit:         { B: 150,    S: null },
        cabai:          { B: 150,    S: null },
        mentega:        { B: 350,    S: null },
        kecap:          { B: 200,    S: null },
        jahe:           { B: 150,    S: null },
        makanannaga:    { B: 5000,   S: 2500 },
        makanankyubi:   { B: 5000,   S: 2500 },
        makanangriffin: { B: 5000,   S: 2500 },
        makananphonix:  { B: 5000,   S: 2500 },
        makanancentaur: { B: 5000,   S: 2500 },
      }

      /* HELPER */
      const dbUser = global.db.data.users[m.sender]

      function getSeasonInfo() {
        const musim = getMusim()
        return { name: musim.nama, mult: { wood: musim.mult.wood, bibit: musim.mult.bibit, buah: musim.mult.buah } }
      }

      function getTimeMultiplier() {
        const now = new Date()
        const hour = now.getHours()
        const day = now.getDay()
        const isWeekend = day === 0 || day === 6
        const seed = Math.floor(now.getTime() / 3600000)
        const seededRand = (min, max, offset = 0) => {
          const x = Math.sin(seed + offset) * 10000
          const r = x - Math.floor(x)
          return min + r * (max - min)
        }
        return { isWeekend, seededRand, hour }
      }

      function dynPrice(base, item = '', offset = 0) {
        const { isWeekend, seededRand } = getTimeMultiplier()
        const season = getSeasonInfo()
        let min = 0.85, max = 1.15
        if (isWeekend) { min = 1.10; max = 1.45 }
        let seasonMult = 1.0
        if (item === 'wood') seasonMult = season.mult.wood || 1.0
        if (item.startsWith('bibit')) seasonMult = season.mult.bibit || 1.0
        if (['pisang','anggur','mangga','jeruk','apel'].includes(item)) seasonMult = season.mult.buah || 1.0
        const rand = seededRand(min, max, offset)
        return Math.max(1, Math.floor(base * rand * seasonMult))
      }

      function getHotItems(isWeekend) {
        const month = new Date().getMonth() + 1
        let hot = []
        let cold = []

        if (isWeekend) hot.push('🎉 *Semua item* naik karena WEEKEND!')

        if ([12, 1, 2].includes(month)) {
          hot.push('🌧️ *Wood* — musim hujan bahan bakar laris')
          cold.push('🌧️ *Bibit & Buah* — susah tumbuh di musim hujan')
        }
        if ([3, 4, 5].includes(month)) {
          hot.push('🌸 *Bibit* — musim semi cocok tanam')
          hot.push('🌸 *Buah* — panen melimpah musim semi')
        }
        if ([6, 7, 8].includes(month)) {
          hot.push('☀️ *Buah* — buah matang di musim kemarau')
          hot.push('☀️ *Bibit* — permintaan tinggi musim kemarau')
          cold.push('☀️ *Wood* — pohon kering harga turun')
        }
        if ([9, 10, 11].includes(month)) {
          hot.push('🍂 *Wood* — kayu melimpah di musim gugur')
        }

        let result = ''
        if (hot.length > 0) {
          result += '\n│ *📈 SEDANG NAIK:*\n'
          result += hot.map(h => `│ ┃ ${h}`).join('\n')
        }
        if (cold.length > 0) {
          result += '\n│ *📉 SEDANG TURUN:*\n'
          result += cold.map(c => `│ ┃ ${c}`).join('\n')
        }
        return result
      }

      /* HANDLER */
      const type = (args[0] || '').toLowerCase()
      const _type = (args[1] || '').toLowerCase()
      const jualbeli = (args[0] || '').toLowerCase()

      const getItemCount = (item) => dbUser[item] || 0
      const calculateMaxBuy = (harga) => Math.floor((dbUser.money || 0) / harga)

      const { isWeekend, hour } = getTimeMultiplier()
      const season = getSeasonInfo()
      const hotItems = getHotItems(isWeekend)

      let i = 0
      const p = {}
      for (const [key, val] of Object.entries(BASE)) {
        p[key] = {
          B: val.B ? dynPrice(val.B, key, i++) : null,
          S: val.S ? dynPrice(val.S, key, i++) : null
        }
      }

      const tren = (cur, base) => {
        if (!cur || !base) return ''
        const r = cur / base
        if (r >= 1.30) return '🔥'
        if (r >= 1.10) return '📈'
        if (r <= 0.80) return '💸'
        if (r <= 0.92) return '📉'
        return '➡️'
      }

      const fmt = (n) => n ? n.toLocaleString('id-ID') : '-'

      const shopMenu = () => {
        const wd = isWeekend ? '🎉 *WEEKEND* — Harga Melonjak!' : '📅 Hari Biasa — Harga Normal'
        return decorate(`*🏪 RPG SHOP*
│
│ ${wd}
│ ${season.name} aktif!
│ 🕐 Update tiap jam — jam *${hour}:00*
│ ${hotItems}
│
│ ➤ *${usedPrefix}shop buy <item> <jumlah|all>*
│ ➤ *${usedPrefix}shop sell <item> <jumlah|all>*
│ Contoh: *${usedPrefix}shop buy potion 5*
│
│ *⚗️ KEBUTUHAN*
│ ┌──────────
│ │ Potion   B:${fmt(p.potion.B).padStart(6)}  J:${fmt(p.potion.S).padStart(5)} ${tren(p.potion.S,BASE.potion.S)}
│ │ Coal     B:${fmt(p.coal.B).padStart(6)}   J:-
│ └───────
│
│ *💎 BARANG BERHARGA*
│ ┌──────────
│ │ Diamond  B:${fmt(p.diamond.B).padStart(7)} J:${fmt(p.diamond.S).padStart(5)} ${tren(p.diamond.S,BASE.diamond.S)}
│ │ Gold     B:${fmt(p.gold.B).padStart(7)} J:${fmt(p.gold.S).padStart(5)} ${tren(p.gold.S,BASE.gold.S)}
│ │ Iron     B:${fmt(p.iron.B).padStart(6)}  J:${fmt(p.iron.S).padStart(5)} ${tren(p.iron.S,BASE.iron.S)}
│ │ String   B:${fmt(p.string.B).padStart(6)}  J:${fmt(p.string.S).padStart(5)} ${tren(p.string.S,BASE.string.S)}
│ └───────
│
│ *📦 MATERIAL*
│ ┌──────────
│ │ Rock     B:${fmt(p.rock.B).padStart(6)}  J:${fmt(p.rock.S).padStart(5)} ${tren(p.rock.S,BASE.rock.S)}
│ │ Wood     B:${fmt(p.wood.B).padStart(6)}     J:${fmt(p.wood.S).padStart(5)} ${tren(p.wood.S,BASE.wood.S)}
│ │ Botol    B:${fmt(p.botol.B).padStart(6)}     J:${fmt(p.botol.S).padStart(5)} ${tren(p.botol.S,BASE.botol.S)}
│ │ Kaleng   B:${fmt(p.kaleng.B).padStart(6)}     J:${fmt(p.kaleng.S).padStart(5)} ${tren(p.kaleng.S,BASE.kaleng.S)}
│ │ Kardus   B:${fmt(p.kardus.B).padStart(6)}     J:${fmt(p.kardus.S).padStart(5)} ${tren(p.kardus.S,BASE.kardus.S)}
│ │ Trash    B:${fmt(p.trash.B).padStart(6)}    J:${fmt(p.trash.S).padStart(5)} ${tren(p.trash.S,BASE.trash.S)}
│ └───────
│
│ *📦 CRATE*
│ ┌──────────
│ │ Common   B:${fmt(p.common.B).padStart(6)}    J:${fmt(p.common.S).padStart(5)} ${tren(p.common.S,BASE.common.S)}
│ │ Uncommon B:${fmt(p.uncommon.B).padStart(6)}   J:${fmt(p.uncommon.S).padStart(5)} ${tren(p.uncommon.S,BASE.uncommon.S)}
│ │ Pet      B:${fmt(p.pet.B).padStart(6)}   J:${fmt(p.pet.S).padStart(5)} ${tren(p.pet.S,BASE.pet.S)}
│ │ Mythic   B:${fmt(p.mythic.B).padStart(6)}   J:${fmt(p.mythic.S).padStart(5)} ${tren(p.mythic.S,BASE.mythic.S)}
│ │ Legendary B:${fmt(p.legendary.B).padStart(6)}  J:${fmt(p.legendary.S).padStart(5)} ${tren(p.legendary.S,BASE.legendary.S)}
│ └───────
│
│ *🧂 BUMBU MASAK*
│ ┌──────────
│ │ Bawang   B:${fmt(p.bawang.B).padStart(6)}
│ │ Garam    B:${fmt(p.garam.B).padStart(6)}
│ │ Minyak   B:${fmt(p.minyak.B).padStart(6)}
│ │ Tepung   B:${fmt(p.tepung.B).padStart(6)}
│ │ Santan   B:${fmt(p.santan.B).padStart(6)}
│ │ Kunyit   B:${fmt(p.kunyit.B).padStart(6)}
│ │ Cabai    B:${fmt(p.cabai.B).padStart(6)}
│ │ Mentega  B:${fmt(p.mentega.B).padStart(6)}
│ │ Kecap    B:${fmt(p.kecap.B).padStart(6)}
│ │ Jahe     B:${fmt(p.jahe.B).padStart(6)}
│ └───────
│
│ *🌱 BIBIT BUAH* ${tren(p.bibitpisang.B,BASE.bibitpisang.B)}
│ ┌──────────
│ │ Pisang   B:${fmt(p.bibitpisang.B).padStart(6)}  J:${fmt(p.bibitpisang.S).padStart(5)}
│ │ Anggur   B:${fmt(p.bibitanggur.B).padStart(6)}  J:${fmt(p.bibitanggur.S).padStart(5)}
│ │ Mangga   B:${fmt(p.bibitmangga.B).padStart(6)}  J:${fmt(p.bibitmangga.S).padStart(5)}
│ │ Jeruk    B:${fmt(p.bibitjeruk.B).padStart(6)}  J:${fmt(p.bibitjeruk.S).padStart(5)}
│ │ Apel     B:${fmt(p.bibitapel.B).padStart(6)}  J:${fmt(p.bibitapel.S).padStart(5)}
│ └───────
│
│ *🍎 BUAH* ${tren(p.pisang.S,BASE.pisang.S)}
│ ┌──────────
│ │ Pisang   B:${fmt(p.pisang.B).padStart(6)}  J:${fmt(p.pisang.S).padStart(5)}
│ │ Anggur   B:${fmt(p.anggur.B).padStart(6)}  J:${fmt(p.anggur.S).padStart(5)}
│ │ Mangga   B:${fmt(p.mangga.B).padStart(6)}  J:${fmt(p.mangga.S).padStart(5)}
│ │ Jeruk    B:${fmt(p.jeruk.B).padStart(6)}  J:${fmt(p.jeruk.S).padStart(5)}
│ │ Apel     B:${fmt(p.apel.B).padStart(6)}  J:${fmt(p.apel.S).padStart(5)}
│ └───────
│
│ *🐾 MAKANAN PET*
│ ┌──────────
│ │ Naga     B:${fmt(p.makanannaga.B).padStart(6)} J:${fmt(p.makanannaga.S).padStart(5)}
│ │ Kyubi    B:${fmt(p.makanankyubi.B).padStart(6)} J:${fmt(p.makanankyubi.S).padStart(5)}
│ │ Griffin  B:${fmt(p.makanangriffin.B).padStart(6)} J:${fmt(p.makanangriffin.S).padStart(5)}
│ │ Phonix   B:${fmt(p.makananphonix.B).padStart(6)} J:${fmt(p.makananphonix.S).padStart(5)}
│ │ Centaur  B:${fmt(p.makanancentaur.B).padStart(6)} J:${fmt(p.makanancentaur.S).padStart(5)}
│ └───────
│
│ 🔥=Melonjak 📈=Naik ➡️=Stabil
│ 📉=Turun 💸=Anjlok
│ B=Beli J=Jual`)
      }

      const doBuy = (item, count) => {
        const pp = p[item]
        if (!pp || pp.B === null) {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ Item Tidak Bisa Dibeli!*
│
│ Item *${item}* hanya bisa dijual.`),
            { mentions: [m.sender] }
          )
        }
        const qty = count === 'all' ? calculateMaxBuy(pp.B) : Number(count)
        if (!qty || qty <= 0) {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ Money Tidak Cukup!*
│
│ Money kamu tidak cukup untuk membeli *${item}*.
│
│ 💰 Money Kamu : *${fmt(dbUser.money)}*
│ 💵 Harga      : *${fmt(pp.B)}* per item`),
            { mentions: [m.sender] }
          )
        }
        const total = pp.B * qty
        if ((dbUser.money || 0) < total) {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ Pembelian Gagal!*
│
│ 🛒 Item        : *${item}*
│ 📦 Jumlah      : *${qty}x*
│ 💵 Harga       : *${fmt(pp.B)}* ${tren(pp.B,BASE[item].B)}
│ 💳 Total       : *${fmt(total)}*
│ 💰 Money Kamu  : *${fmt(dbUser.money)}*
│ ❌ Kurang      : *${fmt(total - (dbUser.money||0))}*`),
            { mentions: [m.sender] }
          )
        }
        dbUser.money -= total
        dbUser[item] = getItemCount(item) + qty
        return sendWithTemplate(
          dino, m,
          decorate(`*✅ Pembelian Berhasil!*
│
│ 🛒 Item        : *${item}*
│ 📦 Jumlah      : *+${qty}x*
│ 💵 Harga       : *${fmt(pp.B)}* ${tren(pp.B,BASE[item].B)}
│ 💳 Total Bayar : *-${fmt(total)}*
│ 💰 Sisa Money  : *${fmt(dbUser.money)}*`),
          { mentions: [m.sender] }
        )
      }

      const doSell = (item, count) => {
        const pp = p[item]
        if (!pp || pp.S === null) {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ Item Tidak Bisa Dijual!*
│
│ Item *${item}* tidak tersedia di shop.
│ Coba jual di *${usedPrefix}pasar* untuk hewan & ikan.`),
            { mentions: [m.sender] }
          )
        }
        const qty = count === 'all' ? getItemCount(item) : Number(count)
        if (!qty || qty <= 0) {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ Penjualan Gagal!*
│
│ Kamu tidak punya *${item}* untuk dijual.
│
│ 📦 Stok ${item}: *${getItemCount(item)}*`),
            { mentions: [m.sender] }
          )
        }
        if (getItemCount(item) < qty) {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ Stok Tidak Cukup!*
│
│ 🏷️ Item      : *${item}*
│ 📦 Stok Kamu : *${getItemCount(item)}*
│ 📦 Mau Jual  : *${qty}*
│ ❌ Kurang    : *${qty - getItemCount(item)}*`),
            { mentions: [m.sender] }
          )
        }
        const total = pp.S * qty
        dbUser[item] -= qty
        dbUser.money = (dbUser.money || 0) + total
        return sendWithTemplate(
          dino, m,
          decorate(`*✅ Penjualan Berhasil!*
│
│ 🏷️ Item        : *${item}*
│ 📦 Jumlah      : *-${qty}x*
│ 💰 Harga       : *${fmt(pp.S)}* ${tren(pp.S,BASE[item].S)}
│ 💵 Total Dapat : *+${fmt(total)}*
│ 💰 Total Money : *${fmt(dbUser.money)}*`),
          { mentions: [m.sender] }
        )
      }

      const parseCount = (raw) => {
        if (!raw) return 1
        if (raw.toLowerCase() === 'all') return 'all'
        return Math.max(1, parseInt(raw) || 1)
      }

      try {
        if (command === 'shop' || command === 'toko') {
          const count = parseCount(args[2])
          if (jualbeli === 'buy') {
            if (_type in p) return doBuy(_type, count)
            return sendWithTemplate(dino, m, shopMenu(), { mentions: [m.sender] })
          } else if (jualbeli === 'sell') {
            if (_type in p) return doSell(_type, count)
            return sendWithTemplate(dino, m, shopMenu(), { mentions: [m.sender] })
          }
          return sendWithTemplate(dino, m, shopMenu(), { mentions: [m.sender] })
        } else if (command === 'sell' || command === 'jual') {
          const count = parseCount(args[1])
          if (type in p) return doSell(type, count)
          return sendWithTemplate(dino, m, shopMenu(), { mentions: [m.sender] })
        } else if (command === 'buy' || command === 'beli') {
          const count = parseCount(args[1])
          if (type in p) return doBuy(type, count)
          return sendWithTemplate(dino, m, shopMenu(), { mentions: [m.sender] })
        }
        return sendWithTemplate(dino, m, shopMenu(), { mentions: [m.sender] })
      } catch (e) {
        console.log(e)
        return sendWithTemplate(dino, m, shopMenu(), { mentions: [m.sender] })
      }
    }

  }
}