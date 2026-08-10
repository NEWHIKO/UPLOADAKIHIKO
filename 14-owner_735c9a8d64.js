const { sendWithTemplate } = require('../sendWithTemplate')
const {
  addSewa, removeSewa, getSewa, tambahSewa,
  parseSewaDuration, resolveGroupTarget,
  formatDurasi, formatSisaWaktu, readSewa
} = require('../sewa')

module.exports = async (command, ctx) => {
  const {
    dino, m, chat, from, text, q, args, body, reply, quoted, qmsg, mime, isMedia,
    sender, senderNumber, botNumber, isOwner, isCreator, pushname,
    isGroup, isPrivate, groupMetadata, groupName, participants,
    groupAdmins, groupMembers, isGroupAdmins, isBotGroupAdmins, isAdmins, isBotAdmins,
    db, user, group, prefix, react
  } = ctx

  const namabot   = dino.config?.namabot   ?? global.namabot   ?? 'Bot'
  const messOwner = dino.config?.mess_owner ?? global.mess?.owner ?? '<!> Fitur Khusus Owner'
  const usedPrefix = prefix || '.'

  const decorate = content => `⬣─▣[ ${namabot} ]▣─⬣\n│\n${content}\n▣──⬣`

  const usage = (problem, argHint, desc, examples = []) => {
    const contoh = examples.map(ex => `│ • ${usedPrefix + command} ${ex}`).join('\n')
    const teks = decorate(
      `*Ups! ${problem}*\n│\n│ _*Gunakan format:*_\n│ ${usedPrefix + command} ${argHint}\n│\n│ \`\`\`${desc}\`\`\`\n│\n│ Contoh:\n${contoh}`
    )
    return sendWithTemplate(dino, m, teks, { react: false, mentions: [m.sender] })
  }

  switch (command) {




    // ══════════════════════════════════════════════════════════════
    //  SEWA MANAGEMENT
    // ══════════════════════════════════════════════════════════════

    case 'addsewa': 'menu'; {
      if (!isOwner) return sendWithTemplate(dino, m, decorate(`│ ⛔ ${messOwner}`), { mentions: [m.sender] })

      if (!args[0]) return usage(
        'Argumen tidak lengkap!',
        '[link/jid grup?] <durasi>',
        'Tambah sewa grup dengan durasi tertentu',
        [
          '30 hari',
          '7 jam',
          '60 menit',
          'permanent',
          'https://chat.whatsapp.com/xxx 30 hari'
        ]
      )

      const target = await resolveGroupTarget(dino, m, args)
      if (target.error) return sendWithTemplate(dino, m, decorate(`│ ❌ ${target.error}`), { mentions: [m.sender] })

      const durationText = target.rest.join(' ')
      const durasi = parseSewaDuration(durationText)

      if (!durasi) return usage(
        'Format waktu tidak valid!',
        '[link/jid grup?] <durasi>',
        'Gunakan satuan: menit, jam, hari — atau "permanent"',
        ['30 hari', '7 jam', '60 menit', 'permanent']
      )

      const info = addSewa(dino.username, target.groupId, durasi)

      const durasiText = info.expired === 'PERMANENT'
        ? 'Permanent'
        : formatDurasi(info.expired - info.start)

      return sendWithTemplate(dino, m, decorate(
        `│ ✅ *Sewa Group Berhasil!*\n│\n│ 🔗 Grup    : ${target.groupName || target.groupId}\n│ 📅 Durasi  : ${durasiText}\n│ ⏰ Mulai   : ${new Date(info.start).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n│ 🔔 Expired : ${info.expired === 'PERMANENT' ? '∞ Tidak pernah' : new Date(info.expired).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`
      ), { mentions: [m.sender] })
    }

    case 'ceksewa': 'menu'; {
      if (!isGroup) return sendWithTemplate(dino, m, decorate(`│ ❌ Perintah ini hanya bisa digunakan di dalam grup.`), { mentions: [m.sender] })

      const sewa = getSewa(dino.username, m.chat)

      if (!sewa) return sendWithTemplate(dino, m, decorate(`│ ❌ Grup ini belum memiliki sewa aktif.`), { mentions: [m.sender] })

      const now = Date.now()
      const sisaText = sewa.expired === 'PERMANENT'
        ? '∞ Unlimited'
        : formatSisaWaktu(sewa.expired - now)

      return sendWithTemplate(dino, m, decorate(
        `│ 📊 *Info Sewa Group*\n│\n│ 📅 Durasi  : ${sewa.expired === 'PERMANENT' ? 'Permanent' : formatDurasi(sewa.expired - sewa.start)}\n│ ⏰ Mulai   : ${new Date(sewa.start).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n│ 🔔 Expired : ${sewa.expired === 'PERMANENT' ? '∞ Tidak pernah' : new Date(sewa.expired).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n│ ⏳ Sisa    : ${sisaText}`
      ), { mentions: [m.sender] })
    }

    case 'delsewa': 'menu'; {
      if (!isOwner) return sendWithTemplate(dino, m, decorate(`│ ⛔ ${messOwner}`), { mentions: [m.sender] })
      if (!isGroup) return sendWithTemplate(dino, m, decorate(`│ ❌ Perintah ini hanya bisa digunakan di dalam grup.`), { mentions: [m.sender] })

      const deleted = removeSewa(dino.username, m.chat)

      if (!deleted) return sendWithTemplate(dino, m, decorate(`│ ❌ Grup ini tidak memiliki sewa aktif.`), { mentions: [m.sender] })

      return sendWithTemplate(dino, m, decorate(
        `│ ✅ *Sewa Group Dihapus!*\n│\n│ 🔗 Grup : ${groupName || m.chat}\n│ 📌 Status : Sewa telah dinonaktifkan.`
      ), { mentions: [m.sender] })
    }

    case 'listsewa': 'menu'; {
      if (!isOwner) return sendWithTemplate(dino, m, decorate(`│ ⛔ ${messOwner}`), { mentions: [m.sender] })

      const sewaData = readSewa(dino.username)
      const entries  = Object.entries(sewaData)

      if (entries.length === 0) return sendWithTemplate(dino, m, decorate(`│ 📋 Belum ada grup yang memiliki sewa aktif.`), { mentions: [m.sender] })

      const now = Date.now()
      const list = entries.map(([groupJid, sewa], i) => {
        const sisaText = sewa.expired === 'PERMANENT'
          ? '∞'
          : formatSisaWaktu(sewa.expired - now)
        const expText = sewa.expired === 'PERMANENT'
          ? 'Permanent'
          : new Date(sewa.expired).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
        return `│ ${i + 1}. ${groupJid}\n│    ⏳ Sisa    : ${sisaText}\n│    🔔 Expired : ${expText}`
      }).join('\n│\n')

      return sendWithTemplate(dino, m, decorate(
        `│ 📋 *Daftar Sewa Group (${entries.length})*\n│\n${list}`
      ), { mentions: [m.sender] })
    }

    // ══════════════════════════════════════════════════════════════
    //  PREMIUM MANAGEMENT
    // ══════════════════════════════════════════════════════════════

    case 'addprem': 'menu'; {
      if (!isOwner) return sendWithTemplate(dino, m, decorate(`│ ⛔ ${messOwner}`), { mentions: [m.sender] })

      // Filter mention yang valid: bukan sender sendiri, bukan bot
      const validMentions = (m.mentionedJid || []).filter(j => j !== m.sender && j !== botNumber)

      // Wajib ada argumen — tidak boleh kosong sama sekali
      const hasTarget = validMentions.length > 0
        || (quoted && quoted.sender && quoted.sender !== botNumber && quoted.sender !== m.sender)
        || (args[0] && /^[0-9]{6,15}$/.test(args[0]))

      if (!args.length && !hasTarget) return usage(
        'Argumen tidak lengkap!',
        '@tag/<nomor> <durasi>',
        'Tambahkan status premium ke user',
        [
          '@tag 30 hari',
          '6281234567890 7 jam',
          '6281234567890 60 menit',
          '@tag permanent',
          '(reply pesan) 30 hari'
        ]
      )

      // Resolve target JID: @mention / reply / nomor
      let targetJid  = null
      let durasiArgs = [...args]

      if (validMentions.length > 0) {
        targetJid  = validMentions[0]
        durasiArgs = args.filter(a => !a.startsWith('@'))
      } else if (quoted && quoted.sender && quoted.sender !== botNumber && quoted.sender !== m.sender) {
        targetJid  = quoted.sender
        durasiArgs = [...args]
      } else if (args[0] && /^[0-9]{6,15}$/.test(args[0])) {
        targetJid  = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
        durasiArgs = args.slice(1)
      }

      if (!targetJid) return usage(
        'Target user belum ditentukan!',
        '@tag/<nomor> <durasi>',
        'Tambahkan status premium ke user',
        [
          '@tag 30 hari',
          '6281234567890 7 jam',
          '6281234567890 60 menit',
          '@tag permanent',
          '(reply pesan) 30 hari'
        ]
      )

      // Parse durasi — wajib diisi, tidak boleh kosong
      const durasiText = durasiArgs.join(' ').toLowerCase().trim()
      let durasiMs     = null
      let durasiLabel  = ''

      if (!durasiText) return usage(
        'Durasi belum diisi!',
        '@tag/<nomor> <durasi>',
        'Gunakan satuan: menit, jam, hari, minggu, bulan — atau "permanent"',
        ['@tag 30 hari', '6281234567890 7 jam', '@tag 60 menit', '@tag permanent']
      )

      if (durasiText === 'permanent') {
        durasiMs    = 'permanent'
        durasiLabel = 'permanent'
      } else {
        const match = durasiText.match(/^(\d+)\s*(menit|jam|hari|minggu|bulan)$/)
        if (!match) return usage(
          'Format durasi tidak valid!',
          '@tag/<nomor> <durasi>',
          'Gunakan satuan: menit, jam, hari, minggu, bulan — atau "permanent"',
          ['@tag 30 hari', '6281234567890 7 jam', '@tag 60 menit', '@tag permanent']
        )
        const jumlah = parseInt(match[1])
        const satuan = match[2]
        const tabel  = { menit: 60_000, jam: 3_600_000, hari: 86_400_000, minggu: 604_800_000, bulan: 2_592_000_000 }
        durasiMs    = jumlah * tabel[satuan]
        durasiLabel = `${jumlah} ${satuan}`
      }

      const result = global.addPremium ? global.addPremium(targetJid, durasiMs, durasiLabel) : null
      if (!result) return sendWithTemplate(dino, m, decorate(
        `│ ❌ Gagal menambahkan premium.\n│ User tidak ditemukan di database.`
      ), { mentions: [m.sender] })

      const targetNum  = targetJid.replace('@s.whatsapp.net', '')
      const expiredText = result.premiumExpired === -1
        ? '∞ Tidak pernah expired'
        : new Date(result.premiumExpired).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })

      return sendWithTemplate(dino, m, decorate(
        `│ ✅ *Premium Berhasil Ditambahkan!*\n│\n│ 👤 User    : @${targetNum}\n│ 🏷️ Durasi  : ${durasiLabel || 'permanent'}\n│ 📅 Expired : ${expiredText}`
      ), { mentions: [targetJid, m.sender] })
    }

    case 'delprem': 'menu'; {
      if (!isOwner) return sendWithTemplate(dino, m, decorate(`│ ⛔ ${messOwner}`), { mentions: [m.sender] })

      // Filter mention yang valid: bukan sender sendiri, bukan bot
      const validMentions = (m.mentionedJid || []).filter(j => j !== m.sender && j !== botNumber)

      // Wajib ada target — tidak boleh kosong sama sekali
      const hasTarget = validMentions.length > 0
        || (quoted && quoted.sender && quoted.sender !== botNumber && quoted.sender !== m.sender)
        || (args[0] && /^[0-9]{6,15}$/.test(args[0]))

      if (!args.length && !hasTarget) return usage(
        'Argumen tidak lengkap!',
        '@tag/<nomor>',
        'Hapus status premium dari user',
        ['@tag', '6281234567890', '(reply pesan)']
      )

      // Resolve target JID: @mention / reply / nomor
      let targetJid = null

      if (validMentions.length > 0) {
        targetJid = validMentions[0]
      } else if (quoted && quoted.sender && quoted.sender !== botNumber && quoted.sender !== m.sender) {
        targetJid = quoted.sender
      } else if (args[0] && /^[0-9]{6,15}$/.test(args[0])) {
        targetJid = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
      }

      if (!targetJid) return usage(
        'Target user belum ditentukan!',
        '@tag/<nomor>',
        'Hapus status premium dari user',
        ['@tag', '6281234567890', '(reply pesan)']
      )

      const ok = global.removePremium ? global.removePremium(targetJid) : false
      if (!ok) return sendWithTemplate(dino, m, decorate(
        `│ ❌ Gagal menghapus premium.\n│ User tidak ditemukan atau belum premium.`
      ), { mentions: [m.sender] })

      const targetNum = targetJid.replace('@s.whatsapp.net', '')
      return sendWithTemplate(dino, m, decorate(
        `│ ✅ *Premium Dihapus!*\n│\n│ 👤 User   : @${targetNum}\n│ 📌 Status : Tidak lagi premium.`
      ), { mentions: [targetJid, m.sender] })
    }

  }
}