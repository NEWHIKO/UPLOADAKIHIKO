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

  // helper ytdl — shared antara ytmp4 dan ytmp3
  const axios = require('axios')

  async function _ytdl(link, type = 'mp4', quality = '720') {
    try {
      const res = await axios.post(
        'https://ytdl.zone.id/api/ytdl',
        { link, type, quality },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0',
            Origin: 'https://ytdl.zone.id',
            Referer: 'https://ytdl.zone.id/'
          }
        }
      )
      const data = res.data
      if (!res.status || !data.downloadUrl) return { success: false, message: 'Download gagal' }
      return { success: true, title: data.title, quality: data.quality, download: data.downloadUrl }
    } catch (e) {
      return { success: false, message: e.message }
    }
  }

  switch (command) {

case 'ytmp4':
case 'youtube':
case 'yt': 'menu'; {
  if (!text) return usage(
    'Link YouTube belum dimasukkan!',
    '<link>',
    'Download video YouTube dalam kualitas 720p beserta audionya',
    ['https://youtu.be/xxxxx', 'https://www.youtube.com/watch?v=xxxxx']
  )

  if (!text.includes('youtu')) return usage(
    'Link tidak valid!',
    '<link>',
    'Pastikan link adalah link YouTube yang valid (youtu.be / youtube.com)',
    ['https://youtu.be/xxxxx', 'https://www.youtube.com/watch?v=xxxxx']
  )

  try {
    await react('⏳')

    const _videoYtmp4 = await _ytdl(text, 'mp4', '720')
    if (!_videoYtmp4.success) {
      await react('❌')
      return sendWithTemplate(dino, m, decorate(`│ ❌ ${_videoYtmp4.message}`), { mentions: [m.sender] })
    }

    const _captionYtmp4 = decorate(
      `│ 🎬 *YOUTUBE MP4*\n│\n` +
      `│ Judul    : ${_videoYtmp4.title}\n` +
      `│ Kualitas : ${_videoYtmp4.quality}p\n` +
      `│ Link     : ${text}`
    )

    await dino.sendMessage(m.chat, {
      video: { url: _videoYtmp4.download },
      caption: _captionYtmp4
    }, { quoted: m })

    const _audioYtmp4 = await _ytdl(text, 'mp3', '128')
    if (_audioYtmp4.success) {
      await dino.sendMessage(m.chat, {
        audio: { url: _audioYtmp4.download },
        mimetype: 'audio/mpeg',
        fileName: `${_audioYtmp4.title}.mp3`
      }, { quoted: m })
    }

    await react('✅')

  } catch (e) {
    await react('❌')
    return sendWithTemplate(dino, m, decorate(`│ ❌ Error: ${e.message}`), { mentions: [m.sender] })
  }
}
break

// ─────────────────────────────────────────────────────
case 'ytaudio':
case 'ytmp3': 'menu'; {
  if (!text) return usage(
    'Link YouTube belum dimasukkan!',
    '<link>',
    'Download audio YouTube dalam format MP3 128kbps',
    ['https://youtu.be/xxxxx', 'https://www.youtube.com/watch?v=xxxxx']
  )

  if (!text.includes('youtu')) return usage(
    'Link tidak valid!',
    '<link>',
    'Pastikan link adalah link YouTube yang valid (youtu.be / youtube.com)',
    ['https://youtu.be/xxxxx', 'https://www.youtube.com/watch?v=xxxxx']
  )

  try {
    await react('⏳')

    const _resYtmp3 = await _ytdl(text, 'mp3', '128')
    if (!_resYtmp3.success) {
      await react('❌')
      return sendWithTemplate(dino, m, decorate(`│ ❌ ${_resYtmp3.message}`), { mentions: [m.sender] })
    }

    const _vidIdYtmp3 = text.split('v=')[1]?.split('&')[0] || text.split('/').pop()
    const _thumbYtmp3 = `https://i.ytimg.com/vi/${_vidIdYtmp3}/hqdefault.jpg`

    const _captionYtmp3 = decorate(
      `│ 🎵 *YOUTUBE MP3*\n│\n` +
      `│ Judul    : ${_resYtmp3.title}\n` +
      `│ Kualitas : ${_resYtmp3.quality}\n` +
      `│ Link     : ${text}`
    )

    await dino.sendMessage(m.chat, {
      image: { url: _thumbYtmp3 },
      caption: _captionYtmp3
    }, { quoted: m })

    await dino.sendMessage(m.chat, {
      audio: { url: _resYtmp3.download },
      mimetype: 'audio/mpeg',
      fileName: `${_resYtmp3.title}.mp3`
    }, { quoted: m })

    await react('✅')

  } catch (e) {
    await react('❌')
    return sendWithTemplate(dino, m, decorate(`│ ❌ Error: ${e.message}`), { mentions: [m.sender] })
  }
}
break
  }
}