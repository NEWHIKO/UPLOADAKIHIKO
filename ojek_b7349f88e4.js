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

    case 'ojek': 'menu'; {
      /* CONSTANTS */
      const TIMEOUT = 1200000 // 20 menit

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
      const time = (dbUser.ojekk || 0) + TIMEOUT

      const staminaLoss = ranNumb(20, 40)

      if ((dbUser.stamina || 0) < staminaLoss) {
        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Stamina Tidak Cukup!*
│
│ Stamina Dibutuhkan : *${staminaLoss}*
│ Stamina Kamu       : *${dbUser.stamina || 0}*
│
│ ➤ *${usedPrefix}eat* untuk mengisi stamina`),
          { mentions: [m.sender] }
        )
      }

      if ((dbUser.health || 0) < 10) {
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

      if (Date.now() - (dbUser.ojekk || 0) < TIMEOUT) {
        return sendWithTemplate(
          dino, m,
          decorate(`*⏳ Masih Istirahat!*
│
│ Tunggu: *${msToTime(time - Date.now())}*`),
          { mentions: [m.sender] }
        )
      }

      // SET COOLDOWN DI AWAL — cegah spam/race condition
      dbUser.ojekk = Date.now()

      // TIME SYSTEM
      // Ojek: Pagi+Malam ×1.35 (ramai), Hujan ×1.2 (laris), Kemarau ×0.9 (orang males keluar)
      const debuff = hitungDebuff(staminaLoss, ranNumb(5, 20), 0, 0.15)
      const timeInfo = buildTimeInfo('narik')

      let skenario = pickRandom([
        {
          penumpang: 'mas-mas kantoran buru-buru',
          dari: 'depan minimarket',
          tujuan: 'gedung perkantoran lantai 20',
          jarak: '12 km',
          step2: 'Kamu memacu motor dengan kencang melewati kemacetan kota...',
          step3: 'Hampir sampai! Tinggal belok kanan menuju gedung perkantoran...',
          gagalMsg: 'Tiba-tiba ada pengendara lain menyerempet motormu dan kamu harus menepi!'
        },
        {
          penumpang: 'cewek SMA mau ujian',
          dari: 'perumahan blok C',
          tujuan: 'SMA Negeri di ujung kota',
          jarak: '8 km',
          step2: 'Kamu pilih jalan tikus biar ga kena macet, penumpang dag dig dug takut telat...',
          step3: 'Gerbang sekolah udah kelihatan! Penumpang lega banget hampir telat ujian...',
          gagalMsg: 'Ban motor bocor tepat di tengah jalan, penumpang terpaksa naik angkot!'
        },
        {
          penumpang: 'emak-emak bawa belanjaan banyak',
          dari: 'pasar tradisional',
          tujuan: 'rumah di gang sempit',
          jarak: '5 km',
          step2: 'Motormu oleng karena bawaan emak-emak yang berat banget, kamu coba jaga keseimbangan...',
          step3: 'Hampir sampai gang, kamu hati-hati masuk jalan sempit...',
          gagalMsg: 'Belanjaan emak-emak jatuh berserakan di jalan, kamu ikut bantuin, penumpang ga kasih tip!'
        },
        {
          penumpang: 'bapak-bapak mau ke dokter',
          dari: 'klinik umum',
          tujuan: 'rumah sakit besar',
          jarak: '15 km',
          step2: 'Kamu pacu motor sambil jaga kecepatan karena bapaknya kelihatan sakit...',
          step3: 'Pintu UGD rumah sakit sudah terlihat! Bapaknya minta cepet-cepetan...',
          gagalMsg: 'Motor kena macet parah di jembatan, bapaknya akhirnya naik ambulance!'
        },
        {
          penumpang: 'anak kecil dijemput orang tuanya',
          dari: 'sekolah dasar',
          tujuan: 'kompleks perumahan mewah',
          jarak: '7 km',
          step2: 'Kamu pelan-pelan karena anak kecil di belakang, ia nyanyi-nyanyi sepanjang jalan...',
          step3: 'Hampir nyampe! Anak kecilnya girang karena rumahnya udah keliatan...',
          gagalMsg: 'Anak kecilnya nangis minta balik ke sekolah, katanya lupa tas! Kamu rugi bensin!'
        }
      ])

      // Pesan kontekstual berdasarkan waktu
      if (debuff.jam.jam >= 0 && debuff.jam.jam <= 5) {
        skenario.penumpang = 'orang misterius berkerudung'
        skenario.dari = 'pinggir jalan sepi'
        skenario.tujuan = 'lokasi yang tidak kamu kenal'
      } else if (debuff.musim.key === 'hujan') {
        skenario.step2 = 'Hujan deras mengguyur! Kamu bawa jas hujan dan tetap tancap gas...'
      }

      await sendWithTemplate(
        dino, m,
        decorate(`*🛵 Dapat Orderan Ojek!*
│
│ Penumpang : *${skenario.penumpang}*
│ Dari      : *${skenario.dari}*
│ Tujuan    : *${skenario.tujuan}*
│ Jarak     : *${skenario.jarak}*
│
${timeInfo.split('\n').map(l => `│ ${l}`).join('\n')}`),
        { react: true, reactDone: '🛵', mentions: [m.sender] }
      )

      await delay(3000)

      await sendWithTemplate(
        dino, m,
        decorate(`*🚗 Di Jalan...*
│
│ ${skenario.step2}`),
        { mentions: [m.sender] }
      )

      await delay(3000)

      const gagal = Math.random() < debuff.finalChanceGagal
      if (gagal) {
        dbUser.stamina -= debuff.finalStaminaLoss
        dbUser.health -= debuff.finalHealthLoss

        setTimeout(() => {
          dino.sendMessage(from, {
            text: decorate(`*⏰ Ada Orderan Baru!*
│
│ ➤ *${usedPrefix}ojek*`)
          }, { quoted: m })
        }, TIMEOUT)

        return sendWithTemplate(
          dino, m,
          decorate(`*❌ Orderan Gagal!*
│
│ ${skenario.gagalMsg}
${debuff.musim.key === 'hujan' ? '│ 🌧️ Hujan deras memperparah situasi!\n' : ''}│
│ 📊 *Status:*
│ ⚡ Stamina Berkurang : *-${debuff.finalStaminaLoss}* (Sisa: ${dbUser.stamina})
│ ❤️ Health Berkurang  : *-${debuff.finalHealthLoss}* (Sisa: ${dbUser.health})
│ ⚠️ Chance Gagal: ${Math.round(debuff.finalChanceGagal * 100)}%
│
│ ➤ *${usedPrefix}eat* untuk mengisi stamina`),
          { react: true, reactDone: '❌', mentions: [m.sender] }
        )
      }

      await sendWithTemplate(
        dino, m,
        decorate(`*🏠 Hampir Sampai!*
│
│ ${skenario.step3}`),
        { mentions: [m.sender] }
      )

      await delay(3000)

      const baseMoney = ranNumb(4000, 15000)
      const baseExp = ranNumb(1000, 5000)
      const reward = hitungReward('narik', baseMoney, baseExp, 1)

      dbUser.stamina -= debuff.finalStaminaLoss
      dbUser.health -= debuff.finalHealthLoss
      dbUser.money = (dbUser.money || 0) + reward.finalMoney
      dbUser.exp = (dbUser.exp || 0) + reward.finalExp

      setTimeout(() => {
        dino.sendMessage(from, {
          text: decorate(`*⏰ Ada Orderan Baru!*
│
│ ➤ *${usedPrefix}ojek*`)
        }, { quoted: m })
      }, TIMEOUT)

      return sendWithTemplate(
        dino, m,
        decorate(`*✅ Orderan Selesai!*
│
│ Penumpang sudah sampai tujuan dengan selamat!
│ ${reward.totalMult > 1.2 ? '🎉 Bonus karena jam sibuk / weekend / musim laris!' : ''}
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
│ 🔢 Total Multiplier: ×${reward.totalMult}
│
│ ➤ *${usedPrefix}ojek* untuk cari orderan lagi!`),
        { react: true, reactDone: '✅', mentions: [m.sender] }
      )
    }

  }
}