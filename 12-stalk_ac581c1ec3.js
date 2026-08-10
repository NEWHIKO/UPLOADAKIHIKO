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

  switch (command) {

// ─────────────────────────────────────────────────────
case 'ffstalk':
case 'ffcek':
case 'ff': 'menu'; {
  const axios = require('axios')

  if (!text) return usage(
    'ID Free Fire belum dimasukkan!',
    '<uid>',
    'Cek profil dan guild akun Free Fire berdasarkan UID',
    ['12345678', '987654321']
  )

  const _uidFf = text.trim()

  if (!_uidFf) return usage(
    'ID Free Fire tidak valid!',
    '<uid>',
    'Cek profil dan guild akun Free Fire berdasarkan UID',
    ['12345678', '987654321']
  )

  await react('⏳')

  let _resFf
  try {
    _resFf = await axios.get(`https://api.nexray.web.id/stalker/freefire?uid=${_uidFf}`)
  } catch (e) {
    await react('❌')
    return sendWithTemplate(dino, m, decorate(`│ ❌ Gagal mengambil data dari server Free Fire.`), { mentions: [m.sender] })
  }

  const _jsonFf = _resFf.data

  if (!_jsonFf || !_jsonFf.status || !_jsonFf.result) {
    await react('❌')
    return sendWithTemplate(dino, m, decorate(`│ ❌ Data player tidak ditemukan. Cek kembali UID-nya.`), { mentions: [m.sender] })
  }

  const _dataFf = _jsonFf.result

  function _formatTanggalFf(dateString) {
    if (!dateString) return '-'
    const date = new Date(dateString)
    if (isNaN(date)) return '-'
    return `${date.getDate()} - ${date.getMonth() + 1} - ${date.getFullYear()}`
  }

  const _resultFf = decorate(
    `*FF STALK*\n│\n` +
    `│ *Informasi Profil*\n` +
    `│ • Nickname : ${_dataFf.name || '-'}\n` +
    `│ • ID : ${_dataFf.uid || '-'}\n` +
    `│ • Level : ${_dataFf.level || '-'}\n` +
    `│ • Like : ${_dataFf.likes || '-'}\n` +
    `│ • Gender : ${_dataFf.gender || '-'}\n` +
    `│ • Region : ${_dataFf.region || '-'}\n` +
    `│ • Akun Dibuat : ${_formatTanggalFf(_dataFf.created_at)}\n` +
    `│ • Bio : ${_dataFf.signature || '-'}\n` +
    `│\n` +
    `│ *Informasi Guild*\n` +
    `│ • Nama Guild : ${_dataFf.guild_name || '-'}\n` +
    `│ • ID Guild : ${_dataFf.guild_id || '-'}\n` +
    `│ • Level Guild : ${_dataFf.guild_level || '-'}\n` +
    `│ • Member : ${_dataFf.guild_member || '-'} / ${_dataFf.guild_capacity || '-'}\n` +
    `│ • ID Owner : ${_dataFf.guild_owner_id || '-'}\n` +
    `│ • Nick Owner : ${_dataFf.guild_leader_name || '-'}`
  )

  const _buttonsFf = [
    {
      name: 'cta_copy',
      buttonParamsJson: JSON.stringify({
        display_text: 'Copy Data',
        copy_code: _resultFf
      })
    }
  ]

  await dino.sendMessage(
    m.chat,
    {
      text: _resultFf,
      footer: namabot,
      interactiveButtons: _buttonsFf
    },
    { quoted: m }
  )

  await react('✅')
}
break



  }
}