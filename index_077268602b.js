process.on("uncaughtException", console.error);
console.clear();

require('./server');
//require('./lib/rpg/helper')
//require('./lib/rpg/index')

require('./config');
require('./lib/database.js')

const { setupGlobalDB, loadUserDB } = require('./lib/database.js')
setupGlobalDB('default')

const loadBaileys = require('./lib/baileys')

let makeWASocket, prepareWAMessageMedia, useMultiFileAuthState, DisconnectReason,
    fetchLatestBaileysVersion, makeInMemoryStore, generateWAMessageFromContent,
    generateWAMessageContent, generateWAMessage, jidDecode, proto, delay,
    relayWAMessage, getContentType, getAggregateVotesInPollMessage,
    downloadContentFromMessage, fetchLatestWaWebVersion, InteractiveMessage,
    makeCacheableSignalKeyStore, Browsers, generateForwardMessageContent, MessageRetryMap

const PhoneNumber = require('awesome-phonenumber')
const cfonts = require('cfonts');
const pino = require('pino');
const FileType = require('file-type');
const readline = require("readline");
const fs = require('fs');
const path = require('path')
const crypto = require("crypto")
const colors = require('colors')
const chalk = require('chalk')
const moment = require('moment-timezone');
const { Boom } = require('@hapi/boom');
const { color } = require('./lib/color');
const { TelegraPh } = require('./lib/uploader')
const { smsg, sleep, getBuffer, getSizeMedia } = require('./lib/myfunction');
const { checkExpiredSewaForBot } = require("./lib/sewa")
function checkAllExpired(dino) {
    checkExpiredSewaForBot(dino)
}


const { 
    imageToWebp,
    videoToWebp,
    writeExifImg,
    writeExifVid,
    addExif
} = require('./lib/exif')

// Load group metadata helper
require('./lib/groupMetaHelper')

// Load user helper
require('./lib/userHelper')

const usePairingCode = !fs.existsSync('./session/creds.json');
let pairingRequested = false;

const question = (text) => {
    const rl = readline.createInterface({ 
        input: process.stdin, 
        output: process.stdout 
    });
    return new Promise((resolve) => rl.question(text, resolve));
}

// store dibuat di dalam dinostart() setelah baileys di-load
let store

cfonts.say('dino', {
    font: 'block',
    align: 'left',
    colors: ['#ff00ff', 'white'],
    background: 'transparent',
    rawMode: false,
});


['uncaughtException', 'unhandledRejection'].forEach(type => {
  process.on(type, err => {
    console.log(`[ERROR][${type}]`, err)
  })
})

let isConnecting = false;
let everConnected = false;
let shouldReconnect = true;

async function dinostart() {
    if (isConnecting) return;
    isConnecting = true;

    // Load baileys secara dynamic
    const baileys = await loadBaileys();
    ({
        default: makeWASocket, prepareWAMessageMedia, useMultiFileAuthState,
        DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore,
        generateWAMessageFromContent, generateWAMessageContent, generateWAMessage,
        jidDecode, proto, delay, relayWAMessage, getContentType,
        getAggregateVotesInPollMessage, downloadContentFromMessage,
        fetchLatestWaWebVersion, InteractiveMessage, makeCacheableSignalKeyStore,
        Browsers, generateForwardMessageContent, MessageRetryMap
    } = baileys);

    // Expose ke global supaya case.js, gc.js, myfunction.js bisa akses tanpa require
    global._baileysFns = baileys;

    // Inisialisasi store setelah baileys tersedia
    store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })

    const { state, saveCreds } = await useMultiFileAuthState("session")

    const dino = makeWASocket({
        
        printQRInTerminal: !usePairingCode,
        syncFullHistory: true,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000,
        generateHighQualityLinkPreview: true,
        patchMessageBeforeSending: (message) => {
            const requiresPatch = !!(
                message.buttonsMessage ||
                message.templateMessage ||
                message.listMessage
            );
            if (requiresPatch) {
                message = {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadataVersion: 2,
                                deviceListMetadata: {},
                            },
                            ...message,
                        },
                    },
                };
            }
            return message;
        },
        version: await (async () => {
    try {
        const res = await fetch(
            'https://raw.githubusercontent.com/WhiskeySockets/Baileys/master/src/Defaults/baileys-version.json',
            { signal: AbortSignal.timeout(8000) }
        )
        const data = await res.json()
        return data.version
    } catch (e) {
        console.log('[VERSION] Gagal fetch, pakai versi fallback')
        return [2, 3000, 1023062003] 
    }
})(),
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        logger: pino({ level: 'fatal' }),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino().child({
                level: 'silent',
                stream: 'store'
            })),
        }
    });

    /* ================== PAIRING ================== */
    if (usePairingCode && !dino.authState.creds.registered && !pairingRequested) {
        pairingRequested = true;
        
        await delay(2000);
        const phoneNumber = await question(`
              ⣀⣤⣤⣶⣶⣶⣶⣦⣤⡀     
       ⢀⣀⣤⣤⣄⣶⣿⠟⠛⠉   ⢀⣹⣿⡇      
    ⢀⣤⣾⣿⡟⠛⠛⠛⠉    ⠒⠒⠛⠿⠿⠿⠶⣿⣷⣢⣄⡀ 
   ⢠⣿⡟⠉⠈⣻⣦  ⣠⡴⠶⢶⣄        ⠈⠙⠻⣮⣦
  ⢰⣿⠿⣿⡶⠾⢻⡿ ⠠⣿⣄⣠⣼⣿⡇ ⠈⠒⢶⣤⣤⣤⣤⣤⣴⣾⡿
  ⣾⣿ ⠉⠛⠒⠋   ⠻⢿⣉⣠⠟     ⠉⠻⣿⣋⠙⠉⠁ 
  ⣿⡿⠷⠲⢶⣄     ⣀⣤⣤⣀       ⠙⣷⣦   
⠛⠛⢿⣅⣀⣀⣀⣿⠶⠶⠶⢤⣾⠋  ⠙⣷⣄⣀⣀⣀⣀⡀ ⠘⣿⣆  
   ⠈⠉⠉⠉⠁    ⠈⠛⠛⠶⠾⠋⠉⠉⠉⠉⠉⠉⠉⠉⠛⠛⠛⠛ 

=========================================

╭────────────────────────╮
│ 𝙼𝙰𝚂𝚄𝙺𝙰𝙽 𝙽𝙾𝙼𝙾𝚁 𝚆𝙷𝙰𝚃𝚂𝙰𝙿𝙿 │
╰────────────────────────╯
`);

        const code = await dino.requestPairingCode(phoneNumber, `DINOXOFC`);
        console.log(chalk.cyanBright(`
╭────────────────────────╮
│ 𝙿𝙰𝙸𝚁𝙸𝙽𝙶 𝙲𝙾𝙳𝙴 : ${code} │
╰────────────────────────╯`));
    }
    
    store.bind(dino.ev);

let presenceInterval;

    dino.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
        everConnected = true;
        isConnecting = false;
        shouldReconnect = false;
        console.log(chalk.greenBright('✅ 𝙱𝙴𝚁𝙷𝙰𝚂𝙸𝙻 𝚃𝙴𝚁𝚂𝙰𝙼𝙱𝚄𝙽𝙶..'));

     
        const _botUsername = dino.username || 'default'
        const { setupGlobalDB } = require('./lib/database.js')
        setupGlobalDB(_botUsername)
        console.log(`[DB] Database loaded for: ${_botUsername}`)
        
        checkAllExpired(dino)

if (!global.expiredInterval) {
    global.expiredInterval = setInterval(() => {
        checkAllExpired(dino)
    }, 60 * 1000)
}

        // ── Cek expired premium setiap 60 detik ──
        if (global.checkExpiredPremium) global.checkExpiredPremium(dino)
        if (!global.premiumExpiredInterval) {
            global.premiumExpiredInterval = setInterval(() => {
                if (global.checkExpiredPremium) global.checkExpiredPremium(dino)
            }, 60 * 1000)
        }
                             
        const groups = await dino.groupFetchAllParticipating()
        for (let id in groups) {
      global.groupCache.set(id, groups[id])
    }

  
if (!global.refreshCacheInterval) {
  global.refreshCacheInterval = setInterval(async () => {
    try {
      const groups = await dino.groupFetchAllParticipating()
      for (let id in groups) {
        global.groupCache.set(id, groups[id])
      }
      console.log(`[Cache] Refresh ${global.groupCache.size} group`)
    } catch (e) {
      console.log('[Cache] Gagal refresh:', e?.message)
    }
  }, 30 * 60 * 1000) // 30 menit
}

    console.log("Metadata cached:", global.groupCache.size)
        
        
   if (!global.resetStats) {
  global.resetStats = setInterval(() => {
    try {
      const now = new Date()
      
      if (now.getHours() === 0) {
        
        for (let id in db.groups) {
          if (!db.groups[id].stats) continue
          db.groups[id].stats.daily = {}
        }
       
        if (now.getDay() === 1) {
          for (let id in db.groups) {
            if (!db.groups[id].stats) continue
            db.groups[id].stats.weekly = {}
          }
        }

        saveDB && saveDB()
      }

    } catch {}
  }, 60 * 60 * 1000)
}  
        return;
    }


if (connection === 'close') {
    const reason = lastDisconnect?.error?.output?.statusCode;
    console.log(chalk.cyanBright('👾 𝚃𝚄𝙽𝙶𝙶𝚄 𝚂𝙴𝙱𝙴𝙽𝚃𝙰𝚁...'));
    
    isConnecting = false;
   
    if (
        reason === DisconnectReason.connectionReplaced ||
        reason === 440
    ) {
        console.log(chalk.redBright('❌ Session diganti / conflict. Tidak reconnect.'));
        return;
    }

    if (reason === DisconnectReason.loggedOut) {
        console.log(chalk.redBright('❌ Logged out. Scan ulang.'));
        process.exit();
    }

    console.log(chalk.yellowBright('🔄 Reconnecting 5 detik...'));
    setTimeout(dinostart, 5000);
}
    });

const caseHandler = require('./case')
dino.ev.on("messages.upsert", async (chatUpdate) => {
  try {
    const msg = chatUpdate.messages?.[0]
    if (!msg?.message) return
    const type = msg.message?.ephemeralMessage ? "ephemeralMessage" : null
    if (type === "ephemeralMessage") {
      msg.message = msg.message.ephemeralMessage.message
    }
    if (msg.key.remoteJid === "status@broadcast") return
    if (msg.key?.id?.startsWith("BAE5") && msg.key.id.length === 16) return
     
    const m = smsg(dino, msg, store)
   
   if (!m.isGroup && global.onlygc === true) {
      return
    }


  if (m.isGroup) {
  const id  = m.chat
  const sid = m.sender

  setImmediate(() => {
    const sessionDb = loadUserDB(dino.username || 'default')
    if (!sessionDb.groups) sessionDb.groups = {}
    if (!sessionDb.groups[id]) sessionDb.groups[id] = { stats: { daily: {}, weekly: {} } }
    if (!sessionDb.groups[id].stats) sessionDb.groups[id].stats = { daily: {}, weekly: {} }

    const stats = sessionDb.groups[id].stats
    stats.daily[sid]  = (stats.daily[sid]  || 0) + 1
    stats.weekly[sid] = (stats.weekly[sid] || 0) + 1
  })
}
    caseHandler(dino, m, chatUpdate, store)

  } catch (err) {
    console.error("UPsertError:", err)
  }
})

dino.ev.on("groups.update", async (updates) => {
  for (let update of updates) {
    const metadata = await dino.groupMetadata(update.id).catch(() => null)
    if (metadata) {
      global.groupCache.set(update.id, metadata)
    }
  }
})

const GroupParticipants = require("./gc.js");

dino.ev.on("group-participants.update", async (event) => {
  const metadata = await dino.groupMetadata(event.id).catch(() => null)
  if (metadata) {
    global.groupCache.set(event.id, metadata)
  }

  await GroupParticipants(dino, event)
})
   
    dino.sendText = async (jid, text, quoted = '', options) => {
        dino.sendMessage(jid, {
            text: text,
            ...options
        },{ quoted });
    }
 
 dino.downloadMediaMessage = async (m) => {
    const msg = m.message ? m.message : m
    const type = Object.keys(msg)[0]
    const media = msg[type]

    const stream = await downloadContentFromMessage(
        media,
        type.replace('Message', '')
    )
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
    }
    return buffer
}

dino.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = dino.decodeJid(contact.id);
            if (store && store.contacts) store.contacts[id] = {
                id,
                name: contact.notify
            };
        }
    });

dino.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server && decode.user + '@' + decode.server || jid;
        } else return jid;
    };

dino.getName = (jid, withoutContact  = false) => {
id = dino.decodeJid(jid)
withoutContact = dino.withoutContact || withoutContact 
let v
if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
v = store.contacts[id] || {}
if (!(v.name || v.subject)) v = dino.groupMetadata(id) || {}
resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
})
else v = id === '0@s.whatsapp.net' ? {
id,
name: 'WhatsApp'
} : id === dino.decodeJid(dino.user.id) ?
dino.user :
(store.contacts[id] || {})
return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
}

dino.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? 
            path : /^data:.*?\/.*?;base64,/i.test(path) ?
            Buffer.from(path.split`, `[1], 'base64') : /^https?:\/\//.test(path) ?
            await (await getBuffer(path)) : fs.existsSync(path) ? 
            fs.readFileSync(path) : Buffer.alloc(0);
        
        let buffer;
        if (options && (options.packname || options.author)) {
            buffer = await writeExifImg(buff, options);
        } else {
            buffer = await addExif(buff);
        }
        
        await dino.sendMessage(jid, { 
            sticker: { url: buffer }, 
            ...options }, { quoted });
        return buffer;
    };

dino.downloadAndSaveMediaMessage = async (message, filename = 'file', attachExtension = true) => {

    let msg = message.message ? message.message : message;

    if (!msg.mediaKey) {
        throw new Error("Media key tidak ada");
    }

    const mime = msg.mimetype || '';
    const messageType = mime.split('/')[0];

    const stream = await downloadContentFromMessage(msg, messageType);

    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }

    const type = await FileType.fromBuffer(buffer);
    const trueFileName = attachExtension ? filename + "." + type.ext : filename;

    await fs.writeFileSync(trueFileName, buffer);

    return trueFileName;
};


dino.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? 
            path : /^data:.*?\/.*?;base64,/i.test(path) ?
            Buffer.from(path.split`, `[1], 'base64') : /^https?:\/\//.test(path) ?
            await (await getBuffer(path)) : fs.existsSync(path) ? 
            fs.readFileSync(path) : Buffer.alloc(0);

        let buffer;
        if (options && (options.packname || options.author)) {
            buffer = await writeExifVid(buff, options);
        } else {
            buffer = await videoToWebp(buff);
        }

        await dino.sendMessage(jid, {
            sticker: { url: buffer }, 
            ...options }, { quoted });
        return buffer;
    };




dino.getFile = async (PATH, save = false) => {
  let res
  let data = Buffer.isBuffer(PATH)
    ? PATH
    : /^data:.*?\/.*?;base64,/i.test(PATH)
    ? Buffer.from(PATH.split(',')[1], 'base64')
    : /^https?:\/\//.test(PATH)
    ? await (res = await getBuffer(PATH))
    : fs.existsSync(PATH)
    ? fs.readFileSync(PATH)
    : typeof PATH === 'string'
    ? Buffer.from(PATH)
    : Buffer.alloc(0)

  let type = await FileType.fromBuffer(data) || {
    mime: 'application/octet-stream',
    ext: 'bin'
  }

  const sampahDir = path.join(__dirname, 'lib', 'sampah')

  if (!fs.existsSync(sampahDir)) {
    fs.mkdirSync(sampahDir, { recursive: true })
  }

  const filename = path.join(
    sampahDir,
    `${Date.now()}-${Math.floor(Math.random()*1000)}.${type.ext}`
  )

  if (save) {
    await fs.promises.writeFile(filename, data)
  }

  return {
    res,
    filename: save ? filename : null,
    size: data.length,
    ...type,
    data
  }
}


dino.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
  let type = await dino.getFile(path, true);
  let { res, data: file, filename: pathFile } = type;

  if (res && res.status !== 200 || file.length <= 65536) {
    try {
      throw {
        json: JSON.parse(file.toString())
      };
    } catch (e) {
      if (e.json) throw e.json;
    }
  }

  let opt = {
    filename
  };

  if (quoted) opt.quoted = quoted;
  if (!type) options.asDocument = true;

  let mtype = '',
    mimetype = type.mime,
    convert;

  if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker';
  else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image';
  else if (/video/.test(type.mime)) mtype = 'video';
  else if (/audio/.test(type.mime)) {
    convert = await (ptt ? toPTT : toAudio)(file, type.ext);
    file = convert.data;
    pathFile = convert.filename;
    mtype = 'audio';
    mimetype = 'audio/ogg; codecs=opus';
  } else mtype = 'document';

  if (options.asDocument) mtype = 'document';

  delete options.asSticker;
  delete options.asLocation;
  delete options.asVideo;
  delete options.asDocument;
  delete options.asImage;

  let message = { ...options, caption, ptt, [mtype]: { url: pathFile }, mimetype };
  let m;

  try {
    m = await dino.sendMessage(jid, message, { ...opt, ...options });
  } catch (e) {
    //console.error(e)
    m = null;
  } finally {
    if (!m) m = await dino.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options });
    file = null;
    return m;
  }
}


    dino.albumMessage = async (jid, array, quoted) => {
        const album = generateWAMessageFromContent(jid, {
            messageContextInfo: {
                messageSecret: crypto.randomBytes(32),
            },
            
            albumMessage: {
                expectedImageCount: array.filter((a) => a.hasOwnProperty("image")).length,
                expectedVideoCount: array.filter((a) => a.hasOwnProperty("video")).length,
            },
        }, {
            userJid: dino.user.jid,
            quoted,
            upload: dino.waUploadToServer
        });

        await dino.relayMessage(jid, album.message, {
            messageId: album.key.id,
        });

        for (let content of array) {
            const img = await generateWAMessage(jid, content, {
                upload: dino.waUploadToServer,
            });

            img.message.messageContextInfo = {
                messageSecret: crypto.randomBytes(32),
                messageAssociation: {
                    associationType: 1,
                    parentMessageKey: album.key,
                },    
                participant: "0@s.whatsapp.net",
                remoteJid: "status@broadcast",
                forwardingScore: 99999,
                isForwarded: true,
                mentionedJid: [jid],
                starred: true,
                labels: ["Y", "Important"],
                isHighlighted: true,
                businessMessageForwardInfo: {
                    businessOwnerJid: jid,
                },
                dataSharingContext: {
                    showMmDisclosure: true,
                },
            };

            img.message.forwardedNewsletterMessageInfo = {
                newsletterJid: "0@newsletter",
                serverMessageId: 1,
                newsletterName: `WhatsApp`,
                contentType: 1,
                timestamp: new Date().toISOString(),
                senderName: "✧ Dittsans",
                content: "Text Message",
                priority: "high",
                status: "sent",
            };

            img.message.disappearingMode = {
                initiator: 3,
                trigger: 4,
                initiatorDeviceJid: jid,
                initiatedByExternalService: true,
                initiatedByUserDevice: true,
                initiatedBySystem: true,
                initiatedByServer: true,
                initiatedByAdmin: true,
                initiatedByUser: true,
                initiatedByApp: true,
                initiatedByBot: true,
                initiatedByMe: true,
            };

            await dino.relayMessage(jid, img.message, {
                messageId: img.key.id,
                quoted: {
                    key: {
                        remoteJid: album.key.remoteJid,
                        id: album.key.id,
                        fromMe: true,
                        participant: dino.user.jid,
                    },
                    message: album.message,
                },
            });
        }
        return album;
    };
    
    
  dino.sendWithThumbnail = async (
    jid,
    {
        text = '',
        title = '',
        body = '',
        thumbnailUrl = '',
        sourceUrl = '',
        renderLargerThumbnail = true
    },
    quoted = {}
) => {

    return await dino.sendMessage(
        jid,
        {
            text,
            contextInfo: {
                externalAdReply: {
                    title,
                    body,
                    mediaType: 1,
                    renderLargerThumbnail,
                    thumbnailUrl,
                    sourceUrl
                }
            }
        }
    )
}  
    
    dino.sendStatusMention = async (content, jids = []) => {
        let users;
        for (let id of jids) {
            let userId = await dino.groupMetadata(id);
            users = await userId.participants.map(u => dino.decodeJid(u.id));
        };

        let message = await dino.sendMessage(
            "status@broadcast", content, {
                backgroundColor: "#000000",
                font: Math.floor(Math.random() * 9),
                statusJidList: users,
                additionalNodes: [
                    {
                        tag: "meta",
                        attrs: {},
                        content: [
                            {
                                tag: "mentioned_users",
                                attrs: {},
                                content: jids.map((jid) => ({
                                    tag: "to",
                                    attrs: { jid },
                                    content: undefined,
                                })),
                            },
                        ],
                    },
                ],
            }
        );

        jids.forEach(id => {
            dino.relayMessage(id, {
                groupStatusMentionMessage: {
                    message: {
                        protocolMessage: {
                            key: message.key,
                            type: 25,
                        },
                    },
                },
            },
            {
                userJid: dino.user.jid,
                additionalNodes: [
                    {
                        tag: "meta",
                        attrs: { is_status_mention: "true" },
                        content: undefined,
                    },
                ],
            });
            delay(2500);
        });
        return message;
    };
const getMentions = (text) => {
  if (!text.includes('@')) return []
  return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => `${v[1]}@s.whatsapp.net`)
}

dino.sendButtonImage = async (jid, text, buffer, buttons, quoted) => {
  const uploadFile = { upload: dino.waUploadToServer }

  const imageMessage = await prepareWAMessageMedia(
    { image: buffer },
    uploadFile
  )

  const message = generateWAMessageFromContent(
    jid,
    {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2
          },
          interactiveMessage: proto.Message.InteractiveMessage.create({
            contextInfo: {
              mentionedJid: getMentions(text)
            },
            body: proto.Message.InteractiveMessage.Body.create({ text }),
            footer: proto.Message.InteractiveMessage.Footer.create({ text: '𝗗𝗶𝗻𝗼 𝗕𝗼𝘁𝘇 𝗠𝗗' }),
            header: proto.Message.InteractiveMessage.Header.create({
              title: '',
              subtitle: 'Dino Official',
              imageMessage: imageMessage.imageMessage,
              hasMediaAttachment: true
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
              buttons
            })
          })
        }
      }
    },
    { quoted }
  )

  await dino.relayMessage(jid, message.message, { messageId: message.key.id })
  return message
}



dino.ev.on('creds.update', saveCreds)
dino.public = true
return dino;
}

dinostart();

/* ================= HOT RELOAD ================= */
let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(__filename + ' updated!')
    delete require.cache[file]
    require(file)
})