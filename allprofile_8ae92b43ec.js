const { sendWithTemplate }                 = require('../../sendWithTemplate')
const { getLevelInfo }                     = require('./rpg-levelling')

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

    case 'allprofile': 'menu'; {
      /* CONSTANTS */
      const TOOL_NAME = {
        armor:      ['❌ None','🟤 Leather Armor','⚪ Iron Armor','🥇 Gold Armor','💎 Diamond Armor','🔥 Netherite Armor'],
        sword:      ['❌ None','🪵 Wooden Sword','🪨 Stone Sword','⚪ Iron Sword','💎 Diamond Sword','🔥 Netherite Sword'],
        pickaxe:    ['❌ None','🪵 Wooden Pickaxe','🪨 Stone Pickaxe','⚪ Iron Pickaxe','💎 Diamond Pickaxe','🔥 Netherite Pickaxe'],
        fishingrod: ['❌ None','🪵 Wooden Rod','🪨 Stone Rod','⚪ Iron Rod','💎 Diamond Rod','🔥 Netherite Rod'],
        axe:        ['❌ None','🪵 Wooden Axe','🪨 Stone Axe','⚪ Iron Axe','💎 Diamond Axe','🔥 Netherite Axe'],
      }

      /* HELPER */
      const fmt = n => (n || 0).toLocaleString('id-ID')

      function petLevel(n) {
        if (!n || n === 0) return '❌ Belum punya'
        if (n >= 10)       return '👑 Level MAX'
        return `⭐ Level ${n}`
      }
      function msToDate(ms) {
        const d = Math.floor(ms / 86400000)
        const h = Math.floor(ms / 3600000) % 24
        const min = Math.floor(ms / 60000) % 60
        return `${d} hari ${h} jam ${min} menit`
      }
      function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)] }

      function no(number) {
        return number.replace(/\s/g, '').replace(/([@+-])/g, '')
      }

      /* HANDLER — resolve target */
      if (!args[0] && !m.quoted) {
        return sendWithTemplate(
          dino, m,
          decorate(`*🔍 Cek Profil User*
│
│ Cara penggunaan:
│
│ 👤 Tag orangnya
│   ➤ *${usedPrefix}allprofile @username*
│
│ 📱 Ketik nomornya
│   ➤ *${usedPrefix}allprofile 628xxxxxxxxx*
│
│ 💬 Balas pesan orang
│   ➤ Reply pesan target lalu ketik perintah`),
          { mentions: [m.sender] }
        )
      }

      let who
      try {
        if (args[0]) {
          let cleaned = no(args[0])
          if (isNaN(cleaned)) cleaned = args[0].split('@')[1]
          if (!cleaned || isNaN(cleaned)) {
            return sendWithTemplate(
              dino, m,
              decorate(`*❌ Format Salah!*\n│\n│ ➤ *${usedPrefix}allprofile 628xxxxxxxxx*\n│ ➤ *${usedPrefix}allprofile @username*`),
              { mentions: [m.sender] }
            )
          }
          if (cleaned.length > 15) {
            return sendWithTemplate(
              dino, m,
              decorate(`*❌ Nomor Terlalu Panjang!*\n│\n│ Gunakan nomor WhatsApp yang valid.`),
              { mentions: [m.sender] }
            )
          }
          who = cleaned + '@s.whatsapp.net'
        } else if (m.quoted?.sender) {
          who = m.quoted.sender
        } else {
          return sendWithTemplate(
            dino, m,
            decorate(`*❌ Target Tidak Ditemukan!*\n│\n│ Tag seseorang atau balas pesannya.`),
            { mentions: [m.sender] }
          )
        }
      } catch {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Terjadi Kesalahan!*\n│\n│ Coba lagi dengan format yang benar.`),
          { mentions: [m.sender] }
        )
      }

      const dbAll = global.db.data.users
      if (typeof dbAll[who] === 'undefined') {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ User Tidak Terdaftar!*\n│\n│ User ini belum terdaftar di database bot.`),
          { mentions: [m.sender] }
        )
      }

      const u        = dbAll[who]
      const username = await dino.getName(who)
      const now      = new Date() * 1

      // Level & XP — pakai formula exponential dari rpg-levelling.js
      const { xpNeeded, progressXP, sisaXP } = getLevelInfo(u.level, u.exp)
      const xpRange = xpNeeded

      const jodoh     = u.pasangan ? `💖 Pacar: @${u.pasangan.split('@')[0]}` : '💔 Jomblo'

      const sapaan = pickRandom([
        `🔍 Profil lengkap *${username}* — intip yuk!`,
        `📋 Semua data *${username}* tersedia di sini!`,
        `🕵️ Stalker mode ON — ini profil *${username}*!`,
        `📊 Laporan lengkap milik *${username}*!`,
      ])

      const totalHewan = ['buaya','gajah','panda','babihutan','monyet','harimau','kerbau','kambing','ayam','sapi','babi','banteng']
        .reduce((s, k) => s + (u[k] || 0), 0)
      const totalIkan = ['udang','kepiting','paus','nila','bawal','lele']
        .reduce((s, k) => s + (u[k] || 0), 0)

      return sendWithTemplate(
        dino, m,
        decorate(`*👤 ALL PROFILE*
│
│ ${sapaan}
│ 🔗 wa.me/${who.split('@')[0]}
│
│ ── *📊 STATUS UTAMA* ─────────────────
│ 👤 Nama     : *${username}*
│ 💘 Status   : ${jodoh}
│ 🎖️  Role     : *${u.role || '-'}*
│
│ ── *📈 LEVEL & EXP* ──────────────────
│ 🌟 Level    : *${u.level || 0}*
│ ✨ EXP      : *${fmt(u.exp)}*
│ 📊 Progress : *${fmt(progressXP)} / ${fmt(xpRange)}*
│ 🎯 Sisa     : *${sisaXP > 0 ? fmt(sisaXP) + ' XP' : 'Siap naik level!'}*
│
│ ── *💰 KEUANGAN* ─────────────────────
│ 💰 Money    : *${fmt(u.money)}*
│ 🏦 ATM      : *${fmt(u.bank)}*
│
│ ── *❤️ KONDISI* ──────────────────────
│ ❤️  Health   : *${u.health || 0}*
│ ⚡ Stamina  : *${u.stamina || 0}*
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
│
│ ── *🐟 IKAN* (${fmt(totalIkan)} ekor) ──────────
│ 🐳 Paus      : *${fmt(u.paus)}*
│ 🐟 Lele      : *${fmt(u.lele)}*
│ 🐡 Bawal     : *${fmt(u.bawal)}*
│ 🐠 Nila      : *${fmt(u.nila)}*
│ 🦀 Kepiting  : *${fmt(u.kepiting)}*
│ 🦐 Udang     : *${fmt(u.udang)}*
│
│ ── *🍱 MAKANAN* ──────────────────────
│ ⭐ *BASIC* (+30~50 stamina)
│ 🍗 AyamGeprek     : *${fmt(u.ayamgeprek || 0)}*
│ 🍢 SateMadura     : *${fmt(u.satemadura || 0)}*
│ 🐒 DendengMonyet  : *${fmt(u.dendengmonyet || 0)}*
│ 🐟 LelePenyet     : *${fmt(u.lelepenyet || 0)}*
│ 🐠 PepisNila      : *${fmt(u.pepisnila || 0)}*
│
│ ⭐⭐ *MEDIUM* (+50~70 stamina)
│ 🐖 BabiKecap      : *${fmt(u.babikecap || 0)}*
│ 🐂 TongsengBanteng: *${fmt(u.tonsengbanteng || 0)}*
│ 🐃 SotoKerbau     : *${fmt(u.sotokerbau || 0)}*
│ 🐗 GulaiBabiHutan : *${fmt(u.gulaibabihutan || 0)}*
│ 🐡 BawalManis     : *${fmt(u.bawalmanis || 0)}*
│ 🦐 UdangCrispy    : *${fmt(u.udangcrispy || 0)}*
│
│ ⭐⭐⭐ *PREMIUM* (+70~90 stamina)
│ 🥩 Rendang        : *${fmt(u.rendang || 0)}*
│ 🐅 HarimauRica    : *${fmt(u.harimaurica || 0)}*
│ 🐼 DimsumPanda    : *${fmt(u.dimsumpanda || 0)}*
│ 🐘 SemurGajah     : *${fmt(u.semurgajah || 0)}*
│ 🐊 SupBuaya       : *${fmt(u.supbuaya || 0)}*
│ 🐳 SteakPaus      : *${fmt(u.steakpaus || 0)}*
│ 🦀 KepitingPadang : *${fmt(u.kepitingpadang || 0)}*
│
│ ── *🧂 BUMBU MASAK* ──────────────────
│ 🧅 Bawang  : *${fmt(u.bawang || 0)}*  🧂 Garam   : *${fmt(u.garam || 0)}*
│ 🫙 Minyak  : *${fmt(u.minyak || 0)}*  🌾 Tepung  : *${fmt(u.tepung || 0)}*
│ 🥥 Santan  : *${fmt(u.santan || 0)}*  💛 Kunyit  : *${fmt(u.kunyit || 0)}*
│ 🌶️ Cabai   : *${fmt(u.cabai || 0)}*  🧈 Mentega : *${fmt(u.mentega || 0)}*
│ 🍶 Kecap   : *${fmt(u.kecap || 0)}*  🫚 Jahe    : *${fmt(u.jahe || 0)}*
│
│ ── *🌿 BUAH & BIBIT* ──────────────────
│ 🥭 Mangga   : *${fmt(u.mangga)}*   🌾 B.Mangga : *${fmt(u.bibitmangga)}*
│ 🍇 Anggur   : *${fmt(u.anggur)}*   🌾 B.Anggur : *${fmt(u.bibitanggur)}*
│ 🍌 Pisang   : *${fmt(u.pisang)}*   🌾 B.Pisang : *${fmt(u.bibitpisang)}*
│ 🍊 Jeruk    : *${fmt(u.jeruk)}*    🌾 B.Jeruk  : *${fmt(u.bibitjeruk)}*
│ 🍎 Apel     : *${fmt(u.apel)}*     🌾 B.Apel   : *${fmt(u.bibitapel)}*
│
│ ── *📦 CRATE* ───────────────────────
│ ⚪ Common    : *${fmt(u.common)}*
│ 🟢 Uncommon  : *${fmt(u.uncommon)}*
│ 🟣 Mythic    : *${fmt(u.mythic)}*
│ 🟡 Legendary : *${fmt(u.legendary)}*
│ 🎫 Pet       : *${fmt(u.pet)}*
│
│ ── *🎒 MATERIAL* ────────────────────
│ 💎 Diamond  : *${fmt(u.diamond)}*  🧪 Potion  : *${fmt(u.potion)}*
│ 🖤 Coal     : *${fmt(u.coal)}*     🗑️  Trash   : *${fmt(u.trash)}*
│ 🍶 Botol    : *${fmt(u.botol)}*    🥫 Kaleng  : *${fmt(u.kaleng)}*
│ 📦 Kardus   : *${fmt(u.kardus)}*   🪵 Wood    : *${fmt(u.wood)}*
│ 🕸️  String  : *${fmt(u.string)}*   🥇 Gold    : *${fmt(u.gold)}*
│ ⛓️  Iron    : *${fmt(u.iron)}*     🪨 Rock    : *${fmt(u.rock)}*
│ 🌿 Herb     : *${fmt(u.herb)}*
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
        { mentions: [m.sender, who] }
      )
    }

  }
}