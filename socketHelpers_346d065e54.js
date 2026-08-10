
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const FileType = require('file-type')
const PhoneNumber = require('awesome-phonenumber')

const { getBuffer } = require('./myfunction')
const {
    imageToWebp,
    videoToWebp,
    writeExifImg,
    writeExifVid,
    addExif
} = require('./exif')

function getMentions(text) {
    if (!text || !text.includes('@')) return []
    return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => `${v[1]}@s.whatsapp.net`)
}

// baileysFns dikirim dari pemanggil (jadibot.js / index.js) yang sudah load
// baileys secara dynamic — tidak perlu require di sini
function attachHelpers(dino, store, baileysFns = {}) {
    const {
        jidDecode,
        generateWAMessageFromContent,
        generateWAMessage,
        prepareWAMessageMedia,
        proto,
        delay,
        downloadContentFromMessage,
    } = baileysFns
    dino.sendText = async (jid, text, quoted = '', options) => {
        return dino.sendMessage(jid, { text, ...options }, { quoted })
    }

    dino.downloadMediaMessage = async (m) => {
        const msg = m.message ? m.message : m
        const type = Object.keys(msg)[0]
        const media = msg[type]

        const stream = await downloadContentFromMessage(media, type.replace('Message', ''))
        let buffer = Buffer.from([])
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
        return buffer
    }

    dino.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            const decode = jidDecode(jid) || {}
            return (decode.user && decode.server && decode.user + '@' + decode.server) || jid
        }
        return jid
    }

    if (store) {
        dino.ev.on('contacts.update', update => {
            for (const contact of update) {
                const id = dino.decodeJid(contact.id)
                if (store.contacts) store.contacts[id] = { id, name: contact.notify }
            }
        })
    }

    dino.getName = (jid, withoutContact = false) => {
        const id = dino.decodeJid(jid)
        withoutContact = dino.withoutContact || withoutContact
        let v
        if (id.endsWith('@g.us')) {
            return new Promise(async (resolve) => {
                v = (store && store.contacts[id]) || {}
                if (!(v.name || v.subject)) v = (await dino.groupMetadata(id).catch(() => null)) || {}
                resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
            })
        }
        v = id === '0@s.whatsapp.net'
            ? { id, name: 'WhatsApp' }
            : id === dino.decodeJid(dino.user.id)
                ? dino.user
                : ((store && store.contacts[id]) || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName ||
            PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    dino.sendImageAsSticker = async (jid, imgPath, quoted, options = {}) => {
        const buff = Buffer.isBuffer(imgPath) ? imgPath
            : /^data:.*?\/.*?;base64,/i.test(imgPath) ? Buffer.from(imgPath.split(',')[1], 'base64')
            : /^https?:\/\//.test(imgPath) ? await getBuffer(imgPath)
            : fs.existsSync(imgPath) ? fs.readFileSync(imgPath)
            : Buffer.alloc(0)

        const buffer = (options && (options.packname || options.author))
            ? await writeExifImg(buff, options)
            : await addExif(buff)

        await dino.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
        return buffer
    }

    dino.downloadAndSaveMediaMessage = async (message, filename = 'file', attachExtension = true) => {
        const msg = message.message ? message.message : message
        if (!msg.mediaKey) throw new Error('Media key tidak ada')

        const mime = msg.mimetype || ''
        const messageType = mime.split('/')[0]
        const stream = await downloadContentFromMessage(msg, messageType)

        let buffer = Buffer.from([])
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])

        const type = await FileType.fromBuffer(buffer)
        const trueFileName = attachExtension ? filename + '.' + type.ext : filename
        await fs.promises.writeFile(trueFileName, buffer)
        return trueFileName
    }

    dino.sendVideoAsSticker = async (jid, vidPath, quoted, options = {}) => {
        const buff = Buffer.isBuffer(vidPath) ? vidPath
            : /^data:.*?\/.*?;base64,/i.test(vidPath) ? Buffer.from(vidPath.split(',')[1], 'base64')
            : /^https?:\/\//.test(vidPath) ? await getBuffer(vidPath)
            : fs.existsSync(vidPath) ? fs.readFileSync(vidPath)
            : Buffer.alloc(0)

        const buffer = (options && (options.packname || options.author))
            ? await writeExifVid(buff, options)
            : await videoToWebp(buff)

        await dino.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
        return buffer
    }

    dino.getFile = async (PATH, save = false) => {
        let res
        const data = Buffer.isBuffer(PATH) ? PATH
            : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split(',')[1], 'base64')
            : /^https?:\/\//.test(PATH) ? (res = await getBuffer(PATH))
            : fs.existsSync(PATH) ? fs.readFileSync(PATH)
            : typeof PATH === 'string' ? Buffer.from(PATH)
            : Buffer.alloc(0)

        const type = (await FileType.fromBuffer(data)) || { mime: 'application/octet-stream', ext: 'bin' }
        const sampahDir = path.join(__dirname, 'sampah')
        if (!fs.existsSync(sampahDir)) fs.mkdirSync(sampahDir, { recursive: true })

        const filename = path.join(sampahDir, `${Date.now()}-${Math.floor(Math.random() * 1000)}.${type.ext}`)
        if (save) await fs.promises.writeFile(filename, data)

        return { res, filename: save ? filename : null, size: data.length, ...type, data }
    }

    // Catatan: fitur audio (ptt/toAudio) di kode asli manggil toPTT/toAudio dari
    // ./lib/converter tapi tidak pernah di-require di index.js -> akan error kalau
    // dipakai. Di-require di sini supaya beneran jalan.
    const { toPTT, toAudio } = require('./converter')

    dino.sendFile = async (jid, filePath, filename = '', caption = '', quoted, ptt = false, options = {}) => {
        const type = await dino.getFile(filePath, true)
        let { res, data: file, filename: pathFile } = type

        if ((res && res.status !== 200) || file.length <= 65536) {
            try {
                throw { json: JSON.parse(file.toString()) }
            } catch (e) {
                if (e.json) throw e.json
            }
        }

        const opt = { filename }
        if (quoted) opt.quoted = quoted
        if (!type) options.asDocument = true

        let mtype = '', mimetype = type.mime, convert

        if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker'
        else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image'
        else if (/video/.test(type.mime)) mtype = 'video'
        else if (/audio/.test(type.mime)) {
            convert = await (ptt ? toPTT : toAudio)(file, type.ext)
            file = convert.data
            pathFile = convert.filename
            mtype = 'audio'
            mimetype = 'audio/ogg; codecs=opus'
        } else mtype = 'document'

        if (options.asDocument) mtype = 'document'

        delete options.asSticker
        delete options.asLocation
        delete options.asVideo
        delete options.asDocument
        delete options.asImage

        const message = { ...options, caption, ptt, [mtype]: { url: pathFile }, mimetype }
        let m
        try {
            m = await dino.sendMessage(jid, message, { ...opt, ...options })
        } catch (e) {
            m = null
        } finally {
            if (!m) m = await dino.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options })
            file = null
            return m
        }
    }

    dino.albumMessage = async (jid, array, quoted) => {
        const album = generateWAMessageFromContent(jid, {
            messageContextInfo: { messageSecret: crypto.randomBytes(32) },
            albumMessage: {
                expectedImageCount: array.filter(a => a.hasOwnProperty('image')).length,
                expectedVideoCount: array.filter(a => a.hasOwnProperty('video')).length
            }
        }, { userJid: dino.user.jid, quoted, upload: dino.waUploadToServer })

        await dino.relayMessage(jid, album.message, { messageId: album.key.id })

        for (const content of array) {
            const img = await generateWAMessage(jid, content, { upload: dino.waUploadToServer })
            img.message.messageContextInfo = {
                messageSecret: crypto.randomBytes(32),
                messageAssociation: { associationType: 1, parentMessageKey: album.key },
                participant: '0@s.whatsapp.net',
                remoteJid: 'status@broadcast',
                forwardingScore: 99999,
                isForwarded: true,
                mentionedJid: [jid],
                starred: true,
                labels: ['Y', 'Important'],
                isHighlighted: true,
                businessMessageForwardInfo: { businessOwnerJid: jid },
                dataSharingContext: { showMmDisclosure: true }
            }
            img.message.forwardedNewsletterMessageInfo = {
                newsletterJid: '0@newsletter',
                serverMessageId: 1,
                newsletterName: 'WhatsApp',
                contentType: 1,
                timestamp: new Date().toISOString(),
                senderName: '✧ Dittsans',
                content: 'Text Message',
                priority: 'high',
                status: 'sent'
            }
            img.message.disappearingMode = {
                initiator: 3, trigger: 4,
                initiatorDeviceJid: jid,
                initiatedByExternalService: true, initiatedByUserDevice: true,
                initiatedBySystem: true, initiatedByServer: true, initiatedByAdmin: true,
                initiatedByUser: true, initiatedByApp: true, initiatedByBot: true, initiatedByMe: true
            }
            await dino.relayMessage(jid, img.message, {
                messageId: img.key.id,
                quoted: {
                    key: { remoteJid: album.key.remoteJid, id: album.key.id, fromMe: true, participant: dino.user.jid },
                    message: album.message
                }
            })
        }
        return album
    }

    dino.sendWithThumbnail = async (jid, { text = '', title = '', body = '', thumbnailUrl = '', sourceUrl = '', renderLargerThumbnail = true }, quoted = {}) => {
        return dino.sendMessage(jid, {
            text,
            contextInfo: {
                externalAdReply: { title, body, mediaType: 1, renderLargerThumbnail, thumbnailUrl, sourceUrl }
            }
        })
    }

    dino.sendStatusMention = async (content, jids = []) => {
        let users
        for (const id of jids) {
            const userId = await dino.groupMetadata(id)
            users = userId.participants.map(u => dino.decodeJid(u.id))
        }

        const message = await dino.sendMessage('status@broadcast', content, {
            backgroundColor: '#000000',
            font: Math.floor(Math.random() * 9),
            statusJidList: users,
            additionalNodes: [{
                tag: 'meta', attrs: {},
                content: [{
                    tag: 'mentioned_users', attrs: {},
                    content: jids.map(jid => ({ tag: 'to', attrs: { jid }, content: undefined }))
                }]
            }]
        })

        jids.forEach(id => {
            dino.relayMessage(id, {
                groupStatusMentionMessage: { message: { protocolMessage: { key: message.key, type: 25 } } }
            }, {
                userJid: dino.user.jid,
                additionalNodes: [{ tag: 'meta', attrs: { is_status_mention: 'true' }, content: undefined }]
            })
            delay(2500)
        })
        return message
    }

    dino.sendButtonImage = async (jid, text, buffer, buttons, quoted) => {
        const uploadFile = { upload: dino.waUploadToServer }
        const imageMessage = await prepareWAMessageMedia({ image: buffer }, uploadFile)

        const message = generateWAMessageFromContent(jid, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                    interactiveMessage: proto.Message.InteractiveMessage.create({
                        contextInfo: { mentionedJid: getMentions(text) },
                        body: proto.Message.InteractiveMessage.Body.create({ text }),
                        footer: proto.Message.InteractiveMessage.Footer.create({ text: global.footer || global.foother || '' }),
                        header: proto.Message.InteractiveMessage.Header.create({
                            title: '', subtitle: 'Dino Official', imageMessage: imageMessage.imageMessage, hasMediaAttachment: true
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ buttons })
                    })
                }
            }
        }, { quoted })

        await dino.relayMessage(jid, message.message, { messageId: message.key.id })
        return message
    }

    dino.public = true
    return dino
}

module.exports = { attachHelpers }
