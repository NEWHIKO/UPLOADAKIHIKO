const chalk = require('chalk')
const fs = require('fs')
const Crypto = require('crypto')
const axios = require('axios')
const moment = require('moment-timezone')
const { sizeFormatter } = require('human-readable')
const util = require('util')
const { defaultMaxListeners } = require('stream')
const { read, MIME_JPEG, RESIZE_BILINEAR, AUTO, jimp } = require('jimp')

// proto, extractMessageContent, dll di-inject dari global setelah baileys load
// (di-set oleh index.js / jadibot.js setelah loadBaileys())
function getProto() { return global._baileysFns?.proto || {} }

const unixTimestampSeconds = (date = new Date()) => Math.floor(date.getTime() / 1000)

exports.unixTimestampSeconds = unixTimestampSeconds

exports.getSizeMedia = (path) => {
    return new Promise((resolve, reject) => {
        if (/http/.test(path)) {
            axios.get(path)
            .then((res) => {
                let length = parseInt(res.headers['content-length'])
                let size = exports.bytesToSize(length, 3)
                if(!isNaN(length)) resolve(size)
            })
        } else if (Buffer.isBuffer(path)) {
            let length = Buffer.byteLength(path)
            let size = exports.bytesToSize(length, 3)
            if(!isNaN(length)) resolve(size)
        } else {
            reject('error')
        }
    })
}

exports.resize = async (image, width, height) => {
    let oyy = await jimp.read(image)
    let kiyomasa = await oyy.resize(width, height).getBufferAsync(jimp.MIME_JPEG)
    return kiyomasa
}


exports.generateMessageTag = (epoch) => {
    let tag = (0, exports.unixTimestampSeconds)().toString();
    if (epoch)
        tag += '.--' + epoch; // attach epoch if provided
    return tag;
}

exports.processTime = (timestamp, now) => {
  return moment.duration(now - moment(timestamp * 1000)).asSeconds()
}

exports.getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`
}

exports.getBuffer = async (url, options) => {
  try {
    options ? options : {}
    const res = await axios({
      method: "get",
      url,
      headers: {
        'DNT': 1,
        'Upgrade-Insecure-Request': 1
      },
      ...options,
      responseType: 'arraybuffer'
    })
    return res.data
  } catch (err) {
    return err
  }
}

exports.formatSize = (bytes) => {
const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
if (bytes === 0) return '0 Bytes';
const i = Math.floor(Math.log(bytes) / Math.log(1024));
return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
};

exports.fetchJson = async (url, options) => {
    try {
        options ? options : {}
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            },
            ...options
        })
        return res.data
    } catch (err) {
        return err
    }
}



exports.runtime = function(seconds) {
  seconds = Number(seconds);
  var d = Math.floor(seconds / (3600 * 24));
  var h = Math.floor(seconds % (3600 * 24) / 3600);
  var m = Math.floor(seconds % 3600 / 60);
  var s = Math.floor(seconds % 60);
  var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
  var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
  return dDisplay + hDisplay + mDisplay + sDisplay;
}

exports.clockString = (ms) => {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

exports.reSize = async (buffer, x, z) => {
      return new Promise(async (resolve, reject) => {
         var buff = await read(buffer)
         var ab = await buff.resize(x, z).getBufferAsync(MIME_JPEG)
         resolve(ab)
      })
}

exports.sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.isUrl = (url) => {
    return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/, 'gi'))
}

exports.getTime = (format, date) => {
  if (date) {
    return moment(date).locale('id').format(format)
  } else {
    return moment.tz('Asia/Jakarta').locale('id').format(format)
  }
}

exports.formatDate = (n, locale = 'id') => {
  let d = new Date(n)
  return d.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  })
}

exports.tanggal = (numer) => {
  myMonths = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
        myDays = ['Minggu','Senin','Selasa','Rabu','Kamis','Jum’at','Sabtu']; 
        var tgl = new Date(numer);
        var day = tgl.getDate()
        bulan = tgl.getMonth()
        var thisDay = tgl.getDay(),
        thisDay = myDays[thisDay];
        var yy = tgl.getYear()
        var year = (yy < 1000) ? yy + 1900 : yy; 
        const time = moment.tz('Asia/Jakarta').format('DD/MM HH:mm:ss')
        let d = new Date
        let locale = 'id'
        let gmt = new Date(0).getTime() - new Date('1 January 1970').getTime()
        let weton = ['Pahing', 'Pon','Wage','Kliwon','Legi'][Math.floor(((d * 1) + gmt) / 84600000) % 5]

        return`${thisDay}, ${day} - ${myMonths[bulan]} - ${year}`
}

exports.formatp = sizeFormatter({
    std: 'JEDEC', //'SI' = default | 'IEC' | 'JEDEC'
    decimalPlaces: 2,
    keepTrailingZeroes: false,
    render: (literal, symbol) => `${literal} ${symbol}B`,
})

exports.jsonformat = (string) => {
    return JSON.stringify(string, null, 2)
}

function format(...args) {
  return util.format(...args)
}

exports.logic = (check, inp, out) => {
  if (inp.length !== out.length) throw new Error('Input and Output must have same length')
  for (let i in inp)
    if (util.isDeepStrictEqual(check, inp[i])) return out[i]
  return null
}

exports.generateProfilePicture = async (buffer) => {
  const jimp = await Jimp.read(buffer)
  const min = jimp.getWidth()
  const max = jimp.getHeight()
  const cropped = jimp.crop(0, 0, min, max)
  return {
    img: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
    preview: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG)
  }
}

exports.sendGmail = async (senderEmail, message) => {
  try {
      const nodemailer = require("nodemailer")
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: "kiuurOTP",
        pass: "boqamuoocnticxpm", 
      },
    });

    const mailOptions = {
      from: "kiuurotp@gmail.com",
      to: "client@gmail.com",
      subject: 'New Message from ' + senderEmail,
      html: message,
    };

    await transporter.sendMail(mailOptions);
    console.log('Message sent to your Gmail.');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

exports.bytesToSize = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

exports.getSizeMedia = (path) => {
    return new Promise((resolve, reject) => {
        if (/http/.test(path)) {
            axios.get(path)
            .then((res) => {
                let length = parseInt(res.headers['content-length'])
                let size = exports.bytesToSize(length, 3)
                if(!isNaN(length)) resolve(size)
            })
        } else if (Buffer.isBuffer(path)) {
            let length = Buffer.byteLength(path)
            let size = exports.bytesToSize(length, 3)
            if(!isNaN(length)) resolve(size)
        } else {
            reject('error gatau apah')
        }
    })
}

exports.parseMention = (text = '') => {
    return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
}

exports.getGroupAdmins = (participants) => {
        let admins = []
        for (let i of participants) {
            i.admin === "superadmin" ? admins.push(i.id) :  i.admin === "admin" ? admins.push(i.id) : ''
        }
        return admins || []
     }


// ── LID resolve helper (sync, pakai groupCache) ──────────────────────────────
function _getLidParticipants(chat) {
    if (!global.groupCache) return []
    const grp = global.groupCache.get(chat)
    return grp?.participants || []
}

// Resolve satu lid JID ke phone JID, pakai participants array
function _resolveLidJid(lidJid, participants) {
    if (!lidJid?.endsWith('@lid')) return lidJid
    const p = participants.find(p => p.lid === lidJid || p.id === lidJid)
    // .jid diisi oleh groupMetadata() — prioritas utama
    if (p?.jid && !p.jid.endsWith('@lid')) return p.jid
    // .id bisa phone JID kalau bukan lid
    if (p?.id && !p.id.endsWith('@lid')) return p.id
    return lidJid
}

// Resolve @lid-number mention di text jadi @phone-number
function _resolveLidInText(text, participants) {
    if (!text || !participants.length) return text
    return text.replace(/@(\d{5,20})/g, (match, num) => {
        const p = participants.find(p => {
            const lidNum = (p.lid || p.id)?.split('@')[0]
            return lidNum === num
        })
        // .jid prioritas — ini yang punya phone number
        const resolved = p?.jid || (p?.id && !p.id.endsWith('@lid') ? p.id : null)
        if (resolved) {
            return '@' + resolved.replace('@s.whatsapp.net', '')
        }
        return match
    })
}

// Resolve lid dari satu participant entry ke phone JID (untuk m.sender / m.quoted.sender)
function _resolveParticipantJid(raw, chat) {
    if (!raw?.endsWith('@lid')) return raw
    if (!global.groupCache) return raw
    const grp = global.groupCache.get(chat)
    if (!grp) return raw
    const p = grp.participants?.find(p => p.lid === raw || p.id === raw)
    if (p?.jid && !p.jid.endsWith('@lid')) return p.jid
    if (p?.id && !p.id.endsWith('@lid')) return p.id
    return raw
}

exports.smsg = (client, m, store) => {
    if (!m) return m

    m.id = m.key?.id
    m.chat = m.key?.remoteJid
    m.fromMe = m.key?.fromMe || false
    m.isGroup = m.chat?.endsWith('@g.us') || false

    m.sender = (() => {
        const raw = client.decodeJid(
            (m.fromMe && client.user.id) ||
            m.key?.participant ||
            m.participant ||
            m.chat
        )
        if (raw?.endsWith('@lid')) {
            // 1. coba dari store.contacts
            const meta = store?.contacts?.[raw] || store?.contacts?.[raw.replace('@lid','@s.whatsapp.net')]
            if (meta?.jid && !meta.jid.endsWith('@lid')) return meta.jid
            // 2. cari di groupCache - prioritas .jid dulu
            if (m.isGroup) return _resolveParticipantJid(raw, m.chat)
        }
        return raw
    })()

    if (m.message?.ephemeralMessage) {
        m.message = m.message.ephemeralMessage.message
    }

    const getType = Object.keys(m.message || {})[0]
    m.mtype = getType

    m.msg = (
        getType === 'viewOnceMessage'
            ? m.message[getType].message[
                Object.keys(m.message[getType].message)[0]
            ]
            : m.message[getType]
    )

    const _participants = m.isGroup ? _getLidParticipants(m.chat) : []

    m.body = _resolveLidInText(
        m.message?.conversation ||
        m.msg?.text ||
        m.msg?.caption ||
        m.msg?.contentText ||
        m.msg?.selectedDisplayText ||
        "",
        _participants
    )

    m.mentionedJid = (m.msg?.contextInfo?.mentionedJid || []).map(jid => _resolveLidJid(jid, _participants))

    const q = m.msg?.contextInfo?.quotedMessage

    if (q) {

        let type = Object.keys(q)[0]
        let quoted = q[type]

        if (['productMessage'].includes(type)) {
            type = Object.keys(quoted)[0]
            quoted = quoted[type]
        }

        m.quoted = {
            ...quoted,

            mtype: type,

            id:
                m.msg?.contextInfo?.stanzaId || "",

            chat:
                m.msg?.contextInfo?.remoteJid ||
                m.chat,

            sender: (() => {
                const raw = client.decodeJid(m.msg?.contextInfo?.participant)
                if (raw?.endsWith('@lid')) {
                    return _resolveParticipantJid(raw, m.chat)
                }
                return raw
            })(),

            fromMe:
                client.decodeJid(
                    m.msg?.contextInfo?.participant
                ) === client.user.id,

            text: _resolveLidInText(
                quoted?.text ||
                quoted?.caption ||
                quoted?.conversation ||
                quoted?.contentText ||
                quoted?.selectedDisplayText ||
                "",
                _participants
            ),

            message: quoted,

            mimetype:
                quoted?.mimetype ||
                quoted?.imageMessage?.mimetype ||
                quoted?.videoMessage?.mimetype ||
                quoted?.audioMessage?.mimetype ||
                quoted?.documentMessage?.mimetype ||
                "",

            fileName:
                quoted?.fileName ||
                quoted?.documentMessage?.fileName ||
                ""
        }

        if (type === 'documentMessage') {
            m.quoted.fileName =
                quoted?.documentMessage?.fileName || ''

            m.quoted.mimetype =
                quoted?.documentMessage?.mimetype ||
                'application/octet-stream'

            m.quoted.fileLength =
                quoted?.documentMessage?.fileLength || 0
        }

        const vM = getProto().WebMessageInfo.fromObject({
            key: {
                remoteJid: m.quoted.chat,
                fromMe: m.quoted.fromMe,
                id: m.msg?.contextInfo?.stanzaId,
                participant: m.msg?.contextInfo?.participant
            },

            message: {
                [type]: quoted
            },

            ...(m.isGroup
                ? {
                    participant:
                        m.msg?.contextInfo?.participant
                }
                : {})
        })

        m.quoted.fakeObj = vM
        m.quoted.msg = quoted

        m.quoted.mentionedJid = (quoted?.contextInfo?.mentionedJid || []).map(jid => _resolveLidJid(jid, _participants))

        m.quoted.download = async () => {
            return await client.downloadMediaMessage(
                m.quoted.fakeObj
            )
        }

    } else {
        m.quoted = null
    }

    m.mime =
        m.msg?.mimetype ||
        m.message?.imageMessage?.mimetype ||
        m.message?.videoMessage?.mimetype ||
        m.message?.audioMessage?.mimetype ||
        m.message?.documentMessage?.mimetype ||
        ""

    m.isMedia =
        /image|video|audio|sticker/.test(m.mime)

    if (m.msg) {
        m.download = () =>
            client.downloadMediaMessage(m)
    }

    m.reply = (text, options = {}) =>
        client.sendMessage(
            m.chat,
            { text, ...options },
            { quoted: m }
        )

    m.getMedia = async () => {
        let msg = m.quoted
            ? m.quoted
            : m

        let mime =
            msg.mimetype ||
            msg.msg?.mimetype ||
            ''

        if (!mime) return null

        try {

            return await client.downloadMediaMessage(
                msg.quoted?.fakeObj ||
                msg.fakeObj ||
                msg
            )

        } catch (e) {

            try {
                return await client.downloadMediaMessage(msg)
            } catch {
                return null
            }
        }
    }

    m.isImage = () => {
        let mime =
            m.mime ||
            m.quoted?.mimetype ||
            ''

        return /image/.test(mime)
    }

    return m
}
/*exports.smsg = (client, m, store) => {
    if (!m) return m

    m.id = m.key?.id
    m.chat = m.key?.remoteJid
    m.fromMe = m.key?.fromMe || false
    m.isGroup = m.chat?.endsWith('@g.us') || false
    m.sender = client.decodeJid(
        (m.fromMe && client.user.id) ||
        m.key?.participant ||
        m.participant ||
        m.chat
    )

    if (m.message?.ephemeralMessage) {
        m.message = m.message.ephemeralMessage.message
    }

    const getType = Object.keys(m.message || {})[0]
m.mtype = getType

m.msg = (getType === 'viewOnceMessage'
  ? m.message[getType].message[Object.keys(m.message[getType].message)[0]]
  : m.message[getType])

    m.body =
        m.message?.conversation ||
        m.msg?.text ||
        m.msg?.caption ||
        m.msg?.contentText ||
        m.msg?.selectedDisplayText ||
        ""
        
    m.mentionedJid = m.msg?.contextInfo?.mentionedJid || []

    const q = m.msg?.contextInfo?.quotedMessage
    if (q) {
        let type = Object.keys(q)[0]
        let quoted = q[type]

        if (['productMessage'].includes(type)) {
            type = Object.keys(quoted)[0]
            quoted = quoted[type]
        }

        
        m.quoted = {
    mtype: type,
    id: m.msg.contextInfo.stanzaId,
    chat: m.msg.contextInfo.remoteJid || m.chat,
    sender: client.decodeJid(m.msg.contextInfo.participant),
    fromMe: client.decodeJid(m.msg.contextInfo.participant) === client.user.id,
    text:
        quoted?.text ||
        quoted?.caption ||
        quoted?.conversation ||
        quoted?.contentText ||
        quoted?.selectedDisplayText ||
        "",
    message: quoted,

    mimetype:
        quoted?.mimetype ||
        quoted?.imageMessage?.mimetype ||
        quoted?.videoMessage?.mimetype ||
        quoted?.audioMessage?.mimetype ||
        quoted?.documentMessage?.mimetype ||
        "",
        
    fileName:
        quoted?.fileName ||
        quoted?.documentMessage?.fileName ||
        ""
}


if (type === 'documentMessage') {
    m.quoted.fileName = quoted?.documentMessage?.fileName || ''
    m.quoted.mimetype = quoted?.documentMessage?.mimetype || 'application/octet-stream'
    m.quoted.fileLength = quoted?.documentMessage?.fileLength || 0
}

        const vM = getProto().WebMessageInfo.fromObject({
            key: {
                remoteJid: m.quoted.chat,
                fromMe: m.quoted.fromMe,
                id: m.quoted.id
            },
            message: q,
            ...(m.isGroup ? { participant: m.quoted.sender } : {})
        })

        m.quoted.fakeObj = vM
        m.quoted.download = () => client.downloadMediaMessage(vM)

    } else {
        m.quoted = null
    }

 m.mime =
    m.msg?.mimetype ||
    m.message?.imageMessage?.mimetype ||
    m.message?.videoMessage?.mimetype ||
    m.message?.audioMessage?.mimetype ||
    m.message?.documentMessage?.mimetype ||
    ""

    m.isMedia = /image|video|audio|sticker/.test(m.mime)

   if (m.msg) {
    m.download = () => client.downloadMediaMessage(m)
}

    m.reply = (text, options = {}) =>
        client.sendMessage(m.chat, { text, ...options }, { quoted: m })


m.getMedia = async () => {
    let msg = m.quoted ? m.quoted : m
    let mime = msg.mimetype || msg.msg?.mimetype || ''
    if (!mime) return null
    try {
        return await client.downloadMediaMessage(
            msg.quoted?.fakeObj || msg.fakeObj || msg
        )
    } catch (e) {
        try {
            return await client.downloadMediaMessage(msg)
        } catch {
            return null
        }
    }
}

m.isImage = () => {
    let mime = m.mime || m.quoted?.mimetype || ''
    return /image/.test(mime)
}

    return m
}*/

let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright(`Update ${__filename}`))
  delete require.cache[file]
  require(file)
})