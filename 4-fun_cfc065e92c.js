const { sendWithTemplate } = require('../sendWithTemplate')

module.exports = async (command, ctx) => {
  const {
    dino, m, chat, from, text, q, args, body, reply, quoted, qmsg, mime, isMedia,
    sender, senderNumber, botNumber, isOwner, isCreator, pushname,
    isGroup, isPrivate, groupMetadata, groupName, participants,
    groupAdmins, groupMembers, isGroupAdmins, isBotGroupAdmins, isAdmins, isBotAdmins,
    db, user, group, prefix, react
  } = ctx

  const namabot    = dino.config?.namabot || global.namabot || 'Bot'
  const usedPrefix = prefix || '.'

  const decorate = content => `⬣─▣[ ${namabot} ]▣─⬣\n│\n${content}\n▣──⬣`

  const usage = (problem, argHint, desc, examples = []) => {
    const contoh = examples.map(ex => `│ • ${usedPrefix + command} ${ex}`).join('\n')
    const teks = decorate(
      `*Ups! ${problem}*\n│\n│ _*Gunakan format:*_\n│ ${usedPrefix + command} ${argHint}\n│\n│ \`\`\`${desc}\`\`\`\n│\n│ Contoh:\n${contoh}`
    )
    return sendWithTemplate(dino, m, teks, { react: false, mentions: [m.sender] })
  }

  // Helper function - 1x aja
  const getUserName = async (jid, fallback) => {
    try {
      const name = await dino.getName(jid)
      return '@' + (name || jid.split('@')[0])
    } catch {
      return fallback || '@User'
    }
  }

  // Helper untuk target
  const getTargetInfo = async () => {
    // Kalo ada mention atau quoted, pake itu
    if (m.mentionedJid?.[0] || m.quoted?.sender) {
      const target = m.mentionedJid?.[0] || m.quoted.sender
      const nama = await getUserName(target)
      return { target, isTagged: true, nama }
    }
    
    // Kalo user ketik nama manual (args/q), pake nama itu tapi target tetep sender
    if (q && q.trim()) {
      return { target: m.sender, isTagged: false, nama: q.trim() }
    }
    
    // Fallback ke sender
    return { target: m.sender, isTagged: false, nama: pushname }
  }

  switch (command) {

case 'cekbodoh': 'menu'; {
  if (!q && !m.mentionedJid?.[0] && !m.quoted) return usage(
    'Masukkan nama atau tag user!',
    '<nama / @tag>',
    'Cek tingkat kebodohan seseorang — ketik nama atau tag user',
    ['dino', '@user']
  )

  const { target, nama } = await getTargetInfo()
  await react('⏳')
  const _persenCb = Math.floor(Math.random() * 100) + 1
  const _komentarCb = ['🤡 Lumayan parah nih levelnya.', '😂 Receh tapi menghibur.', '🥴 Kadang suka salah paham sendiri.', '😆 Polos banget sampai gemes.', '🙃 Niat baik tapi sering meleset.', '🤔 Masih dalam batas wajar kok.', '😅 Santai, gak ada yang sempurna.']
  const _hasilCb = getRandom(_komentarCb)

  await react('✅')
  sendWithTemplate(dino, m, decorate(`🤪 CEK BODOH\n\n👤 Nama : *${nama}*\n📊 Tingkat Kebodohan : *${_persenCb}%*\n💬 ${_hasilCb}`), { mentions: [target] })
}
break


  }
}
