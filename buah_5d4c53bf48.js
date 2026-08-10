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

    case 'buah': 'menu'; {
      /* CONSTANTS */

      /* HELPER */
      const fmt = n => (n || 0).toLocaleString('id-ID')

      function pickRandom(list) {
        return list[Math.floor(Math.random() * list.length)]
      }

      const statusBuah = n => {
        if (n <= 0)   return '❌ Kosong'
        if (n <= 50)  return '🔴 Sedikit'
        if (n <= 200) return '🟡 Cukup'
        if (n <= 500) return '🟢 Banyak'
        return '💎 Melimpah'
      }

      // Status stok bibit — konsisten dengan BIBIT_MIN = 100 di rpg-berkebon.js
      const statusBibit = n => {
        if (n <= 0)   return '❌ Kosong'
        if (n < 100)  return '⚠️ Kurang (min 100)'
        if (n <= 500) return '🟡 Cukup'
        return '✅ Aman'
      }

      /* HANDLER */
      const dbUser = global.db.data.users[m.sender]

      // Total buah & bibit
      const totalBuah  = (dbUser.pisang || 0) + (dbUser.anggur || 0) + (dbUser.mangga || 0) + (dbUser.jeruk || 0) + (dbUser.apel || 0)
      const totalBibit = (dbUser.bibitpisang || 0) + (dbUser.bibitanggur || 0) + (dbUser.bibitmangga || 0) + (dbUser.bibitjeruk || 0) + (dbUser.bibitapel || 0)

      // Sapaan variatif
      const sapaan = pickRandom([
        '🍉 Kebun buahmu penuh warna hari ini!',
        '🌳 Hasil panenmu sudah menanti untuk dijual!',
        '🍎 Buah segar siap dipanen dan diperdagangkan!',
        '🌿 Koleksi buahmu makin lengkap, terus berkebun!',
        '🍇 Gudang buah terbuka, cek semua stokmu!'
      ])

      const teks = decorate(`*🍉 GUDANG BUAH*
│
│ ${sapaan}
│
│ *🍎 STOK BUAH* (Total: ${fmt(totalBuah)})
│ ┌──────
│ │ 🍌 Pisang : *${fmt(dbUser.pisang)}* ${statusBuah(dbUser.pisang || 0)}
│ │ 🍇 Anggur : *${fmt(dbUser.anggur)}* ${statusBuah(dbUser.anggur || 0)}
│ │ 🥭 Mangga : *${fmt(dbUser.mangga)}* ${statusBuah(dbUser.mangga || 0)}
│ │ 🍊 Jeruk  : *${fmt(dbUser.jeruk)}* ${statusBuah(dbUser.jeruk || 0)}
│ │ 🍎 Apel   : *${fmt(dbUser.apel)}* ${statusBuah(dbUser.apel || 0)}
│ └───
│
│ *🌾 STOK BIBIT* (Total: ${fmt(totalBibit)})
│ ┌──────
│ │ 🌾 B.Pisang : *${fmt(dbUser.bibitpisang)}* ${statusBibit(dbUser.bibitpisang || 0)}
│ │ 🌾 B.Anggur : *${fmt(dbUser.bibitanggur)}* ${statusBibit(dbUser.bibitanggur || 0)}
│ │ 🌾 B.Mangga : *${fmt(dbUser.bibitmangga)}* ${statusBibit(dbUser.bibitmangga || 0)}
│ │ 🌾 B.Jeruk  : *${fmt(dbUser.bibitjeruk)}* ${statusBibit(dbUser.bibitjeruk || 0)}
│ │ 🌾 B.Apel   : *${fmt(dbUser.bibitapel)}* ${statusBibit(dbUser.bibitapel || 0)}
│ │
│ │ ⚠️ Min salah satu bibit 100 untuk berkebon
│ └───
│
│ *💰 JUAL BUAH:*
│ ┌──────
│ │ ➤ *${usedPrefix}shop sell <buah> <jumlah>*
│ │ ➤ *${usedPrefix}shop sell pisang 100*
│ │ ➤ *${usedPrefix}shop sell apel all*
│ └───
│
│ *🌿 TANAM BIBIT:*
│ ┌──────
│ │ ➤ *${usedPrefix}berkebon* untuk panen buah
│ │ ➤ *${usedPrefix}shop buy bibitpisang 500*
│ │   untuk beli bibit
│ └───
│
│ *🍽️ MAKAN BUAH:*
│ ┌──────
│ │ ➤ *${usedPrefix}eat pisang 5*
│ │ ➤ *${usedPrefix}eat mangga 3*
│ └───`)

      return sendWithTemplate(dino, m, teks, { mentions: [m.sender] })
    }

  }
}