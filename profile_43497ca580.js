const { sendWithTemplate }                 = require('../../sendWithTemplate')
const { getLevelInfo, progressBar: xpBar } = require('./rpg-levelling')

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

    case 'profile': 'menu'; {
      /* CONSTANTS */
      const TOOL_NAME = {
        armor:      ['❌ None','🟤 Leather Armor','⚪ Iron Armor','🥇 Gold Armor','💎 Diamond Armor','🔥 Netherite Armor'],
        sword:      ['❌ None','🪵 Wooden Sword','🪨 Stone Sword','⚪ Iron Sword','💎 Diamond Sword','🔥 Netherite Sword'],
        pickaxe:    ['❌ None','🪵 Wooden Pickaxe','🪨 Stone Pickaxe','⚪ Iron Pickaxe','💎 Diamond Pickaxe','🔥 Netherite Pickaxe'],
        fishingrod: ['❌ None','🪵 Wooden Rod','🪨 Stone Rod','⚪ Iron Rod','💎 Diamond Rod','🔥 Netherite Rod'],
        axe:        ['❌ None','🪵 Wooden Axe','🪨 Stone Axe','⚪ Iron Axe','💎 Diamond Axe','🔥 Netherite Axe'],
      }

      /* HELPER */
      function pickRandom(list) {
        return list[Math.floor(Math.random() * list.length)]
      }

      function petLevel(n) {
        if (!n || n === 0) return '❌ Belum punya'
        if (n >= 10) return '👑 MAX'
        return `⭐ Lv.${n}`
      }

      function progressBar(cur, total, len = 10) {
        if (!total || total <= 0) return '░'.repeat(len)
        let ratio = Math.max(0, Math.min(1, cur / total))
        let filled = Math.round(ratio * len)
        return '█'.repeat(filled) + '░'.repeat(len - filled)
      }

      function levelBadge(lvl) {
        if (lvl >= 100) return '👑'
        if (lvl >= 75)  return '💎'
        if (lvl >= 50)  return '🥇'
        if (lvl >= 25)  return '🥈'
        if (lvl >= 10)  return '🥉'
        return '🌱'
      }

      // getLevelInfo diambil dari lib/rpg-levelling.js (exponential curve)

      /* HANDLER */
      try {
        // Get metadata grup
        const meta = await dino.groupMetadata(m.chat)

        function lidToJid(lid) {
          const user = meta.participants.find(p => p.lid === lid)
          return user?.jid || null
        }

        // ✅ Ambil mentioned jid (pakai m.mentionedJid — reliable utk semua tipe pesan, sama kayak fun.js)
        let mentioned = [...(m.mentionedJid || [])]

        // ✅ Support reply juga (pakai m.quoted?.sender — udah di-generate smsg(), gak perlu gali manual)
        if (m.quoted?.sender) {
          mentioned.push(m.quoted.sender)
        }

        // Jika tidak ada mention/reply
        if (mentioned.length === 0) {
          return reply(decorate(`*👤 Cek Profil User*
│
│ Cara penggunaan:
│
│ 👤 *Tag orangnya*
│ ➤ *${usedPrefix}profile @username*
│
│ 💬 *Balas pesan orang*
│ ➤ Reply pesan target lalu ketik perintah`))
        }

        // Loop setiap mention
        for (let jid of mentioned) {
          let targetJid = jid

          // Jika @lid convert ke jid
          if (jid.endsWith('@lid')) {
            const converted = lidToJid(jid)
            if (converted) {
              targetJid = converted
            } else {
              reply(decorate(`*❌ Tidak Ketemu*
│
│ User dengan LID ${jid} tidak ditemukan.`))
              continue
            }
          }

          // Cek user di database
          if (!global.db.data.users[targetJid]) {
            reply(decorate(`*❌ User Tidak Terdaftar!*
│
│ User ini belum terdaftar di database bot.`))
            continue
          }

          // Ambil data user
          const u = global.db.data.users[targetJid]
          const targetNumber = targetJid.split('@')[0]
          const username = await dino.getName(targetJid)

          // Hitung level & xp
          const { xpNeeded, progressXP, sisaXP, pct } = getLevelInfo(u.level, u.exp)
          const bar = progressBar(progressXP, xpNeeded)

          // Status jodoh
          const jodoh = u.pasangan
            ? `💖 *Pacar:* @${u.pasangan.split('@')[0]}`
            : '💔 *Status:* Jomblo'

          // Random sapaan
          const sapaan = pickRandom([
            `🌟 Ini dia profil lengkap *${username}*!`,
            `📋 Semua info tentang *${username}* ada di sini!`,
            `🔍 Profil *${username}* berhasil ditemukan!`,
            `👀 Intip profil *${username}* yuk!`,
            `💼 Data lengkap milik *${username}*!`
          ])

          // Kirim profile
          await sendWithTemplate(
            dino, m,
            decorate(`*👤 PROFILE*
│
│ ${sapaan}
│
│ *📌 INFO UTAMA*
│ ┌───
│ │ 👤 Nama     : *${username}*
│ │ 📱 Nomor    : *${targetNumber}*
│ │ 🎖️ Role     : *${u.role || '-'}*
│ │ ${jodoh}
│ └──
│
│ *📈 LEVEL & EXP*
│ ┌───
│ │ ${levelBadge(u.level)} Level    : *${u.level || 1}*
│ │ ✨ EXP      : *${(progressXP).toLocaleString('id-ID')}*
│ │ 📊 Progress : *${progressXP.toLocaleString('id-ID')} / ${xpNeeded.toLocaleString('id-ID')}*
│ │ [${bar}] ${pct}%
│ │ 🎯 Sisa XP  : *${sisaXP > 0 ? sisaXP.toLocaleString('id-ID') + ' XP' : '🚀 Siap naik level!'}*
│ └──
│
│ *💰 KEUANGAN*
│ ┌───
│ │ 💰 Money    : *${(u.money || 0).toLocaleString('id-ID')}*
│ │ 🏦 ATM      : *${(u.bank || 0).toLocaleString('id-ID')}*
│ └──
│
│ *❤️ KONDISI*
│ ┌───
│ │ ❤️ Health   : *${u.health || 0}*
│ │ ⚡ Stamina  : *${u.stamina || 0}*
│ └──
│
│ *⚔️ TOOLS*
│ ┌───
│ │ 🥼 Armor
│ │   ${TOOL_NAME.armor[u.armor || 0]}
│ │   🔧 Durability: *${u.armordurability || 0}*
│ │
│ │ ⚔️ Sword
│ │   ${TOOL_NAME.sword[u.sword || 0]}
│ │   🔧 Durability: *${u.sworddurability || 0}*
│ │
│ │ ⛏️ Pickaxe
│ │   ${TOOL_NAME.pickaxe[u.pickaxe || 0]}
│ │   🔧 Durability: *${u.pickaxedurability || 0}*
│ │
│ │ 🎣 Fishing Rod
│ │   ${TOOL_NAME.fishingrod[u.fishingrod || 0]}
│ │   🔧 Durability: *${u.fishingroddurability || 0}*
│ │
│ │ 🪓 Axe
│ │   ${TOOL_NAME.axe[u.axe || 0]}
│ │   🔧 Durability: *${u.axedurability || 0}*
│ └──
│
│ *🐉 PELIHARAAN*
│ ┌───
│ │ 🐉 Naga     : ${petLevel(u.naga)} | ⚡${u.nagastamina || 0}
│ │ 🦜 Phonix   : ${petLevel(u.phonix)} | ⚡${u.phonixstamina || 0}
│ │ 🐎 Centaur  : ${petLevel(u.centaur)} | ⚡${u.centaurstamina || 0}
│ │ 🦅 Griffin  : ${petLevel(u.griffin)} | ⚡${u.griffinstamina || 0}
│ │ 🦊 Kyubi    : ${petLevel(u.kyubi)} | ⚡${u.kyubistamina || 0}
│ └──
│
│ *📦 CRATE*
│ ┌───
│ │ ⚪ Common    : *${(u.common || 0).toLocaleString('id-ID')}*
│ │ 🟢 Uncommon  : *${(u.uncommon || 0).toLocaleString('id-ID')}*
│ │ 🟣 Mythic    : *${(u.mythic || 0).toLocaleString('id-ID')}*
│ │ 🟡 Legendary : *${(u.legendary || 0).toLocaleString('id-ID')}*
│ │ 🎫 Pet       : *${(u.pet || 0).toLocaleString('id-ID')}*
│ └──
│ ➤ *${usedPrefix}open <crate>* untuk buka crate`),
            { mentions: [m.sender, targetJid] }
          )
        }

      } catch (e) {
        console.error('Profile Error:', e)
        reply(decorate(`*❌ Terjadi Kesalahan!*
│
│ Silakan coba lagi nanti.`))
      }
    }
    break

  }
}

/*const { sendWithTemplate } = require('../../sendWithTemplate')

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

    case 'profile': 'menu'; {
    
      const TOOL_NAME = {
        armor:      ['❌ None','🟤 Leather Armor','⚪ Iron Armor','🥇 Gold Armor','💎 Diamond Armor','🔥 Netherite Armor'],
        sword:      ['❌ None','🪵 Wooden Sword','🪨 Stone Sword','⚪ Iron Sword','💎 Diamond Sword','🔥 Netherite Sword'],
        pickaxe:    ['❌ None','🪵 Wooden Pickaxe','🪨 Stone Pickaxe','⚪ Iron Pickaxe','💎 Diamond Pickaxe','🔥 Netherite Pickaxe'],
        fishingrod: ['❌ None','🪵 Wooden Rod','🪨 Stone Rod','⚪ Iron Rod','💎 Diamond Rod','🔥 Netherite Rod'],
        axe:        ['❌ None','🪵 Wooden Axe','🪨 Stone Axe','⚪ Iron Axe','💎 Diamond Axe','🔥 Netherite Axe'],
      }

    
      function pickRandom(list) {
        return list[Math.floor(Math.random() * list.length)]
      }

      function petLevel(n) {
        if (!n || n === 0) return '❌ Belum punya'
        if (n >= 10) return '👑 MAX'
        return `⭐ Lv.${n}`
      }

      function progressBar(cur, total, len = 10) {
        if (!total || total <= 0) return '░'.repeat(len)
        let ratio = Math.max(0, Math.min(1, cur / total))
        let filled = Math.round(ratio * len)
        return '█'.repeat(filled) + '░'.repeat(len - filled)
      }

      function levelBadge(lvl) {
        if (lvl >= 100) return '👑'
        if (lvl >= 75)  return '💎'
        if (lvl >= 50)  return '🥇'
        if (lvl >= 25)  return '🥈'
        if (lvl >= 10)  return '🥉'
        return '🌱'
      }

      // getLevelInfo diambil dari lib/rpg-levelling.js (exponential curve)
      // Formula: xpNeeded = 800 × level^1.75 + 200 × level

      const cleanNumber = (num) => num.replace(/\s/g, '').replace(/[@+-]/g, '')

      
      // Panduan jika tidak ada input
      if (!args[0] && !m.quoted) {
        return sendWithTemplate(
          dino, m,
          decorate(`*👤 Cek Profil User*
│
│ Cara penggunaan:
│
│ 👤 *Tag orangnya*
│ ➤ *${usedPrefix}profile @username*
│
│ 📱 *Ketik nomornya*
│ ➤ *${usedPrefix}profile 628xxxxxxxxx*
│
│ 💬 *Balas pesan orang*
│ ➤ Reply pesan target lalu ketik perintah`),
          { mentions: [m.sender] }
        )
      }

      // Tentukan target
      let number = ''
      let input = args.join(' ')

      if (input) {
        number = cleanNumber(input)
        if (isNaN(number) && input.includes('@')) {
          number = input.split('@')[1]
        }
      } else if (m.quoted) {
        number = m.quoted.sender.split('@')[0]
      }

      if (!number || isNaN(number)) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Format Salah!*
│
│ Gunakan format yang benar:
│ ➤ *${usedPrefix}profile 628xxxxxxxxx*
│ ➤ *${usedPrefix}profile @username*`),
          { react: false, mentions: [m.sender] }
        )
      }

      if (number.length > 15) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Nomor Terlalu Panjang!*
│
│ Gunakan nomor WhatsApp yang valid.`),
          { react: false, mentions: [m.sender] }
        )
      }

      const who = number + '@s.whatsapp.net'

      if (!global.db.data.users[who]) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ User Tidak Terdaftar!*
│
│ User ini belum terdaftar di database bot.`),
          { react: false, mentions: [m.sender] }
        )
      }

      const u = global.db.data.users[who]
      const username = dino.getName ? dino.getName(who) : number

      // Level & XP — pakai formula exponential dari rpg-levelling.js
      const { xpNeeded, progressXP, sisaXP, pct } = getLevelInfo(u.level, u.exp)
      const bar = progressBar(progressXP, xpNeeded)

      // Status jodoh
      const jodoh = u.pasangan
        ? `💖 *Pacar:* @${u.pasangan.split('@')[0]}`
        : '💔 *Status:* Jomblo'

      const sapaan = pickRandom([
        `🌟 Ini dia profil lengkap *${username}*!`,
        `📋 Semua info tentang *${username}* ada di sini!`,
        `🔍 Profil *${username}* berhasil ditemukan!`,
        `👀 Intip profil *${username}* yuk!`,
        `💼 Data lengkap milik *${username}*!`
      ])

      return sendWithTemplate(
        dino, m,
        decorate(`*👤 PROFILE*
│
│ ${sapaan}
│
│ *📌 INFO UTAMA*
│ ┌───
│ │ 👤 Nama     : *${username}*
│ │ 📱 Nomor    : *${number}*
│ │ 🎖️ Role     : *${u.role || '-'}*
│ │ ${jodoh}
│ └──
│
│ *📈 LEVEL & EXP*
│ ┌───
│ │ ${levelBadge(u.level)} Level    : *${u.level || 1}*
│ │ ✨ EXP      : *${(progressXP).toLocaleString('id-ID')}*
│ │ 📊 Progress : *${progressXP.toLocaleString('id-ID')} / ${xpNeeded.toLocaleString('id-ID')}*
│ │ [${bar}] ${pct}%
│ │ 🎯 Sisa XP  : *${sisaXP > 0 ? sisaXP.toLocaleString('id-ID') + ' XP' : '🚀 Siap naik level!'}*
│ └──
│
│ *💰 KEUANGAN*
│ ┌───
│ │ 💰 Money    : *${(u.money || 0).toLocaleString('id-ID')}*
│ │ 🏦 ATM      : *${(u.bank || 0).toLocaleString('id-ID')}*
│ └──
│
│ *❤️ KONDISI*
│ ┌───
│ │ ❤️ Health   : *${u.health || 0}*
│ │ ⚡ Stamina  : *${u.stamina || 0}*
│ └──
│
│ *⚔️ TOOLS*
│ ┌───
│ │ 🥼 Armor
│ │   ${TOOL_NAME.armor[u.armor || 0]}
│ │   🔧 Durability: *${u.armordurability || 0}*
│ │
│ │ ⚔️ Sword
│ │   ${TOOL_NAME.sword[u.sword || 0]}
│ │   🔧 Durability: *${u.sworddurability || 0}*
│ │
│ │ ⛏️ Pickaxe
│ │   ${TOOL_NAME.pickaxe[u.pickaxe || 0]}
│ │   🔧 Durability: *${u.pickaxedurability || 0}*
│ │
│ │ 🎣 Fishing Rod
│ │   ${TOOL_NAME.fishingrod[u.fishingrod || 0]}
│ │   🔧 Durability: *${u.fishingroddurability || 0}*
│ │
│ │ 🪓 Axe
│ │   ${TOOL_NAME.axe[u.axe || 0]}
│ │   🔧 Durability: *${u.axedurability || 0}*
│ └──
│
│ *🐉 PELIHARAAN*
│ ┌───
│ │ 🐉 Naga     : ${petLevel(u.naga)} | ⚡${u.nagastamina || 0}
│ │ 🦜 Phonix   : ${petLevel(u.phonix)} | ⚡${u.phonixstamina || 0}
│ │ 🐎 Centaur  : ${petLevel(u.centaur)} | ⚡${u.centaurstamina || 0}
│ │ 🦅 Griffin  : ${petLevel(u.griffin)} | ⚡${u.griffinstamina || 0}
│ │ 🦊 Kyubi    : ${petLevel(u.kyubi)} | ⚡${u.kyubistamina || 0}
│ └──
│
│ *📦 CRATE*
│ ┌───
│ │ ⚪ Common    : *${(u.common || 0).toLocaleString('id-ID')}*
│ │ 🟢 Uncommon  : *${(u.uncommon || 0).toLocaleString('id-ID')}*
│ │ 🟣 Mythic    : *${(u.mythic || 0).toLocaleString('id-ID')}*
│ │ 🟡 Legendary : *${(u.legendary || 0).toLocaleString('id-ID')}*
│ │ 🎫 Pet       : *${(u.pet || 0).toLocaleString('id-ID')}*
│ └──
│ ➤ *${usedPrefix}open <crate>* untuk buka crate`),
        { mentions: [m.sender, who] }
      )
    }

  }
}*/