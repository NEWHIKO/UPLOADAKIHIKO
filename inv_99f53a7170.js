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

    case 'inv':
    case 'inventory': 'menu'; {
      /* CONSTANTS */
      const TOOL_NAME = {
        armor:      ['❌ None','🟤 Leather Armor','⚪ Iron Armor','🥇 Gold Armor','💎 Diamond Armor','🔥 Netherite Armor'],
        sword:      ['❌ None','🪵 Wooden Sword','🪨 Stone Sword','⚪ Iron Sword','💎 Diamond Sword','🔥 Netherite Sword'],
        pickaxe:    ['❌ None','🪵 Wooden Pickaxe','🪨 Stone Pickaxe','⚪ Iron Pickaxe','💎 Diamond Pickaxe','🔥 Netherite Pickaxe'],
        fishingrod: ['❌ None','🪵 Wooden Rod','🪨 Stone Rod','⚪ Iron Rod','💎 Diamond Rod','🔥 Netherite Rod'],
        axe:        ['❌ None','🪵 Wooden Axe','🪨 Stone Axe','⚪ Iron Axe','💎 Diamond Axe','🔥 Netherite Axe'],
      }

      /* HELPER */
      const u    = global.db.data.users[m.sender]
      const fmt  = n => (n || 0).toLocaleString('id-ID')
      const name = pushname || m.sender.split('@')[0]

      function petLevel(n) {
        if (!n || n === 0) return '❌ Belum punya'
        if (n >= 10)       return '👑 Level MAX'
        return `⭐ Level ${n}`
      }
      function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)] }

      const sapaan = pickRandom([
        `🎒 Inventory milik *${name}* — lengkap banget!`,
        `📦 Harta karun *${name}* tersimpan di sini!`,
        `✨ Koleksi *${name}* — makin banyak makin kaya!`,
        `💼 Gudang milik *${name}* — apa aja yang ada?`,
      ])

      const totalHewan = ['buaya','gajah','panda','babihutan','monyet','harimau','kerbau','kambing','ayam','sapi','babi','banteng']
        .reduce((s, k) => s + (u[k] || 0), 0)

      // ikan: hapus "ikan" biasa, sisa 6 jenis
      const totalIkan = ['udang','kepiting','paus','nila','bawal','lele']
        .reduce((s, k) => s + (u[k] || 0), 0)

      /* HANDLER */
      return sendWithTemplate(
        dino, m,
        decorate(`*🎒 INVENTORY*
│
│ ${sapaan}
│
│ ── *📊 STATUS* ──────────────────────
│ ❤️  Health   : *${u.health || 0}*
│ ⚡ Stamina  : *${u.stamina || 0}*
│ 💰 Money    : *${fmt(u.money)}*
│ 🏦 ATM      : *${fmt(u.bank)}*
│ 🌟 Level    : *${u.level || 0}*
│ ✨ EXP      : *${fmt(u.exp)}*
│
│ ── *⚔️ TOOLS* ───────────────────────
│ 🥼 Armor    : ${TOOL_NAME.armor[u.armor || 0]}
│   🔧 Dur    : *${u.armordurability || 0}*
│ ⚔️  Sword    : ${TOOL_NAME.sword[u.sword || 0]}
│   🔧 Dur    : *${u.sworddurability || 0}*
│ ⛏️  Pickaxe  : ${TOOL_NAME.pickaxe[u.pickaxe || 0]}
│   🔧 Dur    : *${u.pickaxedurability || 0}*
│ 🎣 Fish Rod : ${TOOL_NAME.fishingrod[u.fishingrod || 0]}
│   🔧 Dur    : *${u.fishingroddurability || 0}*
│ 🪓 Axe      : ${TOOL_NAME.axe[u.axe || 0]}
│   🔧 Dur    : *${u.axedurability || 0}*
│ ➤ *${usedPrefix}craft* buat tools | *${usedPrefix}repair* perbaiki
│
│ ── *🐾 HEWAN* (${fmt(totalHewan)} ekor) ────────
│ 🐔 Ayam      : *${fmt(u.ayam)}*
│ 🐐 Kambing   : *${fmt(u.kambing)}*
│ 🐄 Sapi      : *${fmt(u.sapi)}*
│ 🐃 Kerbau    : *${fmt(u.kerbau)}*
│ 🐖 Babi      : *${fmt(u.babi)}*
│ 🐅 Harimau   : *${fmt(u.harimau)}*
│ 🐂 Banteng   : *${fmt(u.banteng)}*
│ 🐒 Monyet    : *${fmt(u.monyet)}*
│ 🐗 BabiHutan : *${fmt(u.babihutan)}*
│ 🐼 Panda     : *${fmt(u.panda)}*
│ 🐘 Gajah     : *${fmt(u.gajah)}*
│ 🐊 Buaya     : *${fmt(u.buaya)}*
│ ➤ *${usedPrefix}cook* masak | *${usedPrefix}pasar* jual
│
│ ── *🐟 IKAN* (${fmt(totalIkan)} ekor) ──────────
│ 🐳 Paus      : *${fmt(u.paus)}*
│ 🐟 Lele      : *${fmt(u.lele)}*
│ 🐡 Bawal     : *${fmt(u.bawal)}*
│ 🐠 Nila      : *${fmt(u.nila)}*
│ 🦀 Kepiting  : *${fmt(u.kepiting)}*
│ 🦐 Udang     : *${fmt(u.udang)}*
│ ➤ *${usedPrefix}cook* masak | *${usedPrefix}pasar* jual
│
│ ── *🍱 MAKANAN* ──────────────────────
│ ⭐ *BASIC* (+30~50 stamina)
│ 🍗 AyamGeprek    : *${fmt(u.ayamgeprek || 0)}*
│ 🍢 SateMadura    : *${fmt(u.satemadura || 0)}*
│ 🐒 DendengMonyet : *${fmt(u.dendengmonyet || 0)}*
│ 🐟 LelePenyet    : *${fmt(u.lelepenyet || 0)}*
│ 🐠 PepisNila     : *${fmt(u.pepisnila || 0)}*
│
│ ⭐⭐ *MEDIUM* (+50~70 stamina)
│ 🐖 BabiKecap     : *${fmt(u.babikecap || 0)}*
│ 🐂 TongsengBanteng: *${fmt(u.tonsengbanteng || 0)}*
│ 🐃 SotoKerbau    : *${fmt(u.sotokerbau || 0)}*
│ 🐗 GulaiBabiHutan: *${fmt(u.gulaibabihutan || 0)}*
│ 🐡 BawalManis    : *${fmt(u.bawalmanis || 0)}*
│ 🦐 UdangCrispy   : *${fmt(u.udangcrispy || 0)}*
│
│ ⭐⭐⭐ *PREMIUM* (+70~90 stamina)
│ 🥩 Rendang       : *${fmt(u.rendang || 0)}*
│ 🐅 HarimauRica   : *${fmt(u.harimaurica || 0)}*
│ 🐼 DimsumPanda   : *${fmt(u.dimsumpanda || 0)}*
│ 🐘 SemurGajah    : *${fmt(u.semurgajah || 0)}*
│ 🐊 SupBuaya      : *${fmt(u.supbuaya || 0)}*
│ 🐳 SteakPaus     : *${fmt(u.steakpaus || 0)}*
│ 🦀 KepitingPadang: *${fmt(u.kepitingpadang || 0)}*
│ ➤ *${usedPrefix}eat* makan | *${usedPrefix}cook* masak
│
│ ── *🧂 BUMBU MASAK* ──────────────────
│ 🧅 Bawang  : *${fmt(u.bawang || 0)}*  🧂 Garam   : *${fmt(u.garam || 0)}*
│ 🫙 Minyak  : *${fmt(u.minyak || 0)}*  🌾 Tepung  : *${fmt(u.tepung || 0)}*
│ 🥥 Santan  : *${fmt(u.santan || 0)}*  💛 Kunyit  : *${fmt(u.kunyit || 0)}*
│ 🌶️ Cabai   : *${fmt(u.cabai || 0)}*  🧈 Mentega : *${fmt(u.mentega || 0)}*
│ 🍶 Kecap   : *${fmt(u.kecap || 0)}*  🫚 Jahe    : *${fmt(u.jahe || 0)}*
│ ➤ *${usedPrefix}shop buy <bumbu> <jml>*
│
│ ── *🌿 BUAH & BIBIT* ──────────────────
│ 🥭 Mangga   : *${fmt(u.mangga)}*   🌾 B.Mangga : *${fmt(u.bibitmangga)}*
│ 🍇 Anggur   : *${fmt(u.anggur)}*   🌾 B.Anggur : *${fmt(u.bibitanggur)}*
│ 🍌 Pisang   : *${fmt(u.pisang)}*   🌾 B.Pisang : *${fmt(u.bibitpisang)}*
│ 🍊 Jeruk    : *${fmt(u.jeruk)}*    🌾 B.Jeruk  : *${fmt(u.bibitjeruk)}*
│ 🍎 Apel     : *${fmt(u.apel)}*     🌾 B.Apel   : *${fmt(u.bibitapel)}*
│ ➤ *${usedPrefix}berkebon* | *${usedPrefix}eat pisang 5*
│
│ ── *📦 CRATE* ───────────────────────
│ ⚪ Common    : *${fmt(u.common)}*
│ 🟢 Uncommon  : *${fmt(u.uncommon)}*
│ 🟣 Mythic    : *${fmt(u.mythic)}*
│ 🟡 Legendary : *${fmt(u.legendary)}*
│ 🎫 Pet       : *${fmt(u.pet)}*
│ ➤ *${usedPrefix}open <crate>*
│
│ ── *🎒 MATERIAL* ────────────────────
│ 💎 Diamond   : *${fmt(u.diamond)}*  🧪 Potion  : *${fmt(u.potion)}*
│ 🖤 Coal      : *${fmt(u.coal)}*     🗑️  Trash   : *${fmt(u.trash)}*
│ 🍶 Botol     : *${fmt(u.botol)}*    🥫 Kaleng  : *${fmt(u.kaleng)}*
│ 📦 Kardus    : *${fmt(u.kardus)}*   🪵 Wood    : *${fmt(u.wood)}*
│ 🕸️  String   : *${fmt(u.string)}*   🥇 Gold    : *${fmt(u.gold)}*
│ ⛓️  Iron     : *${fmt(u.iron)}*     🪨 Rock    : *${fmt(u.rock)}*
│ 🌿 Herb      : *${fmt(u.herb)}*
│ ➤ *${usedPrefix}shop* | *${usedPrefix}craft herb [jml]*
│
│ ── *🐉 PELIHARAAN* ───────────────────
│ 🐉 Naga
│   ${petLevel(u.naga)} | ⚡ ${u.nagastamina || 0}
│   ✨ EXP: ${fmt(u.nagaexp || 0)} ${u.naga > 0 && u.naga < 10 ? `/ ${fmt(Math.floor(1000 * Math.pow(u.naga, 1.8)))}` : u.naga >= 10 ? '(MAX)' : ''}
│   🥫 Makanan: *${fmt(u.makanannaga)}*
│
│ 🦜 Phonix
│   ${petLevel(u.phonix)} | ⚡ ${u.phonixstamina || 0}
│   ✨ EXP: ${fmt(u.phonixexp || 0)} ${u.phonix > 0 && u.phonix < 10 ? `/ ${fmt(Math.floor(1000 * Math.pow(u.phonix, 1.8)))}` : u.phonix >= 10 ? '(MAX)' : ''}
│   🥫 Makanan: *${fmt(u.makananphonix)}*
│
│ 🐎 Centaur
│   ${petLevel(u.centaur)} | ⚡ ${u.centaurstamina || 0}
│   ✨ EXP: ${fmt(u.centaurexp || 0)} ${u.centaur > 0 && u.centaur < 10 ? `/ ${fmt(Math.floor(1000 * Math.pow(u.centaur, 1.8)))}` : u.centaur >= 10 ? '(MAX)' : ''}
│   🥫 Makanan: *${fmt(u.makanancentaur)}*
│
│ 🦅 Griffin
│   ${petLevel(u.griffin)} | ⚡ ${u.griffinstamina || 0}
│   ✨ EXP: ${fmt(u.griffinexp || 0)} ${u.griffin > 0 && u.griffin < 10 ? `/ ${fmt(Math.floor(1000 * Math.pow(u.griffin, 1.8)))}` : u.griffin >= 10 ? '(MAX)' : ''}
│   🥫 Makanan: *${fmt(u.makanangriffin)}*
│
│ 🦊 Kyubi
│   ${petLevel(u.kyubi)} | ⚡ ${u.kyubistamina || 0}
│   ✨ EXP: ${fmt(u.kyubiexp || 0)} ${u.kyubi > 0 && u.kyubi < 10 ? `/ ${fmt(Math.floor(1000 * Math.pow(u.kyubi, 1.8)))}` : u.kyubi >= 10 ? '(MAX)' : ''}
│   🥫 Makanan: *${fmt(u.makanankyubi)}*
│ ➤ *${usedPrefix}feed* | *${usedPrefix}leveluppet* | *${usedPrefix}adventurepet*`),
        { mentions: [m.sender] }
      )
    }

  }
}