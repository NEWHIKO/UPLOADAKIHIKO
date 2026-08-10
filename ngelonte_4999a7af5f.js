const { sendWithTemplate } = require('../../sendWithTemplate')
const { hitungReward, hitungDebuff, buildTimeInfo } = require('./rpg-time-system.js')

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

    case 'ngelonte': 'menu'; {
      /* CONSTANTS */
      const TIMEOUT = 43200000 // 12 jam

      /* HELPER */
      function ranNumb(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
      function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)] }
      function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }
      function msToTime(duration) {
        let seconds = Math.floor((duration / 1000) % 60)
        let minutes = Math.floor((duration / (1000 * 60)) % 60)
        let hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
        return `${hours} jam ${minutes} menit ${seconds} detik`
      }

      /* HANDLER */
      const dbUser = global.db.data.users[m.sender]
      const time = (dbUser.ngelonte || 0) + TIMEOUT

      const staminaNeed = ranNumb(40, 65)

      if ((dbUser.stamina || 0) < staminaNeed) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Stamina Tidak Cukup!*
│
│ Stamina Dibutuhkan : *${staminaNeed}*
│ Stamina Kamu       : *${dbUser.stamina || 0}*
│
│ ➤ *${usedPrefix}eat* untuk mengisi stamina`),
          { mentions: [m.sender] }
        )
      }

      if ((dbUser.health || 0) < 20) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Health Terlalu Rendah!*
│
│ Health Kamu : *${dbUser.health || 0}*
│
│ ➤ *${usedPrefix}heal* untuk pulihkan health`),
          { mentions: [m.sender] }
        )
      }

      if (Date.now() - (dbUser.ngelonte || 0) < TIMEOUT) {
        return sendWithTemplate(
          dino, m,
          decorate(`*⏳ Masih Kelelahan!*
│
│ Tunggu: *${msToTime(time - Date.now())}*`),
          { mentions: [m.sender] }
        )
      }

      // SET COOLDOWN DI AWAL — cegah spam/race condition
      dbUser.ngelonte = Date.now()

      // TIME SYSTEM
      // Ngelonte: Malam lebih laris (×1.35), Musim Semi ×1.2, Hujan ×0.8, Subuh health drain ++
      const debuff = hitungDebuff(staminaNeed, ranNumb(20, 45), 0, 0.25)
      const timeInfo = buildTimeInfo('ngelonte')

      let skenario = pickRandom([
        {
          pelanggan: 'om-om berkumis tebal',
          lokasi: 'hotel bintang 3 di pinggir kota',
          durasi: '12 jam nonstop',
          step2: 'Om-om itu langsung pesan kamar deluxe dan minta layanan ekstra...',
          step3: 'Kamu dipaksa melayani berbagai permintaan aneh si om sepanjang malam...',
          gagalMsg: 'Om-om itu kabur pas subuh sebelum bayar! Kamu tertipu dan pulang dengan tangan kosong!'
        },
        {
          pelanggan: 'bapak pejabat berdasi',
          lokasi: 'hotel bintang 5 di pusat kota',
          durasi: '24 jam penuh',
          step2: 'Bapak pejabat itu pesan suite room mewah dan kasih syarat macem-macem...',
          step3: 'Kamu dipaksa jadi asisten pribadi sekaligus teman curhat si bapak soal istrinya...',
          gagalMsg: 'Istri bapak pejabat tiba-tiba datang ke hotel! Kamu kabur lewat tangga darurat!'
        },
        {
          pelanggan: 'om tajir naik alphard',
          lokasi: 'villa mewah di pegunungan',
          durasi: '2 hari 2 malam',
          step2: 'Om tajir itu bawa kamu naik alphard ke villa pribadinya yang jauh di pegunungan...',
          step3: 'Kamu dipaksa ikut berbagai kegiatan fisik yang melelahkan selama di villa...',
          gagalMsg: 'Ternyata om tajir itu polisi yang lagi nyamar! Kamu kabur tunggang langgang!'
        },
        {
          pelanggan: 'kakek-kakek kaya raya',
          lokasi: 'penginapan pinggir pantai',
          durasi: '1 malam panjang',
          step2: 'Kakeknya bawa kamu ke penginapan mewah pinggir pantai yang romantis...',
          step3: 'Kakek itu ternyata cuma mau cerita kenangan masa muda, sampai subuh...',
          gagalMsg: 'Kakek ketiduran sebelum bayar dan kamu ga tega bangunin orang tua!'
        }
      ])

      // Jam subuh = lebih berbahaya
      if (debuff.jam.jam >= 0 && debuff.jam.jam <= 5) {
        skenario.gagalMsg = 'Razia mendadak subuh-subuh! Kamu kabur duluan sebelum kena tangkap!'
      }
      // Musim semi = lebih untung
      if (debuff.musim.key === 'semi') {
        skenario.step3 += '\nMusim semi bikin pelanggan lebih royal!'
      }

      await sendWithTemplate(
        dino, m,
        decorate(`*💋 Mulai Ngelonte...*
│
│ Pelanggan : *${skenario.pelanggan}*
│ Lokasi    : *${skenario.lokasi}*
│ Durasi    : *${skenario.durasi}*
│
${timeInfo.split('\n').map(l => `│ ${l}`).join('\n')}`),
        { react: true, reactDone: '💋', mentions: [m.sender] }
      )

      await delay(3000)

      await sendWithTemplate(
        dino, m,
        decorate(`*🏨 Sampai Lokasi...*
│
│ ${skenario.step2}`),
        { mentions: [m.sender] }
      )

      await delay(3000)

      await sendWithTemplate(
        dino, m,
        decorate(`*😮‍💨 Melayani Pelanggan...*
│
│ ${skenario.step3}`),
        { mentions: [m.sender] }
      )

      await delay(3000)

      const gagal = Math.random() < debuff.finalChanceGagal
      if (gagal) {
        dbUser.stamina -= debuff.finalStaminaLoss
        dbUser.health -= debuff.finalHealthLoss

        setTimeout(() => {
          dino.sendMessage(from, {
            text: decorate(`*⏰ Siap Ngelonte Lagi!*
│
│ ➤ *${usedPrefix}ngelonte*`)
          }, { quoted: m })
        }, TIMEOUT)

        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Gagal Ngelonte!*
│
│ ${skenario.gagalMsg}
│
│ 📊 *Status:*
│ ⚡ Stamina Berkurang : *-${debuff.finalStaminaLoss}* (Sisa: ${dbUser.stamina})
│ ❤️ Health Berkurang  : *-${debuff.finalHealthLoss}* (Sisa: ${dbUser.health})
│ ⚠️ Chance Gagal: ${Math.round(debuff.finalChanceGagal * 100)}% (${debuff.jam.nama} | ${debuff.musim.nama})
│
│ ➤ *${usedPrefix}heal* untuk pulihkan health`),
          { react: true, reactDone: '❌', mentions: [m.sender] }
        )
      }

      const baseMoney = ranNumb(30000, 150000)
      const baseExp = ranNumb(5000, 20000)
      const reward = hitungReward('ngelonte', baseMoney, baseExp, 1)

      dbUser.stamina -= debuff.finalStaminaLoss
      dbUser.health -= debuff.finalHealthLoss
      dbUser.money = (dbUser.money || 0) + reward.finalMoney
      dbUser.exp = (dbUser.exp || 0) + reward.finalExp

      setTimeout(() => {
        dino.sendMessage(from, {
          text: decorate(`*⏰ Siap Ngelonte Lagi!*
│
│ ➤ *${usedPrefix}ngelonte*`)
        }, { quoted: m })
      }, TIMEOUT)

      return sendWithTemplate(
        dino, m,
        decorate(`*✅ Ngelonte Sukses!*
│
│ Pelanggan puas dan bayar lunas. Kamu pulang dengan kantong tebal!
│ ${reward.totalMult > 1.2 ? '💫 Bonus malam / musim semi = pelanggan lebih royal!' : ''}
│
│ 💰 Money : *+${reward.finalMoney.toLocaleString('id-ID')}*
│ ✨ EXP   : *+${reward.finalExp.toLocaleString('id-ID')}*
│
│ 📊 *Status:*
│ ⚡ Stamina Berkurang : *-${debuff.finalStaminaLoss}* (Sisa: ${dbUser.stamina})
│ ❤️ Health Berkurang  : *-${debuff.finalHealthLoss}* (Sisa: ${dbUser.health})
│
│ ⏱️ *Efek Waktu & Musim:*
${timeInfo.split('\n').map(l => `│ ${l}`).join('\n')}
│ 🔢 Total Multiplier: ×${reward.totalMult}`),
        { react: true, reactDone: '✅', mentions: [m.sender] }
      )
    }

  }
}