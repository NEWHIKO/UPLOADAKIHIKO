const { sendWithTemplate } = require('../sendWithTemplate')

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

  // Helper format penggunaan fitur, sama seperti kategori downloader.
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
    case 'daftar': 'menu'; {
      const name = text.trim().replace(/\s+/g, ' ')

      if (!name) {
        return usage('Nama belum dimasukkan', 'nama', 'Daftarkan diri sebagai pengguna bot', ['Dino'])
      }

      if (name.length < 2 || name.length > 50) {
        return usage('Nama harus terdiri dari 2 sampai 50 karakter', 'nama', 'Daftarkan diri sebagai pengguna bot', ['Dino'])
      }

      if (user.registered) {
        return sendWithTemplate(
          dino,
          m,
          decorate(`Kamu sudah terdaftar sebagai *${user.name || name}*.\n│ Ketik ${usedPrefix}unreg jika ingin membatalkan pendaftaran.`),
          { mentions: [m.sender] }
        )
      }

      user.registered = true
      user.registeredAt = Date.now()
      user.name = name

      return sendWithTemplate(
        dino,
        m,
        decorate(`*Pendaftaran Berhasil*\n│\n│ Nama: *${name}*\n│ Status: Terdaftar\n│\n│ Selamat menggunakan ${namabot}.`),
        { mentions: [m.sender] }
      )
    }

    case 'unreg': 'menu'; {
      const confirmation = text.trim().toLowerCase()

      if (!user.registered) {
        return sendWithTemplate(
          dino,
          m,
          decorate(`Kamu belum terdaftar.\n│ Contoh: ${usedPrefix}daftar Nama Kamu`),
          { mentions: [m.sender] }
        )
      }

      if (confirmation === 'no') {
        delete user.unregConfirmationExpiresAt
        return sendWithTemplate(
          dino,
          m,
          decorate('*Pembatalan pendaftaran dibatalkan.*\n│ Data pendaftaran kamu tetap aman.'),
          { mentions: [m.sender] }
        )
      }

      if (confirmation && confirmation !== 'yes') {
        return sendWithTemplate(
          dino,
          m,
          decorate(`Jawaban konfirmasi hanya boleh *yes* atau *no*.\n│ Ketik ${usedPrefix}unreg untuk melihat risiko dan meminta konfirmasi.`),
          { mentions: [m.sender] }
        )
      }

      if (confirmation !== 'yes') {
        user.unregConfirmationExpiresAt = Date.now() + (5 * 60 * 1000)

        return sendWithTemplate(
          dino,
          m,
          decorate(`*Konfirmasi Pembatalan Pendaftaran*\n│\n│ Risiko:\n│ • Status pendaftaran akan dihapus.\n│ • Nama pendaftaran akan dikosongkan.\n│ • Kamu perlu daftar ulang untuk memakai fitur khusus user terdaftar.\n│\n│ Data level, EXP, saldo, dan riwayat tidak dihapus.\n│\n│ Ketik *${usedPrefix}unreg yes* untuk lanjut.\n│ Ketik *${usedPrefix}unreg no* untuk membatalkan.\n│ Konfirmasi berlaku selama 5 menit.`),
          { mentions: [m.sender] }
        )
      }

      if (!user.unregConfirmationExpiresAt || Date.now() > user.unregConfirmationExpiresAt) {
        delete user.unregConfirmationExpiresAt
        return sendWithTemplate(
          dino,
          m,
          decorate(`Konfirmasi sudah kedaluwarsa.\n│ Ketik ${usedPrefix}unreg untuk meminta konfirmasi baru.`),
          { mentions: [m.sender] }
        )
      }

      const previousName = user.name
      user.registered = false
      user.registeredAt = 0
      user.name = ''
      delete user.unregConfirmationExpiresAt

      return sendWithTemplate(
        dino,
        m,
        decorate(`Pendaftaran *${previousName || 'kamu'}* telah dibatalkan.\n│ Kamu dapat mendaftar lagi dengan ${usedPrefix}daftar Nama Kamu.`),
        { mentions: [m.sender] }
      )
    }
    
case 'creator':
case 'owner': 'menu'; {
  const _ownerRaw = dino.config?.owner ?? global.owner ?? []
  const _ownerArr = Array.isArray(_ownerRaw) ? _ownerRaw : [_ownerRaw]
  const ownerName = dino.config?.namaowner ?? global.namaowner ?? 'Owner'

  if (_ownerArr.length === 0) {
    return sendWithTemplate(dino, m, decorate(`│ ❌ Nomor owner belum diatur.`), { mentions: [m.sender] })
  }

  const contacts = _ownerArr.map(num => {
    const cleanNumber = num.replace(/[^0-9]/g, '')
    return {
      displayName: ownerName,
      vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${ownerName}\nTEL;type=CELL;type=VOICE;waid=${cleanNumber}:${cleanNumber}\nEND:VCARD`
    }
  })

  await dino.sendMessage(
    m.chat,
    { contacts: { displayName: ownerName, contacts } },
    { quoted: m }
  )
}
break
    
case 'totalfeature':
case 'totalfitur': 'menu'; {
    
  const totalFitur = decorate(`│ Total Fitur : *${DinosaurusFitur()} Fitur*`)
  sendWithTemplate(dino, m, totalFitur, { react: false, mentions: [m.sender] })
}
break

case 'runtime': 'menu'; {
  const runtimeInfo = decorate(`│ Runtime Bot : *${runtime(process.uptime())}*`)
  sendWithTemplate(dino, m, runtimeInfo, { react: false, mentions: [m.sender] })
}
break    
  }
}
