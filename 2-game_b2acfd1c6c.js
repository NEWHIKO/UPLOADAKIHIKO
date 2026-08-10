const fs = require('fs');
const axios = require('axios');
const { sendWithTemplate } = require('../sendWithTemplate')

const decorate = content => `⬣─▣[ ${global.namabot || namabot} ]▣─⬣\n│\n${content}\n▣──⬣`

// 𝗙𝘂𝗻𝗰𝘁𝗶𝗼𝗻 𝗚𝗮𝗺𝗲
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function monospace(string) {
  return '```' + string + '```'
}

function monospa(string) {
  return '`' + string + '`'
}

function buatPetunjuk(jawaban) {
   return jawaban
      .toUpperCase()
      .split('')
      .map(h => (Math.random() < 0.4 ? h : '-'))
      .join('')
}

function generateMath(level = "easy") {
  let a, b, c, soal, jawaban

  if (level === "easy") {
    a = Math.floor(Math.random() * 40) + 10
    b = Math.floor(Math.random() * 30) + 5
    let op = pickRandom(["+", "-", "×"])

    if (op === "+") jawaban = a + b
    if (op === "-") jawaban = a - b
    if (op === "×") jawaban = a * b

    soal = `${a} ${op} ${b}`
  }

  if (level === "medium") {
    a = Math.floor(Math.random() * 50) + 20
    b = Math.floor(Math.random() * 30) + 10
    c = Math.floor(Math.random() * 20) + 5

    soal = `${a} × ${b} - ${c}`
    jawaban = a * b - c
  }

  if (level === "hard") {
    a = Math.floor(Math.random() * 80) + 20
    b = Math.floor(Math.random() * 50) + 10
    c = Math.floor(Math.random() * 30) + 5
    let d = Math.floor(Math.random() * 10) + 2

    soal = `${a} × ${b} - ${c} ÷ ${d}`
    jawaban = Math.floor(a * b - (c / d))
  }

  return { soal, jawaban }
}

// 𝗙𝘂𝗻𝗰𝘁𝗶𝗼𝗻 𝗚𝗮𝗺𝗲 𝗧𝗶𝗰𝘁𝗮𝗰𝘁𝗼𝗲
async function handleTTC(m, dino, isCmd, body) {
  const textLower = body.toLowerCase().trim()

  // ─── Handle terima/tolak tantangan ───
  if (/^(gas+|oke|siap|acc)$/i.test(textLower) || /^(tolak|nolak|skip)$/i.test(textLower)) {
    const isAccept = /^(gas+|oke|siap|acc)$/i.test(textLower)
    const isTolak  = /^(tolak|nolak|skip)$/i.test(textLower)

    const invite = Object.values(global.game || {}).find(r =>
      r.state === 'WAITING' &&
      r.chat === m.chat &&
      r.invitedPlayer === m.sender
    )

    if (invite) {
      if (isTolak) {
        clearTimeout(invite._timeout)
        delete global.game[invite.id]
        await dino.sendMessage(m.chat, {
          text: `❌ @${m.sender.split('@')[0]} menolak tantangan!`,
          mentions: [m.sender, invite.game.playerX]
        })
        return true
      }

      if (isAccept) {
        clearTimeout(invite._timeout)
        invite.game.playerO = m.sender
        invite.state = 'PLAYING'

        let board = invite.game.render().map(v => ({
          X: '❌', O: '⭕',
          1: '1️⃣', 2: '2️⃣', 3: '3️⃣',
          4: '4️⃣', 5: '5️⃣', 6: '6️⃣',
          7: '7️⃣', 8: '8️⃣', 9: '9️⃣'
        }[v]))

        const teks = `🎮 *TicTacToe Dimulai!*\n\n${board.slice(0,3).join('')}\n${board.slice(3,6).join('')}\n${board.slice(6).join('')}\n\n⭕ @${invite.game.playerX.split('@')[0]}\n❌ @${invite.game.playerO.split('@')[0]}\n\n🎯 Giliran @${invite.game.currentTurn.split('@')[0]}\nKetik angka *1-9* atau *surrender*`

        await dino.sendMessage(m.chat, {
          text: teks,
          mentions: [invite.game.playerX, invite.game.playerO]
        })
        return true
      }
    }
  }

  // ─── Cari room PLAYING milik sender ───
  let room = Object.values(global.game || {}).find(r =>
    r.id && r.game && r.state === 'PLAYING' &&
    r.chat === m.chat &&
    [r.game.playerX, r.game.playerO].includes(m.sender)
  )
  if (!room) return false

  const isSurrender = /^surr?ender$/i.test(textLower)
  const isMove      = /^[1-9]$/.test(textLower)

  if (!isSurrender && !isMove) return false

  if (isSurrender) {
    room.game.surrender(m.sender)
  } else {
    if (m.sender !== room.game.currentTurn) {
      await dino.sendMessage(m.chat, { text: '⏳ Bukan giliran kamu!' })
      return true
    }

    let ok = room.game.turn(
      m.sender === room.game.playerO ? 1 : 0,
      parseInt(textLower) - 1
    )

    if (ok < 1) {
      await dino.sendMessage(m.chat, {
        text: ({
          '-3': '⚠️ Game sudah selesai',
          '-2': '⏳ Bukan giliran kamu',
          '-1': '❌ Posisi tidak valid',
          '0':  '❌ Posisi sudah terisi'
        })[String(ok)] || 'Error'
      })
      return true
    }
  }

  const winner    = room.game.winner || null
  const isTie     = !winner && room.game.board === 511
  const currTurn  = (!winner && !isTie) ? room.game.currentTurn : null
  let arr = room.game.render().map(v => ({
    X: '❌', O: '⭕',
    1: '1️⃣', 2: '2️⃣', 3: '3️⃣',
    4: '4️⃣', 5: '5️⃣', 6: '6️⃣',
    7: '7️⃣', 8: '8️⃣', 9: '9️⃣'
  }[v]))

  let teks = `${arr.slice(0,3).join('')}\n${arr.slice(3,6).join('')}\n${arr.slice(6).join('')}\n\n`

  if (winner) {
    teks += `🏆 @${winner.split('@')[0]} *menang!*`
  } else if (isTie) {
    teks += `🤝 *Game Seri!*`
  } else {
    teks += `🎯 Giliran @${currTurn.split('@')[0]}\nKetik angka *1-9* atau *surrender*`
  }

  const mentions = (winner || isTie)
    ? [room.game.playerX, room.game.playerO]
    : [currTurn]

  await dino.sendMessage(m.chat, { text: teks, mentions })

  if (winner || isTie) delete global.game[room.id]

  return true
}

// 𝗙𝘂𝗻𝗰𝘁𝗶𝗼𝗻 𝗚𝗮𝗺𝗲 𝗦𝘂𝗶𝘁 𝗣𝘃𝗣
async function handleSuitPvP(m, dino, isCmd, body) {

  if (!global.game) global.game = {}

  const textRaw = body.trim()

  // ─── Mapping emoji & teks suit ───
  const emojiMap = {
    '🪨': 'Batu', '✊': 'Batu', '🤜': 'Batu', '🤛': 'Batu',
    '📄': 'Kertas', '🖐️': 'Kertas', '✋': 'Kertas', '🤚': 'Kertas',
    '✂️': 'Gunting', '✌️': 'Gunting'
  }
  const textMap = { batu: 'Batu', kertas: 'Kertas', gunting: 'Gunting' }

  const pilihanEmoji = Object.keys(emojiMap)
  const isEmojiSuit  = pilihanEmoji.includes(textRaw)
  const isTextSuit   = Object.keys(textMap).includes(textRaw.toLowerCase())
  const isSuitInput  = isEmojiSuit || isTextSuit

  function getPilihan() {
    if (isEmojiSuit) return emojiMap[textRaw]
    if (isTextSuit)  return textMap[textRaw.toLowerCase()]
    return null
  }

  // Resolve @lid -> jid asli pakai groupMetadata dari chat tempat game berjalan
  async function resolveSenderJid(chat, sender) {
    if (!sender.endsWith('@lid')) return sender
    try {
      const meta = await dino.groupMetadata(chat)
      const found = meta.participants.find(p => p.lid === sender)
      return found?.id || found?.jid || sender
    } catch {
      return sender
    }
  }

  // ─── Handle terima/tolak tantangan ───
  if (/^(terima|gas+|oke|siap|acc)$/i.test(textRaw) || /^(nyerah|tolak|nolak)$/i.test(textRaw)) {
    const isAccept = /^(terima|gas+|oke|siap|acc)$/i.test(textRaw)
    const isTolak  = /^(nyerah|tolak|nolak)$/i.test(textRaw)

    let senderResolved = m.sender
    if (m.isGroup) {
      senderResolved = await resolveSenderJid(m.chat, m.sender)
    }

    const invite = Object.values(global.game).find(r =>
      r.type === 'suitpvp' &&
      r.state === 'WAITING' &&
      r.chat === m.chat &&
      r.player2 === senderResolved
    )

    if (invite) {
      if (isTolak) {
        clearTimeout(invite._timeout)
        delete global.game[invite.id]
        await dino.sendMessage(m.chat, {
          text: `❌ @${senderResolved.split('@')[0]} menolak tantangan suit dari @${invite.player1.split('@')[0]}!`,
          mentions: [senderResolved, invite.player1]
        })
        return true
      }

      if (isAccept) {
        clearTimeout(invite._timeout)
        invite.state   = 'PLAYING'
        invite.choices = {}
        invite.raw     = {}

        const botNum = dino.user.id.split(':')[0]

        // Timeout 3 menit fase PLAYING
        invite._playTimeout = setTimeout(async () => {
          if (global.game[invite.id] && global.game[invite.id].state === 'PLAYING') {
            const belum = [invite.player1, invite.player2].filter(p => !invite.choices[p])
            delete global.game[invite.id]
            await dino.sendMessage(invite.chat, {
              text: `⏰ Waktu habis! @${belum.map(p => p.split('@')[0]).join(', @')} tidak mengirimkan emoji suit!`,
              mentions: belum
            }).catch(() => {})
          }
        }, 3 * 60 * 1000)  // ← 3 menit

        await dino.sendMessage(m.chat, {
          text: `🔥 *Suit PvP Dimulai!*\n\n@${invite.player1.split('@')[0]} ⚔️ @${invite.player2.split('@')[0]}\n\n⏰ Waktu: *3 menit*\n\nKedua pemain kirim emoji/teks suit ke private bot:\n👉 wa.me/${botNum}\n\nPilihan valid:\n🪨 ✊ 🤜 🤛 / "batu" → Batu\n📄 ✋ 🖐️ 🤚 / "kertas" → Kertas\n✂️ ✌️ / "gunting" → Gunting`,
          mentions: [invite.player1, invite.player2]
        })
        return true
      }
    }
  }

  // ─── Handle input suit (hanya dari private chat) ───
  if (isSuitInput) {
    if (m.isGroup) return false

    const rooms = Object.values(global.game).filter(r =>
      r.type === 'suitpvp' && r.state === 'PLAYING'
    )

    let room = null
    let sender = m.sender

    for (const r of rooms) {
      // cocok langsung (sender sudah jid asli)
      if ([r.player1, r.player2].includes(m.sender)) {
        room = r
        sender = m.sender
        break
      }
      // sender berupa @lid, resolve dulu pakai metadata grup asal game
      if (m.sender.endsWith('@lid')) {
        const resolved = await resolveSenderJid(r.chat, m.sender)
        if ([r.player1, r.player2].includes(resolved)) {
          room = r
          sender = resolved
          break
        }
      }
    }

    if (!room) return false

    // Sudah pilih sebelumnya
    if (room.choices[sender]) {
      await dino.sendMessage(room.chat, {
        text: `⏳ @${sender.split('@')[0]} sudah memilih, tunggu lawanmu!`,
        mentions: [sender]
      })
      return true
    }

    // Simpan pilihan
    room.choices[sender] = textRaw
    room.raw = room.raw || {}
    room.raw[sender] = getPilihan()

    const lawan    = room.player1 === sender ? room.player2 : room.player1
    const sudahDua = room.choices[room.player1] && room.choices[room.player2]

    if (!sudahDua) {
      // Kabari di grup
      await dino.sendMessage(room.chat, {
        text: `✅ @${sender.split('@')[0]} sudah memilih emoji suit!\n\n⏳ Menunggu @${lawan.split('@')[0]} mengirimkan emoji...\n\n⏰ Sisa waktu: menunggu batas 3 menit`,
        mentions: [sender, lawan]
      })
      return true
    }

    // ─── Kedua sudah pilih → tentukan pemenang ───
    clearTimeout(room._playTimeout)

    const e1 = room.choices[room.player1]
    const e2 = room.choices[room.player2]
    const p1 = room.raw[room.player1]
    const p2 = room.raw[room.player2]

    function tentukan(a, b) {
      if (a === b) return 'SERI'
      if (
        (a === 'Batu'    && b === 'Gunting') ||
        (a === 'Gunting' && b === 'Kertas')  ||
        (a === 'Kertas'  && b === 'Batu')
      ) return room.player1
      return room.player2
    }

    const hasil = tentukan(p1, p2)

    let teks = `🎮 *HASIL SUIT PvP*\n\n`
    teks += `@${room.player1.split('@')[0]} → ${e1} (${p1})\n`
    teks += `@${room.player2.split('@')[0]} → ${e2} (${p2})\n\n`
    teks += hasil === 'SERI'
      ? `🤝 *SERI! Tidak ada pemenang.*`
      : `🏆 *Pemenang: @${hasil.split('@')[0]}*`

    // Hasil di grup
    await dino.sendMessage(room.chat, {
      text: teks,
      mentions: [room.player1, room.player2]
    })

    delete global.game[room.id]
    return true
  }

  return false
}
async function handleTebakBom(m, dino, body) {
  const game = global.game?.[m.chat]
  if (!game || game.mode !== 'tebakbom') return false

  const angka = parseInt(body.trim())
  if (isNaN(angka) || angka < 1 || angka > 9) return false

  if (game.dipilih[angka]) {
    await reply(`❌ Angka *${angka}* sudah dipilih!`)
    return true
  }

  const aman = !game.bom.has(angka)
  game.dipilih[angka] = { sender: m.sender, aman }

  const board = renderBomBoard(game, false)

  if (!aman) {
    clearTimeout(game.waktu)
    const boardReveal = renderBomBoard(game, true)
    delete global.game[m.chat]
    await dino.sendMessage(m.chat, {
      text: `💥 *BOOOOM!*\n\n${boardReveal}\n\n☠️ @${m.sender.split('@')[0]} *menginjak bom di kotak ${angka}!*\n\n💣 Posisi Bom: ${[...game.bom].join(', ')}\n❌ *GAME OVER!*`,
      mentions: [m.sender]
    })
    return true
  }

  game.safeCount++

  if (game.safeCount >= game.safeNeeded) {
    clearTimeout(game.waktu)
    const boardReveal = renderBomBoard(game, true)
    const expReward   = random(300, 500)
    const moneyReward = random(10, 30)
    db.users[m.sender].exp   += expReward
    db.users[m.sender].money += moneyReward
    delete global.game[m.chat]
    await dino.sendMessage(m.chat, {
      text: `🎉 *SEMUA KOTAK AMAN!*\n\n${boardReveal}\n\n🏆 @${m.sender.split('@')[0]} menang!\n\n🎁 *Reward*\n⭐ EXP : +${expReward}\n💰 Money : +${moneyReward}`,
      mentions: [m.sender]
    })
    return true
  }

  await dino.sendMessage(m.chat, {
    text: `✅ *Kotak ${angka} Aman!*\n\n${board}\n\n🎯 Sisa aman: *${game.safeNeeded - game.safeCount}*\nPilih angka berikutnya!`,
    mentions: [m.sender]
  })
  return true
}

function renderBomBoard(game, revealAll = false) {
  let cells = []
  for (let i = 1; i <= 9; i++) {
    const picked = game.dipilih[i]
    if (picked) {
      cells.push(picked.aman ? '✅' : '💣')
    } else if (revealAll && game.bom.has(i)) {
      cells.push('💣')
    } else {
      cells.push(`${i}️⃣`)
    }
  }
  return `${cells.slice(0,3).join('')}\n${cells.slice(3,6).join('')}\n${cells.slice(6,9).join('')}`
}
// ======================================= \\
module.exports = async (command, ctx) => {
  const {
    dino, m, chat, from, text, q, args, body, reply, quoted, qmsg, mime, isMedia,
    sender, senderNumber, botNumber, isOwner, isCreator, pushname,
    isGroup, isPrivate, groupMetadata, groupName, participants,
    groupAdmins, groupMembers, isGroupAdmins, isBotGroupAdmins, isAdmins, isBotAdmins,
    db, user, group, prefix, react
  } = ctx

  const namabot  = dino.config?.namabot || global.namabot || 'Bot'
  const usedPrefix = prefix || '.'

  const usage = (problem, argHint, desc, examples = []) => {
    const contoh = examples.map(ex => `│ • ${usedPrefix + command} ${ex}`).join('\n')
    const teks = decorate(
      `*Ups! ${problem}*\n│\n│ _*Gunakan format:*_\n│ ${usedPrefix + command} ${argHint}\n│\n│ \`\`\`${desc}\`\`\`\n│\n│ Contoh:\n${contoh}`
    )
    return sendWithTemplate(dino, m, teks, { react: false, mentions: [m.sender] })
  }

  switch (command) {

case 'ttc':
case 'ttt':
case 'tictactoe': 'menu'; {
  const TicTacToe = require('./lib/DinoGame/tictactoe')
  if (!global.game) global.game = {}

  async function lidToJid(jid) {
    if (!jid) return null
    if (!jid.endsWith('@lid')) return jid
    try {
      const meta = await dino.groupMetadata(m.chat)
      const found = meta.participants.find(p => p.lid === jid)
      return found?.jid || found?.id || null
    } catch {
      return null
    }
  }

  let targetJid  = null
  let targetName = null

  const mentionedList = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  if (mentionedList.length > 0) {
    targetJid = await lidToJid(mentionedList[0])
  }

  if (!targetJid) {
    const replyPart = m.message?.extendedTextMessage?.contextInfo?.participant
    if (replyPart) targetJid = await lidToJid(replyPart)
  }

  if (targetJid) {
    try {
      const meta = await dino.groupMetadata(m.chat)
      const found = meta.participants.find(p =>
        p.id === targetJid || p.jid === targetJid
      )
      targetName = found?.notify || found?.name || targetJid.split('@')[0]
    } catch {
      targetName = targetJid.split('@')[0]
    }
  }

  if (targetJid && targetJid.split('@')[0] === m.sender.split('@')[0]) {
    sendWithTemplate(dino, m, decorate(`Tidak bisa lawan diri sendiri!`), { mentions: [m.sender] })
    break
  }

  const sedangMain = Object.values(global.game).find(r =>
    r.chat === m.chat &&
    r.id.startsWith('tictactoe') &&
    (
      [r.game?.playerX, r.game?.playerO].includes(m.sender) ||
      r.invitedPlayer === m.sender
    )
  )
  if (sedangMain) {
    sendWithTemplate(dino, m, decorate(`Kamu masih dalam game atau sedang ditantang!`), { mentions: [m.sender] })
    break
  }

  if (targetJid) {
    const targetSibuk = Object.values(global.game).find(r =>
      r.chat === m.chat &&
      r.id.startsWith('tictactoe') &&
      (
        [r.game?.playerX, r.game?.playerO].includes(targetJid) ||
        r.invitedPlayer === targetJid
      )
    )
    if (targetSibuk) {
      sendWithTemplate(dino, m, decorate(`@${targetName} sedang dalam game atau ditantang orang lain!`), { mentions: [m.sender] })
      break
    }

    const id = 'tictactoe-' + Date.now()

    const timeout = setTimeout(async () => {
      if (global.game[id] && global.game[id].state === 'WAITING') {
        delete global.game[id]
        await dino.sendMessage(m.chat, {
          text: decorate(`Tantangan dari @${m.sender.split('@')[0]} ke @${targetJid.split('@')[0]} telah habis waktu!`),
          mentions: [m.sender, targetJid]
        }).catch(() => {})
      }
    }, 60 * 1000)

    global.game[id] = {
      id,
      chat: m.chat,
      x: m.chat,
      o: '',
      game: new TicTacToe(m.sender, 'o'),
      state: 'WAITING',
      invitedPlayer: targetJid,
      _timeout: timeout
    }

    await dino.sendMessage(m.chat, {
      text: decorate(`TicTacToe\n\n@${m.sender.split('@')[0]} menantang @${targetJid.split('@')[0]}!\n\nWaktu: 1 menit\nKetik gas untuk menerima\nKetik tolak untuk menolak`),
      mentions: [m.sender, targetJid]
    })

    break
  }

  let roomWaiting = Object.values(global.game).find(r =>
    r.state === 'WAITING' &&
    r.chat === m.chat &&
    r.game.playerX !== m.sender &&
    !r.invitedPlayer
  )

  if (roomWaiting) {
    clearTimeout(roomWaiting._timeout)
    roomWaiting.game.playerO = m.sender
    roomWaiting.state = 'PLAYING'

    let board = roomWaiting.game.render().map(v => ({
      X: '❌', O: '⭕',
      1: '1️⃣', 2: '2️⃣', 3: '3️⃣',
      4: '4️⃣', 5: '5️⃣', 6: '6️⃣',
      7: '7️⃣', 8: '8️⃣', 9: '9️⃣'
    }[v]))

    const teksMulai = decorate(`TicTacToe Dimulai!\n\n${board.slice(0,3).join('')}\n${board.slice(3,6).join('')}\n${board.slice(6).join('')}\n\n⭕ @${roomWaiting.game.playerX.split('@')[0]}\n❌ @${roomWaiting.game.playerO.split('@')[0]}\n\nGiliran @${roomWaiting.game.currentTurn.split('@')[0]}\nKetik angka 1-9 atau surrender`)

    await dino.sendMessage(m.chat, {
      text: teksMulai,
      mentions: [roomWaiting.game.playerX, roomWaiting.game.playerO]
    })

  } else {
    const id = 'tictactoe-' + Date.now()

    const timeout = setTimeout(async () => {
      if (global.game[id] && global.game[id].state === 'WAITING') {
        delete global.game[id]
        await dino.sendMessage(m.chat, {
          text: decorate(`Room TicTacToe @${m.sender.split('@')[0]} habis waktu, tidak ada yang bergabung!`),
          mentions: [m.sender]
        }).catch(() => {})
      }
    }, 60 * 1000)

    global.game[id] = {
      id,
      chat: m.chat,
      x: m.chat,
      o: '',
      game: new TicTacToe(m.sender, 'o'),
      state: 'WAITING',
      _timeout: timeout
    }

    sendWithTemplate(dino, m, decorate(`Menunggu lawan...\n\nWaktu: 1 menit\nKetik ${prefix}ttc untuk bergabung!\nAtau tantang: ${prefix}ttc @orangnya\n\nKetik surrender untuk batalkan`), { mentions: [m.sender] })
  }
}
break



  }
}

// ═════════════════════════════════════════════════════
//  JUDI PVP — handler terima / tolak / SPIN
//  Dipanggil dari case.js SEBELUM if (!isCmd) return
// ═════════════════════════════════════════════════════
const { sendWithTemplate: _swt } = require('../sendWithTemplate')

async function handleJudiPvP(m, dino, isCmd, body) {
  dino.judipvp = dino.judipvp || {}

  const namabot = dino.config?.namabot || global.namabot || 'Bot'
  const decorate = content => `⬣─▣[ ${namabot} ]▣─⬣\n│\n${content}\n▣──⬣`
  const fmt = (n) => (n || 0).toLocaleString('id-ID')

  const room = Object.values(dino.judipvp).find(
    r => r.status && [r.p, r.p2].includes(m.sender)
  )
  if (!room) return false

  const text = (m.text || body || '').trim()

  // ── FASE WAIT: lawan terima / tolak ──
  if (room.status === 'wait' && m.sender === room.p2) {
    if (/^(tolak|nanti|gabisa|ga|gamau)$/i.test(text)) {
      await _swt(dino, m, decorate(`*❌ Tantangan Ditolak!*\n│\n│ @${room.p2.split('@')[0]} menolak tantangan dari @${room.p.split('@')[0]}.`),
        { mentions: [room.p, room.p2] })
      clearTimeout(room.waktu)
      delete dino.judipvp[room.id]
      return true
    }
    if (/^(terima|gas|ok|oke)$/i.test(text)) {
      room.status = 'play'
      clearTimeout(room.waktu)
      await _swt(dino, m, decorate(`*✅ Tantangan Diterima!*\n│\n│ 🎲 Permainan dimulai!\n│\n│ 📢 Kedua pemain silakan ketik *SPIN*\n│    untuk memulai permainan.\n│\n│ 👤 @${room.p.split('@')[0]} vs @${room.p2.split('@')[0]}`),
        { mentions: [room.p, room.p2] })
      return true
    }
  }

  // ── FASE PLAY: SPIN ──
  if (room.status === 'play') {
    if (!/spin/i.test(text)) return false

    if (!m.isGroup || m.chat !== room.chat) {
      await _swt(dino, m, decorate(`*⚠️ Salah Grup!*\n│\n│ Perintah *SPIN* hanya bisa dilakukan\n│ di grup tempat tantangan dimulai.`),
        { mentions: [m.sender] })
      return true
    }

    if (m.sender === room.p  && room.spin1 !== undefined) {
      await _swt(dino, m, decorate(`*❌ Sudah SPIN!*\n│\n│ Kamu sudah melakukan SPIN.\n│ Tunggu lawanmu menyelesaikan gilirannya.`),
        { mentions: [m.sender] })
      return true
    }
    if (m.sender === room.p2 && room.spin2 !== undefined) {
      await _swt(dino, m, decorate(`*❌ Sudah SPIN!*\n│\n│ Kamu sudah melakukan SPIN.\n│ Tunggu lawanmu menyelesaikan gilirannya.`),
        { mentions: [m.sender] })
      return true
    }

    const spin = Math.floor(Math.random() * 100) + 1
    if (m.sender === room.p)  room.spin1 = spin
    if (m.sender === room.p2) room.spin2 = spin

    let infoAktivitas = `│ 🎮 Status Spin:\n`
    infoAktivitas += `│ - @${room.p.split('@')[0]}: ${room.spin1 !== undefined ? '✅ Sudah SPIN' : (m.sender === room.p ? '🎯 Sedang SPIN...' : '⌛ Menunggu giliran')}\n`
    infoAktivitas += `│ - @${room.p2.split('@')[0]}: ${room.spin2 !== undefined ? '✅ Sudah SPIN' : (m.sender === room.p2 ? '🎯 Sedang SPIN...' : '⌛ Menunggu giliran')}`
    await _swt(dino, m, decorate(infoAktivitas), { mentions: [room.p, room.p2] })

    // ── Kedua sudah spin → hitung hasil ──
    if (room.spin1 !== undefined && room.spin2 !== undefined) {
      await _swt(dino, m, decorate(`*🔍 Memverifikasi hasil spin dari kedua pemain...*`), { mentions: [room.p, room.p2] })
      await new Promise(r => setTimeout(r, 2000))
      await _swt(dino, m, decorate(`*🎰 Mengocok angka secara acak...*`), { mentions: [room.p, room.p2] })
      await new Promise(r => setTimeout(r, 2000))
      await _swt(dino, m, decorate(`*🔄 Sedang menghitung siapa yang lebih tinggi...*`), { mentions: [room.p, room.p2] })
      await new Promise(r => setTimeout(r, 1500))

      const hasilSpin = `│ 🎲 @${room.p.split('@')[0]}: *${room.spin1}*\n│ 🎲 @${room.p2.split('@')[0]}: *${room.spin2}*`

      let winner, loser
      if (room.spin1 > room.spin2)      { winner = room.p;  loser = room.p2 }
      else if (room.spin1 < room.spin2) { winner = room.p2; loser = room.p  }

      if (winner) {
        const pajak       = Math.floor(room.bet * 0.10)
        const hasilBersih = room.bet - pajak
        global.db.data.users[winner].money = (global.db.data.users[winner].money || 0) + hasilBersih
        global.db.data.users[loser].money  = (global.db.data.users[loser].money  || 0) - room.bet
        await _swt(dino, m, decorate(`*🎲 Hasil SPIN*\n│\n${hasilSpin}\n│\n│ 🏆 Pemenang: @${winner.split('@')[0]}! 🎉\n│ 💰 Taruhan         : *${fmt(room.bet)}* money\n│ 🏛️ Pajak (10%)    : *-${fmt(pajak)}* money\n│ 💵 Diterima Bersih : *+${fmt(hasilBersih)}* money`),
          { react: true, reactDone: '🏆', mentions: [room.p, room.p2] })
      } else {
        await _swt(dino, m, decorate(`*🎲 Hasil SPIN*\n│\n${hasilSpin}\n│\n│ 🤝 Permainan Berakhir *SERI!*`),
          { react: true, reactDone: '🤝', mentions: [room.p, room.p2] })
      }

      delete dino.judipvp[room.id]
      return true
    }

    // Baru satu yang spin
    const belumSpin = room.spin1 === undefined ? room.p : room.p2
    await _swt(dino, m, decorate(`*⌛ Menunggu SPIN Lawan*\n│\n│ Menunggu giliran SPIN dari @${belumSpin.split('@')[0]}.`),
      { mentions: [belumSpin] })
    return true
  }

  return false
}

module.exports.handleTTC = handleTTC
module.exports.handleSuitPvP = handleSuitPvP
module.exports.handleTebakBom = handleTebakBom
module.exports.handleJudiPvP = handleJudiPvP