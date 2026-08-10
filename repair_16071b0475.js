const { sendWithTemplate } = require('../../sendWithTemplate')
const { hitungDebuff, buildTimeInfo, getTimeContext } = require('./rpg-time-system.js')

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

    case 'repair': 'menu'; {
      /* CONSTANTS */
      const TIER_DURABILITY_MAX = { 1: 100, 2: 200, 3: 400, 4: 700, 5: 700 }
      const TOOL_NAMES = {
        sword:      ['❌ None','🪵 Wooden Sword','🪨 Stone Sword','⚪ Iron Sword','💎 Diamond Sword','🔥 Netherite Sword'],
        pickaxe:    ['❌ None','🪵 Wooden Pickaxe','🪨 Stone Pickaxe','⚪ Iron Pickaxe','💎 Diamond Pickaxe','🔥 Netherite Pickaxe'],
        fishingrod: ['❌ None','🪵 Wooden Rod','🪨 Stone Rod','⚪ Iron Rod','💎 Diamond Rod','🔥 Netherite Rod'],
        armor:      ['❌ None','🟤 Leather Armor','⚪ Iron Armor','🥇 Gold Armor','💎 Diamond Armor','🔥 Netherite Armor'],
        axe:        ['❌ None','🪵 Wooden Axe','🪨 Stone Axe','⚪ Iron Axe','💎 Diamond Axe','🔥 Netherite Axe'],
      }
      const REPAIR_COST_BASE = {
        1: { moneyPerDur: 50,  matPerDur: 0.5,  mat: 'wood',    matName: '🪵 Wood' },
        2: { moneyPerDur: 120, matPerDur: 0.8,  mat: 'rock',    matName: '🪨 Rock' },
        3: { moneyPerDur: 250, matPerDur: 0.6,  mat: 'iron',    matName: '⛓️ Iron' },
        4: { moneyPerDur: 600, matPerDur: 0.5,  mat: 'diamond', matName: '💎 Diamond' },
        5: { moneyPerDur: 900, matPerDur: 0.3,  mat: 'diamond', matName: '💎 Diamond' },
      }

      /* HELPER */
      const dbUser = global.db.data.users[m.sender]
      const fmt = (n) => (n || 0).toLocaleString('id-ID')
      const tools = ['sword','pickaxe','fishingrod','armor','axe']

      function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

      function hitungBiayaRepair(tier, currentDur) {
        const maxDur = TIER_DURABILITY_MAX[tier] || 100
        const durLost = Math.max(0, maxDur - currentDur)
        if (durLost === 0) return null
        const cost = REPAIR_COST_BASE[tier] || REPAIR_COST_BASE[1]
        const moneyNeeded = Math.ceil(durLost * cost.moneyPerDur)
        const matNeeded   = Math.max(1, Math.ceil(durLost * cost.matPerDur / 10))
        return { durLost, maxDur, moneyNeeded, matNeeded, mat: cost.mat, matName: cost.matName }
      }

      /* HANDLER */
      // Inisialisasi tools
      for (const t of tools) {
        dbUser[t]                = dbUser[t]              || 0
        dbUser[`${t}durability`] = dbUser[`${t}durability`] || 0
      }

      const type = (args[0] || '').toLowerCase()

      // ── MENU UTAMA ──
      if (!type || type === 'menu') {
        const durInfo = (tool) => {
          const tier = dbUser[tool]
          if (tier === 0) return '🔧 Durability: *-*'
          const cur = dbUser[`${tool}durability`]
          const max = TIER_DURABILITY_MAX[tier] || 100
          const cost = hitungBiayaRepair(tier, cur)
          if (!cost) return `🔧 Durability: *${cur}/${max}* ✅`
          return `🔧 Durability: *${cur}/${max}* ⚠️\n│   💸 Repair: ${fmt(cost.moneyNeeded)} 💰 + ${cost.matNeeded} ${cost.matName}`
        }

        return sendWithTemplate(
          dino, m,
          decorate(`*🔧 WORKSHOP REPAIR*
│
│ Perbaiki tool yang rusak sebelum tier turun!
│
│ *⚔️ TOOLS*
│ ┌───
│ │ 🥼 Armor
│ │   ${TOOL_NAMES.armor[dbUser.armor]}
│ │   ${durInfo('armor')}
│ │
│ │ ⚔️ Sword
│ │   ${TOOL_NAMES.sword[dbUser.sword]}
│ │   ${durInfo('sword')}
│ │
│ │ ⛏️ Pickaxe
│ │   ${TOOL_NAMES.pickaxe[dbUser.pickaxe]}
│ │   ${durInfo('pickaxe')}
│ │
│ │ 🎣 Fishing Rod
│ │   ${TOOL_NAMES.fishingrod[dbUser.fishingrod]}
│ │   ${durInfo('fishingrod')}
│ │
│ │ 🪓 Axe
│ │   ${TOOL_NAMES.axe[dbUser.axe]}
│ │   ${durInfo('axe')}
│ └──
│
│ *💼 Sumber Daya:*
│ ┌───
│ │ 💰 Money   : *${fmt(dbUser.money)}*
│ │ 🪵 Wood    : *${fmt(dbUser.wood)}*
│ │ 🪨 Rock    : *${fmt(dbUser.rock)}*
│ │ ⛓️ Iron    : *${fmt(dbUser.iron)}*
│ │ 💎 Diamond : *${fmt(dbUser.diamond)}*
│ └──
│
│ *🛠️ Cara Repair:*
│ ┌───
│ │ ➤ *${usedPrefix}repair sword*
│ │ ➤ *${usedPrefix}repair pickaxe*
│ │ ➤ *${usedPrefix}repair fishingrod*
│ │ ➤ *${usedPrefix}repair armor*
│ │ ➤ *${usedPrefix}repair axe*
│ │ ➤ *${usedPrefix}repair all* (semua sekaligus)
│ └──
│
│ 💡 Biaya repair tergantung tier & tingkat kerusakan.
│ 🕐 Jam sibuk/weekend = diskon repair!`),
          { mentions: [m.sender] }
        )
      }

      // ── REPAIR ALL ──
      if (type === 'all') {
        const toolsToRepair = tools.filter(t => {
          if (dbUser[t] === 0) return false
          const cost = hitungBiayaRepair(dbUser[t], dbUser[`${t}durability`])
          return cost !== null
        })

        if (toolsToRepair.length === 0) {
          return sendWithTemplate(
            dino, m,
            decorate(`*✅ Semua Tool Sudah FULL Durability!*
│
│ Tidak ada tool yang perlu diperbaiki.`),
            { mentions: [m.sender] }
          )
        }

        let totalMoney = 0
        let materialNeeds = {}
        const repairList = []

        for (const t of toolsToRepair) {
          const tier = dbUser[t]
          const cost = hitungBiayaRepair(tier, dbUser[`${t}durability`])
          if (!cost) continue

          const { jam, hari } = getTimeContext()
          let discount = 1.0
          if (jam.kategori === 'SIBUK') discount *= 0.85
          if (hari.isWeekend) discount *= 0.90

          const finalMoney = Math.ceil(cost.moneyNeeded * discount)
          const finalMat = Math.max(1, Math.ceil(cost.matNeeded * discount))

          totalMoney += finalMoney
          materialNeeds[cost.mat] = (materialNeeds[cost.mat] || 0) + finalMat
          repairList.push({ tool: t, cost, finalMoney, finalMat, tier })
        }

        if ((dbUser.money || 0) < totalMoney) {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ Money Tidak Cukup untuk Repair Semua!*
│
│ Dibutuhkan: *${fmt(totalMoney)} 💰*
│ Kamu punya: *${fmt(dbUser.money)} 💰*
│
│ Repair satu per satu dulu!`),
            { mentions: [m.sender] }
          )
        }

        for (const [mat, needed] of Object.entries(materialNeeds)) {
          if ((dbUser[mat] || 0) < needed) {
            return sendWithTemplate(
              dino, m,
              decorate(`*❌ Material Tidak Cukup!*
│
│ *${mat}* dibutuhkan: *${needed}*
│ Kamu punya: *${fmt(dbUser[mat])}*`),
              { mentions: [m.sender] }
            )
          }
        }

        // Eksekusi repair semua
        dbUser.money -= totalMoney
        for (const [mat, needed] of Object.entries(materialNeeds)) {
          dbUser[mat] = (dbUser[mat] || 0) - needed
        }
        const repairResults = []
        for (const { tool, tier } of repairList) {
          const maxDur = TIER_DURABILITY_MAX[tier] || 100
          dbUser[`${tool}durability`] = maxDur
          repairResults.push(`│ ✅ ${TOOL_NAMES[tool][tier]} → Durability FULL (${maxDur})`)
        }

        await sendWithTemplate(
          dino, m,
          decorate(`*🔧 Sedang Memperbaiki Semua Tool...*
│
│ Proses repair berjalan...`),
          { react: true, reactDone: '🔧', mentions: [m.sender] }
        )
        await delay(2000)

        return sendWithTemplate(
          dino, m,
          decorate(`*🔧 Repair Semua Berhasil!*
│
│ ${repairResults.join('\n│ ')}
│
│ 💰 Total Biaya: *-${fmt(totalMoney)}*
│ ${Object.entries(materialNeeds).map(([mat2,n]) => `${n} ${mat2} terpakai`).join('\n│ ')}
│
│ 💰 Sisa Money: *${fmt(dbUser.money)}*`),
          { react: true, reactDone: '✅', mentions: [m.sender] }
        )
      }

      // ── REPAIR SPESIFIK ──
      const validTools = { sword: '⚔️', pickaxe: '⛏️', fishingrod: '🎣', armor: '🥼', axe: '🪓' }
      if (!validTools[type]) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Tool Tidak Dikenal!*
│
│ Pilih: sword | pickaxe | fishingrod | armor | axe | all`),
          { react: false, mentions: [m.sender] }
        )
      }

      if (dbUser[type] === 0) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Kamu Tidak Punya ${type}!*
│
│ ➤ Buat dulu dengan *${usedPrefix}craft ${type}*`),
          { react: false, mentions: [m.sender] }
        )
      }

      const tier = dbUser[type]
      const currentDur = dbUser[`${type}durability`]
      const maxDur = TIER_DURABILITY_MAX[tier] || 100
      const repairCost = hitungBiayaRepair(tier, currentDur)

      if (!repairCost) {
        return sendWithTemplate(
          dino, m,
          decorate(`*✅ ${TOOL_NAMES[type][tier]} Sudah FULL!*
│
│ Durability: *${currentDur}/${maxDur}* — tidak perlu repair.`),
          { mentions: [m.sender] }
        )
      }

      // === TIME SYSTEM — diskon & efek waktu ===
      const timeInfo = buildTimeInfo('wood')
      const { jam, hari } = getTimeContext()

      let discount = 1.0
      let discountMsg = ''
      if (jam.kategori === 'SIBUK') {
        discount *= 0.85
        discountMsg += '\n│ 🔥 Jam Sibuk: Diskon 15% biaya!'
      }
      if (hari.isWeekend) {
        discount *= 0.90
        discountMsg += '\n│ 🎉 Weekend: Diskon 10% biaya!'
      }

      const finalMoney = Math.ceil(repairCost.moneyNeeded * discount)
      const finalMat   = Math.max(1, Math.ceil(repairCost.matNeeded * discount))

      if ((dbUser.money || 0) < finalMoney) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Money Tidak Cukup!*
│
│ Repair *${TOOL_NAMES[type][tier]}*:
│
│ 💰 Biaya     : *${fmt(finalMoney)}*
│ 💰 Kamu punya: *${fmt(dbUser.money)}*
│ ❌ Kurang    : *${fmt(finalMoney - (dbUser.money||0))}*
│
│ ${finalMat} ${repairCost.matName} juga dibutuhkan.`),
          { react: false, mentions: [m.sender] }
        )
      }

      if ((dbUser[repairCost.mat] || 0) < finalMat) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Material Tidak Cukup!*
│
│ Repair *${TOOL_NAMES[type][tier]}* butuh:
│
│ ${repairCost.matName} Dibutuhkan: *${finalMat}*
│ ${repairCost.matName} Kamu punya: *${fmt(dbUser[repairCost.mat])}*
│ ❌ Kurang: *${finalMat - (dbUser[repairCost.mat]||0)}*
│
│ 💰 Money: ${fmt(finalMoney)} (tersedia)`),
          { react: false, mentions: [m.sender] }
        )
      }

      // === EKSEKUSI REPAIR ===
      dbUser.money -= finalMoney
      dbUser[repairCost.mat] = (dbUser[repairCost.mat] || 0) - finalMat
      dbUser[`${type}durability`] = maxDur

      await sendWithTemplate(
        dino, m,
        decorate(`*🔧 Sedang Memperbaiki...*
│
│ ${TOOL_NAMES[type][tier]} sedang diperbaiki...`),
        { react: true, reactDone: '🔧', mentions: [m.sender] }
      )
      await delay(2000)

      return sendWithTemplate(
        dino, m,
        decorate(`*✅ Repair Berhasil!*
│
│ 🛠️ Tool: *${TOOL_NAMES[type][tier]}*
│
│ *Sebelum → Sesudah:*
│ ┌───
│ │ 🔧 Durability: *${currentDur}* → *${maxDur}* (FULL)
│ │ 📈 Diperbaiki: *+${maxDur - currentDur} dur*
│ └──
│
│ *Biaya Repair:*
│ ┌───
│ │ 💰 Money Terpakai : *-${fmt(finalMoney)}*
│ │ ${repairCost.matName} Terpakai : *-${finalMat}*
│ │ 💰 Sisa Money     : *${fmt(dbUser.money)}*
│ ${discountMsg}
│ └──
│
│ ⏱️ *Kondisi Waktu:*
│ ${timeInfo}
│
│ 💡 Repair lagi saat jam sibuk/weekend untuk diskon!`),
        { react: true, reactDone: '✅', mentions: [m.sender] }
      )
    }

  }
}