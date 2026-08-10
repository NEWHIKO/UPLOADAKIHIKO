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

    case 'kolam': 'menu'; 
    case 'akuarium':  {
      /* CONSTANTS */

      /* HELPER */
      const u = global.db.data.users[m.sender]
      const fmt = (n) => (n || 0).toLocaleString('id-ID')

      /* HANDLER */
      const ikan = {
        paus:     u.paus     || 0,
        kepiting: u.kepiting || 0,
        udang:    u.udang    || 0,
        nila:     u.nila     || 0,
        bawal:    u.bawal    || 0,
        lele:     u.lele     || 0,
      }

      const totalIkan = Object.values(ikan).reduce((a, b) => a + b, 0)

      return sendWithTemplate(
        dino, m,
        decorate(`*🐟 AKUARIUM*
│
│ 🐳 *Paus:* ${fmt(ikan.paus)}
│ 🐟 *Lele:* ${fmt(ikan.lele)}
│ 🐡 *Bawal:* ${fmt(ikan.bawal)}
│ 🐠 *Nila:* ${fmt(ikan.nila)}
│ 🦀 *Kepiting:* ${fmt(ikan.kepiting)}
│ 🦐 *Udang:* ${fmt(ikan.udang)}
│
│ 🥢 *MASAK: .cook | JUAL: .pasar*
│ 💬 *Total Ikan:* ${fmt(totalIkan)} tangkapan`),
        { mentions: [m.sender] }
      )
    }

  }
}