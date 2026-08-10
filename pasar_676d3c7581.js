const { sendWithTemplate } = require('../../sendWithTemplate')
const { getMusim } = require('./rpg-time-system.js')

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

    case 'pasar': 'menu'; {
      /* CONSTANTS */
      const BASE = {
        kepiting: 5000, udang: 5000, bawal: 5000, lele: 5000,
        paus: 5000, nila: 5000,
        banteng: 9000, harimau: 9000, gajah: 9000, kambing: 9000,
        panda: 9000, buaya: 9000, kerbau: 9000, sapi: 9000,
        monyet: 9000, babihutan: 9000, babi: 9000, ayam: 9000,
      }

      /* HELPER */
      function getSeasonInfo() {
        const musim = getMusim()
        return {
          name: musim.nama,
          mult: {
            ikan:  musim.mult.fishing || 1.0,
            hewan: musim.mult.hunting || 1.0
          }
        }
      }

      function dynPrice(base, item = '', offset = 0) {
        const now = new Date()
        const day = now.getDay()
        const isWeekend = day === 0 || day === 6
        const seed = Math.floor(now.getTime() / 3600000)
        const x = Math.sin(seed + offset) * 10000
        const r = x - Math.floor(x)
        let min = 0.85, max = 1.15
        if (isWeekend) { min = 1.10; max = 1.50 }
        const season = getSeasonInfo()
        const isIkan = ['kepiting','udang','bawal','lele','paus','nila'].includes(item)
        const seasonMult = isIkan ? (season.mult.ikan || 1) : (season.mult.hewan || 1)
        return Math.max(1, Math.floor(base * (min + r * (max - min)) * seasonMult))
      }

      function getHotItems(isWeekend) {
        const month = new Date().getMonth() + 1
        let hot = []
        let cold = []

        if (isWeekend) hot.push('🎉 *Semua hewan & ikan* naik karena WEEKEND!')

        if ([12, 1, 2].includes(month)) {
          hot.push('🌧️ *Semua Ikan* — musim hujan banyak ikan')
          cold.push('🌧️ *Semua Hewan* — susah berburu musim hujan')
        }
        if ([3, 4, 5].includes(month)) {
          hot.push('🌸 *Ikan & Hewan* — musim semi harga naik moderat')
        }
        if ([6, 7, 8].includes(month)) {
          hot.push('☀️ *Semua Hewan* — musim kemarau hewan gemuk')
          cold.push('☀️ *Semua Ikan* — musim kemarau sungai surut')
        }
        if ([9, 10, 11].includes(month)) {
          hot.push('🍂 *Ikan & Hewan* — musim gugur stabil naik tipis')
        }

        let result = ''
        if (hot.length > 0) {
          result += '\n*📈 SEDANG NAIK:*\n'
          result += hot.map(h => `┃ ${h}`).join('\n')
        }
        if (cold.length > 0) {
          result += '\n*📉 SEDANG TURUN:*\n'
          result += cold.map(c => `┃ ${c}`).join('\n')
        }
        return result
      }

      /* HANDLER */
      const dbUser = global.db.data.users[m.sender]
      const type = (args[0] || '').toLowerCase()
      const _type = (args[1] || '').toLowerCase()
      const jualbeli = (args[0] || '').toLowerCase()

      const getItemCount = (item) => dbUser[item] || 0

      const now = new Date()
      const day = now.getDay()
      const hour = now.getHours()
      const isWeekend = day === 0 || day === 6
      const season = getSeasonInfo()
      const hotItems = getHotItems(isWeekend)

      let i = 0
      const prices = {}
      for (const [key, val] of Object.entries(BASE)) {
        prices[key] = dynPrice(val, key, i++)
      }

      const fmt = (n) => n.toLocaleString('id-ID')

      const tren = (cur, base) => {
        const r = cur / base
        if (r >= 1.30) return '🔥'
        if (r >= 1.10) return '📈'
        if (r <= 0.80) return '💸'
        if (r <= 0.92) return '📉'
        return '➡️'
      }

      const pasarMenu = () => {
        const wd = isWeekend ? '🎉 *WEEKEND* — Harga Melonjak!' : '📅 Hari Biasa — Harga Normal'
        return decorate(`*🏪 RPG PASAR*
│
│ ${wd}
│ ${season.name} aktif!
│ 🕐 Update tiap jam — jam *${hour}:00*
│ ${hotItems}
│
│ ➤ *${usedPrefix}pasar jual <item> <jumlah|all>*
│ Contoh: *${usedPrefix}pasar jual ayam all*
│
│ *🐟 HASIL MANCING*
│ ┌──────────
│ │ Paus      J:${fmt(prices.paus).padStart(6)} ${tren(prices.paus,BASE.paus)}
│ │ Bawal     J:${fmt(prices.bawal).padStart(6)} ${tren(prices.bawal,BASE.bawal)}
│ │ Lele      J:${fmt(prices.lele).padStart(6)} ${tren(prices.lele,BASE.lele)}
│ │ Nila      J:${fmt(prices.nila).padStart(6)} ${tren(prices.nila,BASE.nila)}
│ │ Kepiting  J:${fmt(prices.kepiting).padStart(6)} ${tren(prices.kepiting,BASE.kepiting)}
│ │ Udang     J:${fmt(prices.udang).padStart(6)} ${tren(prices.udang,BASE.udang)}
│ └───────
│
│ *🐾 HASIL BERBURU*
│ ┌──────────
│ │ Ayam      J:${fmt(prices.ayam).padStart(6)} ${tren(prices.ayam,BASE.ayam)}
│ │ Kambing   J:${fmt(prices.kambing).padStart(6)} ${tren(prices.kambing,BASE.kambing)}
│ │ Babi      J:${fmt(prices.babi).padStart(6)} ${tren(prices.babi,BASE.babi)}
│ │ Sapi      J:${fmt(prices.sapi).padStart(6)} ${tren(prices.sapi,BASE.sapi)}
│ │ Kerbau    J:${fmt(prices.kerbau).padStart(6)} ${tren(prices.kerbau,BASE.kerbau)}
│ │ Monyet    J:${fmt(prices.monyet).padStart(6)} ${tren(prices.monyet,BASE.monyet)}
│ │ BabiHutan J:${fmt(prices.babihutan).padStart(6)} ${tren(prices.babihutan,BASE.babihutan)}
│ │ Banteng   J:${fmt(prices.banteng).padStart(6)} ${tren(prices.banteng,BASE.banteng)}
│ │ Buaya     J:${fmt(prices.buaya).padStart(6)} ${tren(prices.buaya,BASE.buaya)}
│ │ Panda     J:${fmt(prices.panda).padStart(6)} ${tren(prices.panda,BASE.panda)}
│ │ Gajah     J:${fmt(prices.gajah).padStart(6)} ${tren(prices.gajah,BASE.gajah)}
│ │ Harimau   J:${fmt(prices.harimau).padStart(6)} ${tren(prices.harimau,BASE.harimau)}
│ └───────
│
│ 🔥=Melonjak 📈=Naik ➡️=Stabil
│ 📉=Turun 💸=Anjlok
│ J=Harga Jual`)
      }

      const doSell = (item, count) => {
        const harga = prices[item]
        if (!harga) {
          return sendWithTemplate(dino, m, pasarMenu(), { mentions: [m.sender] })
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
        const total = harga * qty
        dbUser[item] -= qty
        dbUser.money = (dbUser.money || 0) + total
        return sendWithTemplate(
          dino, m,
          decorate(`*✅ Penjualan Berhasil!*
│
│ 🏷️ Item        : *${item}*
│ 📦 Jumlah      : *-${qty}x*
│ 💰 Harga       : *${fmt(harga)}* ${tren(harga,BASE[item])}
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
        const count = parseCount(args[2])
        if (jualbeli === 'jual') {
          if (_type in prices) return doSell(_type, count)
          return sendWithTemplate(dino, m, pasarMenu(), { mentions: [m.sender] })
        }
        return sendWithTemplate(dino, m, pasarMenu(), { mentions: [m.sender] })
      } catch (e) {
        console.log(e)
        return sendWithTemplate(dino, m, pasarMenu(), { mentions: [m.sender] })
      }
    }

  }
}