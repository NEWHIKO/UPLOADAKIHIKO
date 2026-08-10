const { exec } = require('child_process')
const fs = require('fs')

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
case 'bass': 'menu';
case 'blown': 'menu';
case 'deep': 'menu';
case 'earrape': 'menu';
case 'fast': 'menu';
case 'fat': 'menu';
case 'nightcore': 'menu';
case 'reverse': 'menu';
case 'robot': 'menu';
case 'slow': 'menu';
case 'smooth': 'menu';
case 'squirrel': 'menu';
case 'babysquirrel': 'menu';
case 'underwater': 'menu';
case 'radio': 'menu';
case 'telephone': 'menu';
case 'stadium': 'menu';
case 'ghost': 'menu';
case '8d': 'menu';
case 'lofi': 'menu';
case 'cassette': 'menu';
case 'distortion': 'menu';
case 'alien': 'menu';
case 'megaphone': 'menu';
case '8bit': 'menu';
case 'chipmunk': 'menu';
case 'vaporwave': 'menu';
case 'tremolo': 'menu';
case 'vibrato': 'menu';
case 'flanger': 'menu';
case 'phaser': 'menu';
case 'karaoke': 'menu';
case 'metal': 'menu';
case 'oldradio': 'menu';
case 'space': 'menu';
case 'haunted': 'menu';
case 'demon': 'menu';
case 'angel': 'menu';
case 'drunk': 'menu';
case 'broken': 'menu'; {

  // ── Validasi: harus reply audio ──────────────────────
  if (!m.quoted) return usage(
    'Tidak ada audio yang di-reply!',
    '',
    `Reply pesan audio lalu ketik perintah ini untuk menerapkan efek ${command}`,
    ['(reply pesan audio/voice note)']
  )

  const _quotedMimeVoice = (m.quoted.msg || m.quoted).mimetype || ''
  if (!/audio/.test(_quotedMimeVoice)) return usage(
    'Pesan yang di-reply bukan audio!',
    '',
    `Reply pesan audio atau voice note lalu ketik perintah ini untuk efek ${command}`,
    ['(reply pesan audio/voice note)']
  )

  // ── Mapping efek ffmpeg ───────────────────────────────
  let _setVoice

  if (/bass/.test(command))        _setVoice = '-af equalizer=f=54:width_type=o:width=2:g=20'
  if (/blown/.test(command))       _setVoice = '-af acrusher=.1:1:64:0:log'
  if (/deep/.test(command))        _setVoice = '-af atempo=4/4,asetrate=44500*2/3'
  if (/earrape/.test(command))     _setVoice = '-af volume=12'
  if (/fast/.test(command))        _setVoice = '-filter:a "atempo=1.63,asetrate=44100"'
  if (/fat/.test(command))         _setVoice = '-filter:a "atempo=1.6,asetrate=22100"'
  if (/nightcore/.test(command))   _setVoice = '-filter:a "atempo=1.06,asetrate=44100*1.25"'
  if (/reverse/.test(command))     _setVoice = '-filter_complex "areverse"'
  if (/robot/.test(command))       _setVoice = '-filter_complex "afftfilt=real=\'hypot(re,im)*sin(0)\':imag=\'hypot(re,im)*cos(0)\':win_size=512:overlap=0.75"'
  if (/slow/.test(command))        _setVoice = '-filter:a "atempo=0.7,asetrate=44100"'
  if (/smooth/.test(command))      _setVoice = '-filter:v "minterpolate=\'mi_mode=mci:mc_mode=aobmc:vsbmc=1:fps=120\'"'
  if (/squirrel/.test(command))    _setVoice = '-filter:a "atempo=0.5,asetrate=65100"'
  if (/babysquirrel/.test(command))_setVoice = '-filter:a "atempo=0.4,asetrate=96000"'
  if (/underwater/.test(command))  _setVoice = '-af "lowpass=f=300,highpass=f=20,atempo=0.9"'
  if (/radio/.test(command))       _setVoice = '-af "highpass=f=200, lowpass=f=3000, volume=2"'
  if (/telephone/.test(command))   _setVoice = '-af "highpass=f=500, lowpass=f=2000"'
  if (/stadium/.test(command))     _setVoice = '-af "aecho=0.8:0.9:1000:0.3"'
  if (/ghost/.test(command))       _setVoice = '-af "aecho=0.8:0.9:1000|1800:0.3|0.25"'
  if (/8d/.test(command))          _setVoice = '-af "apulsator=hz=0.08"'
  if (/lofi/.test(command))        _setVoice = '-af "lowpass=f=1200,highpass=f=200,atempo=0.9"'
  if (/cassette/.test(command))    _setVoice = '-af "acrusher=level_in=1:level_out=1:bits=8:mode=log:aa=1"'
  if (/distortion/.test(command))  _setVoice = '-af "acrusher=bits=4:mode=log"'
  if (/alien/.test(command))       _setVoice = '-af "asetrate=44100*1.4,atempo=0.8"'
  if (/megaphone/.test(command))   _setVoice = '-af "highpass=f=500, lowpass=f=3500, volume=3"'
  if (/8bit/.test(command))        _setVoice = '-af "acrusher=bits=6:mode=log"'
  if (/chipmunk/.test(command))    _setVoice = '-af "asetrate=44100*1.5,atempo=0.7"'
  if (/vaporwave/.test(command))   _setVoice = '-af "asetrate=44100*0.8,atempo=1.1"'
  if (/tremolo/.test(command))     _setVoice = '-af "tremolo=f=5:d=0.7"'
  if (/vibrato/.test(command))     _setVoice = '-af "vibrato=f=6.5"'
  if (/flanger/.test(command))     _setVoice = '-af "flanger"'
  if (/phaser/.test(command))      _setVoice = '-af "aphaser"'
  if (/karaoke/.test(command))     _setVoice = '-af "pan=stereo|c0=c0-c1|c1=c1-c0"'
  if (/metal/.test(command))       _setVoice = '-af "equalizer=f=1000:t=q:w=1:g=20"'
  if (/oldradio/.test(command))    _setVoice = '-af "highpass=f=300, lowpass=f=2000, acrusher=bits=8"'
  if (/space/.test(command))       _setVoice = '-af "aecho=0.8:0.88:60:0.4"'
  if (/haunted/.test(command))     _setVoice = '-af "aecho=0.8:0.9:1000:0.5"'
  if (/demon/.test(command))       _setVoice = '-af "asetrate=44100*0.6,atempo=1.2"'
  if (/angel/.test(command))       _setVoice = '-af "asetrate=44100*1.3,atempo=0.9"'
  if (/drunk/.test(command))       _setVoice = '-af "atempo=0.85,asetrate=44100*0.9"'
  if (/broken/.test(command))      _setVoice = '-af "acrusher=bits=3:mode=log"'

  if (!_setVoice) return sendWithTemplate(dino, m, decorate(`│ ❌ Efek tidak dikenali.`), { mentions: [m.sender] })

  // ── Proses ────────────────────────────────────────────
  try {
    await react('⏳')

    const _mediaPathVoice = await dino.downloadAndSaveMediaMessage(m.quoted)
    const _outPathVoice   = `./media/sampah/${Date.now()}.mp3`
    const _cmdVoice       = `ffmpeg -i "${_mediaPathVoice}" ${_setVoice} "${_outPathVoice}" -y`

    exec(_cmdVoice, (err, stdout, stderr) => {
      fs.unlinkSync(_mediaPathVoice)

      if (err) {
        react('❌')
        return sendWithTemplate(dino, m, decorate(
          `│ ❌ Gagal memproses audio.\n│ Detail: ${(stderr || err.message || '').slice(-500)}`
        ), { mentions: [m.sender] })
      }

      const _buffVoice = fs.readFileSync(_outPathVoice)
      dino.sendMessage(m.chat, { audio: _buffVoice, mimetype: 'audio/mpeg' }, { quoted: m })
      fs.unlinkSync(_outPathVoice)
      react('✅')
      sendWithTemplate(dino, m, decorate(`│ ✅ Efek *${command}* berhasil diterapkan.`), { mentions: [m.sender] })
    })

  } catch (e) {
    await react('❌')
    return sendWithTemplate(dino, m, decorate(`│ ❌ Terjadi kesalahan: ${e.message || e}`), { mentions: [m.sender] })
  }
}
break

  }
}