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

    case 'kandang': 'menu';
    case 'listhewan':  {
      /* CONSTANTS */

      /* HELPER */
      const u = global.db.data.users[m.sender]
      const fmt = (n) => (n || 0).toLocaleString('id-ID')

      /* HANDLER */
      const hewan = {
        banteng:   u.banteng   || 0,
        sapi:      u.sapi      || 0,
        ayam:      u.ayam      || 0,
        kambing:   u.kambing   || 0,
        kerbau:    u.kerbau    || 0,
        harimau:   u.harimau   || 0,
        monyet:    u.monyet    || 0,
        babi:      u.babi      || 0,
        babihutan: u.babihutan || 0,
        panda:     u.panda     || 0,
        gajah:     u.gajah     || 0,
        buaya:     u.buaya     || 0,
      }

      const totalHewan = Object.values(hewan).reduce((a, b) => a + b, 0)

      return sendWithTemplate(
        dino, m,
        decorate(`*🦁 TAMAN SAFARI*
│
│ 🐔 *Ayam:* ${fmt(hewan.ayam)}
│ 🐐 *Kambing:* ${fmt(hewan.kambing)}
│ 🐄 *Sapi:* ${fmt(hewan.sapi)}
│ 🐃 *Kerbau:* ${fmt(hewan.kerbau)}
│ 🐖 *Babi:* ${fmt(hewan.babi)}
│ 🐅 *Harimau:* ${fmt(hewan.harimau)}
│ 🐂 *Banteng:* ${fmt(hewan.banteng)}
│ 🐒 *Monyet:* ${fmt(hewan.monyet)}
│ 🐗 *Babi Hutan:* ${fmt(hewan.babihutan)}
│ 🐼 *Panda:* ${fmt(hewan.panda)}
│ 🐘 *Gajah:* ${fmt(hewan.gajah)}
│ 🐊 *Buaya:* ${fmt(hewan.buaya)}
│
│ 💡 *Paus & Kepiting ada di .kolam*
│ 🥢 *MASAK: .cook | JUAL: .pasar*
│ 💬 *Total Hewan:* ${fmt(totalHewan)} tangkapan`),
        { mentions: [m.sender] }
      )
    }

  }
}