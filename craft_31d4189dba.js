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

    case 'craft': 'menu'; {
      /* CONSTANTS */
      const TIER_NAME = {
        sword:      ['❌ None','🪵 Wooden Sword','🪨 Stone Sword','⚪ Iron Sword','💎 Diamond Sword','🔥 Netherite Sword'],
        pickaxe:    ['❌ None','🪵 Wooden Pickaxe','🪨 Stone Pickaxe','⚪ Iron Pickaxe','💎 Diamond Pickaxe','🔥 Netherite Pickaxe'],
        fishingrod: ['❌ None','🪵 Wooden Rod','🪨 Stone Rod','⚪ Iron Rod','💎 Diamond Rod','🔥 Netherite Rod'],
        armor:      ['❌ None','🟤 Leather Armor','⚪ Iron Armor','🥇 Gold Armor','💎 Diamond Armor','🔥 Netherite Armor'],
        axe:        ['❌ None','🪵 Wooden Axe','🪨 Stone Axe','⚪ Iron Axe','💎 Diamond Axe','🔥 Netherite Axe'],
      }

      const RECIPES = {
        sword: [
          null,
          { wood: 10, iron: 15,             durability: 100, next: '🪨 Stone Sword',      desc: '10 Wood + 15 Iron' },
          { rock: 20, iron: 25,             durability: 200, next: '⚪ Iron Sword',        desc: '20 Rock + 25 Iron' },
          { iron: 50, diamond: 3,           durability: 400, next: '💎 Diamond Sword',    desc: '50 Iron + 3 Diamond' },
          { diamond: 10, gold: 5,           durability: 700, next: '🔥 Netherite Sword',  desc: '10 Diamond + 5 Gold' },
        ],
        pickaxe: [
          null,
          { wood: 10, rock: 5, iron: 5, string: 20,  durability: 100, next: '🪨 Stone Pickaxe',      desc: '10 Wood + 5 Rock + 5 Iron + 20 String' },
          { rock: 20, iron: 20, string: 30,           durability: 200, next: '⚪ Iron Pickaxe',        desc: '20 Rock + 20 Iron + 30 String' },
          { iron: 50, diamond: 3, string: 40,         durability: 400, next: '💎 Diamond Pickaxe',    desc: '50 Iron + 3 Diamond + 40 String' },
          { diamond: 10, gold: 5, string: 50,         durability: 700, next: '🔥 Netherite Pickaxe',  desc: '10 Diamond + 5 Gold + 50 String' },
        ],
        fishingrod: [
          null,
          { wood: 10, iron: 2, string: 20,    durability: 100, next: '🪨 Stone Rod',      desc: '10 Wood + 2 Iron + 20 String' },
          { iron: 20, string: 30,             durability: 200, next: '⚪ Iron Rod',        desc: '20 Iron + 30 String' },
          { diamond: 5, string: 40,           durability: 400, next: '💎 Diamond Rod',    desc: '5 Diamond + 40 String' },
          { diamond: 10, gold: 3, string: 50, durability: 700, next: '🔥 Netherite Rod',  desc: '10 Diamond + 3 Gold + 50 String' },
        ],
        armor: [
          null,
          { iron: 40, rock: 10,     durability: 100, next: '⚪ Iron Armor',      desc: '40 Iron + 10 Rock' },
          { iron: 50, diamond: 5,   durability: 200, next: '🥇 Gold Armor',      desc: '50 Iron + 5 Diamond' },
          { diamond: 10, gold: 5,   durability: 400, next: '💎 Diamond Armor',   desc: '10 Diamond + 5 Gold' },
          { diamond: 20, gold: 15,  durability: 700, next: '🔥 Netherite Armor', desc: '20 Diamond + 15 Gold' },
        ],
        axe: [
          null,
          { wood: 15, iron: 10,   durability: 100, next: '🪨 Stone Axe',      desc: '15 Wood + 10 Iron' },
          { rock: 25, iron: 20,   durability: 200, next: '⚪ Iron Axe',        desc: '25 Rock + 20 Iron' },
          { iron: 40, diamond: 3, durability: 400, next: '💎 Diamond Axe',    desc: '40 Iron + 3 Diamond' },
          { diamond: 8, gold: 5,  durability: 700, next: '🔥 Netherite Axe',  desc: '8 Diamond + 5 Gold' },
        ],
      }

      const BAHAN_LIST = ['wood','rock','iron','diamond','gold','string','coal','botol','herb']
      const VALID_TOOLS = ['sword','pickaxe','fishingrod','armor','axe']

      /* HELPER */
      const dbUser = global.db.data.users[m.sender]

      function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

      function pickRandom(list) { return list[Math.floor(Math.random() * list.length)] }

      function fmt(n) { return (n || 0).toLocaleString('id-ID') }

      function cekBahan(recipe) {
        let missing = []
        for (const bahan of BAHAN_LIST) {
          if (recipe[bahan] && (dbUser[bahan] || 0) < recipe[bahan]) {
            missing.push({ bahan, butuh: recipe[bahan], punya: dbUser[bahan] || 0 })
          }
        }
        return missing
      }

      function kurangiBahan(recipe) {
        for (const bahan of BAHAN_LIST) {
          if (recipe[bahan]) dbUser[bahan] = (dbUser[bahan] || 0) - recipe[bahan]
        }
      }

      function fmtMissing(missing) {
        return missing.map(({ bahan, butuh, punya }) =>
          `│ ❌ ${bahan.charAt(0).toUpperCase() + bahan.slice(1).padEnd(8)}: butuh *${butuh}*, punya *${punya}*`
        ).join('\n')
      }

      /* HANDLER */
      const type = (args[0] || '').toLowerCase()

      // ── MENU UTAMA ──
      if (type === '' || (type !== 'upgrade' && !VALID_TOOLS.includes(type) && type !== 'herb' && type !== 'string')) {

        const sapaan = pickRandom([
          '🔨 Workshop siap, mau bikin apa hari ini?',
          '⚒️ Tukang craft kelas dunia sudah online!',
          '🛠️ Semua bahan tersedia, tinggal craft!',
          '⚙️ Workshop terbuka — pilih yang mau dibuat!',
          '🔧 Saatnya bikin peralatan terbaik!'
        ])

        const stokBaris =
`│ 🪵 Wood     : *${fmt(dbUser.wood)}*
│ 🪨 Rock     : *${fmt(dbUser.rock)}*
│ ⛓️ Iron     : *${fmt(dbUser.iron)}*
│ 💎 Diamond  : *${fmt(dbUser.diamond)}*
│ 🥇 Gold     : *${fmt(dbUser.gold)}*
│ 🕸️ String   : *${fmt(dbUser.string)}*
│ 🖤 Coal     : *${fmt(dbUser.coal)}*
│ 🍶 Botol    : *${fmt(dbUser.botol)}*
│ 🌿 Herb     : *${fmt(dbUser.herb)}*
│ 🗑️ Trash    : *${fmt(dbUser.trash)}*`

        const toolsBaris =
`│ 🥼 Armor
│   ${TIER_NAME.armor[dbUser.armor || 0]}
│   🔧 Durability: *${fmt(dbUser.armordurability)}*
│
│ ⚔️ Sword
│   ${TIER_NAME.sword[dbUser.sword || 0]}
│   🔧 Durability: *${fmt(dbUser.sworddurability)}*
│
│ ⛏️ Pickaxe
│   ${TIER_NAME.pickaxe[dbUser.pickaxe || 0]}
│   🔧 Durability: *${fmt(dbUser.pickaxedurability)}*
│
│ 🎣 Fishing Rod
│   ${TIER_NAME.fishingrod[dbUser.fishingrod || 0]}
│   🔧 Durability: *${fmt(dbUser.fishingroddurability)}*
│
│ 🪓 Axe
│   ${TIER_NAME.axe[dbUser.axe || 0]}
│   🔧 Durability: *${fmt(dbUser.axedurability)}*`

        const menuTeks =
`*🔨 WORKSHOP CRAFTING*
│
│ ${sapaan}
│
├─ *⚔️ TOOLS SAAT INI*
${toolsBaris}
│
├─ *📦 STOK BAHAN*
${stokBaris}
│
├─ *🛠️ CRAFT BARU (jika belum punya):*
│ ⚔️  ➤ *${usedPrefix}craft sword*       — 10 Wood + 15 Iron
│ ⛏️  ➤ *${usedPrefix}craft pickaxe*     — 10 Wood + 5 Rock + 5 Iron + 20 String
│ 🎣  ➤ *${usedPrefix}craft fishingrod*  — 10 Wood + 2 Iron + 20 String
│ 🥼  ➤ *${usedPrefix}craft armor*       — 40 Iron + 10 Rock
│ 🪓  ➤ *${usedPrefix}craft axe*         — 15 Wood + 10 Iron
│
├─ *⬆️ UPGRADE TIER:*
│ ➤ *${usedPrefix}craft upgrade sword*
│ ➤ *${usedPrefix}craft upgrade pickaxe*
│ ➤ *${usedPrefix}craft upgrade fishingrod*
│ ➤ *${usedPrefix}craft upgrade armor*
│ ➤ *${usedPrefix}craft upgrade axe*
│ 💡 Tier makin tinggi = durability lebih besar + reward lebih banyak!
│
├─ *♻️ RECYCLE:*
│ ➤ *${usedPrefix}craft string [jumlah]*
│   100 Trash = 10 String — untuk craft Pickaxe & Rod
│
└─ *🌿 CRAFT HERB:*
  ➤ *${usedPrefix}craft herb [jumlah]*
  5 Rock + 3 Wood = 1 Herb — untuk mengobati pet yang sakit`

        return sendWithTemplate(dino, m, decorate(menuTeks), { mentions: [m.sender] })
      }

      // ── UPGRADE ──
      if (type === 'upgrade') {
        const subTool = (args[1] || '').toLowerCase()

        if (!VALID_TOOLS.includes(subTool)) {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ Pilih Alat Yang Ingin Diupgrade!*\n│\n│ ➤ *${usedPrefix}craft upgrade sword*\n│ ➤ *${usedPrefix}craft upgrade pickaxe*\n│ ➤ *${usedPrefix}craft upgrade fishingrod*\n│ ➤ *${usedPrefix}craft upgrade armor*\n│ ➤ *${usedPrefix}craft upgrade axe*`),
            { react: false, mentions: [m.sender] }
          )
        }

        const curTier = dbUser[subTool] || 0
        const toolLabel = { sword: '⚔️ Sword', pickaxe: '⛏️ Pickaxe', fishingrod: '🎣 Fishing Rod', armor: '🥼 Armor', axe: '🪓 Axe' }

        if (curTier === 0) {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ Belum Punya ${toolLabel[subTool]}!*\n│\n│ Kamu harus craft ${toolLabel[subTool]} terlebih dahulu.\n│\n│ ➤ Ketik: *${usedPrefix}craft ${subTool}*`),
            { react: false, mentions: [m.sender] }
          )
        }

        if (curTier >= 5) {
          return sendWithTemplate(
            dino, m,
            decorate(`*⭐ Sudah Tier MAX!*\n│\n│ *${TIER_NAME[subTool][5]}* sudah di tier tertinggi!\n│ Tidak bisa diupgrade lagi.`),
            { react: false, mentions: [m.sender] }
          )
        }

        const recipe = RECIPES[subTool][curTier]
        if (!recipe) {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ Tidak ada resep untuk tier ini.*`),
            { react: false, mentions: [m.sender] }
          )
        }

        const missing = cekBahan(recipe)
        if (missing.length > 0) {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ Bahan Tidak Cukup!*\n│\n│ Upgrade *${TIER_NAME[subTool][curTier]}* → *${recipe.next}*\n│\n│ *Bahan yang kurang:*\n${fmtMissing(missing)}\n│\n│ *Resep lengkap:*\n│ 📋 ${recipe.desc}\n│\n│ ➤ Cari bahan di *${usedPrefix}nambang*, *${usedPrefix}nebang*, dll.`),
            { react: false, mentions: [m.sender] }
          )
        }

        kurangiBahan(recipe)
        dbUser[subTool] = curTier + 1
        dbUser[`${subTool}durability`] = recipe.durability

        await sendWithTemplate(
          dino, m,
          decorate(`*⬆️ Sedang Mengupgrade...*\n│\n│ Menempa *${TIER_NAME[subTool][curTier]}* menjadi *${recipe.next}*...`),
          { react: true, reactDone: '⬆️', mentions: [m.sender] }
        )

        await delay(2000)

        return sendWithTemplate(
          dino, m,
          decorate(`*✅ Upgrade Berhasil!*\n│\n│ ${TIER_NAME[subTool][curTier]} → *${TIER_NAME[subTool][curTier + 1]}*\n│\n│ *Bahan yang digunakan:*\n│ 📋 ${recipe.desc}\n│\n│ *Status Baru:*\n│ ⚔️ Tool       : *${TIER_NAME[subTool][curTier + 1]}*\n│ 🔧 Durability : *${recipe.durability}*\n│ 📈 Tier       : *${curTier}* → *${curTier + 1}*\n│\n│ 💪 Tier lebih tinggi = reward lebih besar!`),
          { react: true, reactDone: '✅', mentions: [m.sender] }
        )
      }

      // ── CRAFT TOOL BARU ──
      if (VALID_TOOLS.includes(type)) {
        const toolLabel = { sword: '⚔️ Sword', pickaxe: '⛏️ Pickaxe', fishingrod: '🎣 Fishing Rod', armor: '🥼 Armor', axe: '🪓 Axe' }

        const craftRecipes = {
          sword:      { bahan: { wood: 10, iron: 15 },                       durability: 100 },
          pickaxe:    { bahan: { wood: 10, rock: 5, iron: 5, string: 20 },   durability: 100 },
          fishingrod: { bahan: { wood: 10, iron: 2, string: 20 },             durability: 100 },
          armor:      { bahan: { iron: 40, rock: 10 },                        durability: 100 },
          axe:        { bahan: { wood: 15, iron: 10 },                        durability: 100 },
        }

        const { bahan: resepBahan, durability } = craftRecipes[type]
        const tierLabel = TIER_NAME[type][1]

        if ((dbUser[type] || 0) > 0) {
          return sendWithTemplate(
            dino, m,
            decorate(`*⚠️ Sudah Punya ${toolLabel[type]}!*\n│\n│ Kamu sudah punya *${TIER_NAME[type][dbUser[type]]}*\n│\n│ Mau upgrade ke tier lebih tinggi?\n│ ➤ Ketik: *${usedPrefix}craft upgrade ${type}*`),
            { react: false, mentions: [m.sender] }
          )
        }

        const missing = cekBahan(resepBahan)
        if (missing.length > 0) {
          const nextTierDesc = RECIPES[type][1].desc
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ Bahan Tidak Cukup!*\n│\n│ Untuk membuat *${tierLabel}* kamu butuh:\n│\n│ *Bahan yang kurang:*\n${fmtMissing(missing)}\n│\n│ *Resep lengkap:*\n│ 📋 ${nextTierDesc}\n│\n│ ➤ Cari bahan di fitur resource dulu!`),
            { react: false, mentions: [m.sender] }
          )
        }

        kurangiBahan(resepBahan)
        dbUser[type] = 1
        dbUser[`${type}durability`] = durability

        await sendWithTemplate(
          dino, m,
          decorate(`*🔨 Sedang Membuat ${tierLabel}...*\n│\n│ Kamu mulai menempa bahan-bahan di workshop...`),
          { react: true, reactDone: '🔨', mentions: [m.sender] }
        )

        await delay(2000)

        return sendWithTemplate(
          dino, m,
          decorate(`*✅ Craft Berhasil!*\n│\n│ Kamu berhasil membuat *${tierLabel}*!\n│\n│ *Detail:*\n│ 🛠️ Item       : *${tierLabel}*\n│ 🔧 Durability : *${durability}*\n│ 📈 Tier       : *1 / 5*\n│\n│ *Langkah selanjutnya:*\n│ ➤ *${usedPrefix}craft upgrade ${type}* untuk upgrade tier\n│ Tier lebih tinggi = durability lebih besar!`),
          { react: true, reactDone: '✅', mentions: [m.sender] }
        )
      }

      // ── CRAFT HERB ──
      if (type === 'herb') {
        const jumlah   = Math.max(1, parseInt(args[1]) || 1)
        const rockNeeded = jumlah * 5
        const woodNeeded = jumlah * 3

        const missingHerb = []
        if ((dbUser.rock || 0) < rockNeeded) missingHerb.push(`│ ❌ Rock: butuh *${rockNeeded}*, punya *${fmt(dbUser.rock || 0)}*`)
        if ((dbUser.wood || 0) < woodNeeded) missingHerb.push(`│ ❌ Wood: butuh *${woodNeeded}*, punya *${fmt(dbUser.wood || 0)}*`)

        if (missingHerb.length > 0) {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ Bahan Tidak Cukup!*\n│\n│ Untuk craft *${jumlah}x 🌿 Herb* kamu butuh:\n│\n│ *Bahan yang kurang:*\n${missingHerb.join('\n')}\n│\n│ *Resep lengkap (per 1 herb):*\n│ 📋 5 Rock + 3 Wood = 1 Herb\n│\n│ 💡 Rock dari *${usedPrefix}nambang*, Wood dari *${usedPrefix}nebang*`),
            { react: false, mentions: [m.sender] }
          )
        }

        dbUser.rock = (dbUser.rock || 0) - rockNeeded
        dbUser.wood = (dbUser.wood || 0) - woodNeeded
        dbUser.herb = (dbUser.herb || 0) + jumlah

        await sendWithTemplate(
          dino, m,
          decorate(`*🌿 Sedang Meracik Herb...*\n│\n│ Kamu mencampurkan rock dan wood menjadi herb...`),
          { react: true, reactDone: '🌿', mentions: [m.sender] }
        )

        await delay(2000)

        return sendWithTemplate(
          dino, m,
          decorate(`*✅ Craft Herb Berhasil!*\n│\n│ Kamu berhasil membuat *${jumlah}x 🌿 Herb*!\n│\n│ *Bahan yang digunakan:*\n│ 🪨 Rock dipakai : *-${rockNeeded}*\n│ 🪵 Wood dipakai : *-${woodNeeded}*\n│ 🌿 Herb didapat : *+${jumlah}*\n│\n│ *Stok sekarang:*\n│ 🪨 Rock : *${fmt(dbUser.rock)}*\n│ 🪵 Wood : *${fmt(dbUser.wood)}*\n│ 🌿 Herb : *${fmt(dbUser.herb)}*\n│\n│ 💊 Gunakan Herb untuk *${usedPrefix}obatpet* saat pet sakit!`),
          { react: true, reactDone: '✅', mentions: [m.sender] }
        )
      }

      // ── RECYCLE STRING ──
      if (type === 'string') {
        const jumlah     = Math.max(1, parseInt(args[1]) || 1)
        const trashNeeded = jumlah * 100
        const strHasil   = jumlah * 10

        if ((dbUser.trash || 0) < trashNeeded) {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ Trash Tidak Cukup!*\n│\n│ Kamu mau recycle *${jumlah}x* (${trashNeeded} Trash → ${strHasil} String)\n│\n│ *Status Trash:*\n│ 🗑️ Trash Butuh : *${trashNeeded}*\n│ 🗑️ Trash Kamu  : *${fmt(dbUser.trash)}*\n│ ❌ Kurang      : *${trashNeeded - (dbUser.trash || 0)}*\n│\n│ 💡 Trash didapat dari *${usedPrefix}adventure* dan buka crate.\n│ 💡 100 Trash = 10 String`),
            { react: false, mentions: [m.sender] }
          )
        }

        dbUser.trash  -= trashNeeded
        dbUser.string  = (dbUser.string || 0) + strHasil

        await sendWithTemplate(
          dino, m,
          decorate(`*♻️ Sedang Merecycle...*\n│\n│ Memproses ${trashNeeded} Trash menjadi ${strHasil} String...`),
          { react: true, reactDone: '♻️', mentions: [m.sender] }
        )

        await delay(2000)

        return sendWithTemplate(
          dino, m,
          decorate(`*✅ Recycle Berhasil!*\n│\n│ *Detail Recycle:*\n│ 🗑️ Trash Dipakai  : *-${trashNeeded}*\n│ 🕸️ String Didapat : *+${strHasil}*\n│ 🗑️ Sisa Trash     : *${fmt(dbUser.trash)}*\n│ 🕸️ Total String   : *${fmt(dbUser.string)}*\n│\n│ 💡 String digunakan untuk craft Pickaxe & Fishing Rod`),
          { react: true, reactDone: '✅', mentions: [m.sender] }
        )
      }

    }

  }
}