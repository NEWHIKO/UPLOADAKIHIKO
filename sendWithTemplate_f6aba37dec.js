const axios = require('axios')

// Load Baileys untuk prepareWAMessageMedia
const loadBaileys = require('./baileys')
let prepareWAMessageMedia
loadBaileys().then(B => {
  ({ prepareWAMessageMedia } = B)
}).catch(console.error)

/**
 * Extract channel ID dari WhatsApp channel link
 * @param {string} channelLink - Link channel (https://whatsapp.com/channel/XXXXX)
 * @param {Object} dino - WhatsApp connection object (optional, untuk fetch metadata)
 * @returns {Promise<string|null>} - Channel ID dalam format xxxxx@newsletter atau null
 */
async function extractChannelId(channelLink, dino = null) {
  if (!channelLink || typeof channelLink !== 'string') return null
  
  try {
    // Jika sudah dalam format xxxxx@newsletter, return as is
    if (channelLink.includes('@newsletter')) {
      return channelLink
    }
    
    // Extract invite code dari URL
    // Format: https://whatsapp.com/channel/0029VaqPkZ7ISTkQthJkuf1N
    // Ambil bagian terakhir setelah /channel/ lalu buang query/hash/slash sisa
    let inviteCode = channelLink.split('/channel/')[1]
    if (!inviteCode) {
      const match = channelLink.match(/whatsapp\.com\/channel\/([A-Za-z0-9_-]+)/i)
      inviteCode = match && match[1] ? match[1] : null
    }
    if (inviteCode) {
      // Bersihkan sisa path/query/hash
      inviteCode = inviteCode.split('/')[0].split('?')[0].split('#')[0].trim()
    }
    if (!inviteCode) return null
    
    // WAJIB pakai newsletterMetadata untuk dapat ID channel yang AKURAT.
    // Tidak ada cara valid untuk mengubah invite code -> newsletter ID secara offline,
    // jadi jangan buat ID palsu. Kalau gagal, kembalikan null.
    if (dino && typeof dino.newsletterMetadata === 'function') {
      try {
        const metadata = await dino.newsletterMetadata("invite", inviteCode)
        if (metadata && metadata.id) {
          return metadata.id // Sudah dalam format xxxxx@newsletter
        }
      } catch (e) {
        console.warn('[extractChannelId] newsletterMetadata failed:', e.message)
      }
    } else {
      console.warn('[extractChannelId] dino.newsletterMetadata tidak tersedia, tidak bisa resolve channel ID')
    }
    
    return null
  } catch (e) {
    console.error('[extractChannelId] error:', e.message)
    return null
  }
}

/**
 * Extract channel ID synchronously (tanpa fetch metadata).
 * CATATAN: Tanpa newsletterMetadata, invite code TIDAK bisa dikonversi ke
 * newsletter ID yang benar. Fungsi ini hanya passthrough kalau input sudah
 * dalam format xxxxx@newsletter. Selain itu kembalikan null.
 * @param {string} channelLink - Link channel atau ID @newsletter
 * @returns {string|null} - Channel ID atau null
 */
function extractChannelIdSync(channelLink) {
  if (!channelLink || typeof channelLink !== 'string') return null
  
  // Hanya valid jika sudah dalam format xxxxx@newsletter
  if (channelLink.includes('@newsletter')) {
    return channelLink
  }
  
  return null
}

/**
 * Fetch thumbnail buffer dari URL
 */
async function fetchThumbBuffer(url) {
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    return Buffer.from(res.data)
  } catch (e) {
    console.error('[fetchThumbBuffer] error:', e.message)
    return null
  }
}

/**
 * Get JPEG image size dari buffer
 */
function getJpegSize(buf) {
  if (!buf || buf.length < 10) return { width: 0, height: 0 }
  
  let i = 0
  if (buf[i++] !== 0xff || buf[i++] !== 0xd8) return { width: 0, height: 0 }

  while (i < buf.length - 8) {
    if (buf[i] !== 0xff) break
    const marker = buf[i + 1]
    const len = buf.readUInt16BE(i + 2)

    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    ) {
      return {
        height: buf.readUInt16BE(i + 5),
        width: buf.readUInt16BE(i + 7)
      }
    }
    i += 2 + len
  }
  return { width: 0, height: 0 }
}

/**
 * Upload thumbnail ke WA server
 */
async function uploadThumbnailToWA(conn, thumbBuf) {
  try {
    if (!prepareWAMessageMedia) {
      console.warn('[uploadThumbnailToWA] prepareWAMessageMedia not loaded yet')
      return null
    }
    
    const result = await prepareWAMessageMedia(
      { image: thumbBuf },
      { upload: conn.waUploadToServer, mediaTypeOverride: 'thumbnail-link' }
    )
    return result?.imageMessage || null
  } catch (e) {
    console.error('[uploadThumbnailToWA] error:', e.message)
    return null
  }
}

/**
 * Send message dengan template (thumbnail + channel atau hanya channel)
 * 
 * @param {Object} dino - WhatsApp connection object
 * @param {Object} m - Message object
 * @param {string} text - Text content to send
 * @param {Object} options - Additional options
 * @param {boolean} options.react - Show react emoji (default: true)
 * @param {string} options.reactStart - React emoji saat mulai (default: '⏱️')
 * @param {string} options.reactDone - React emoji saat selesai (default: '✅')
 * @param {Array} options.mentions - Array of JID to mention
 * @param {boolean} options.useThumbnail - Override config useThumbnail
 * @param {boolean} options.useChannel - Override config useChannel
 */
async function sendWithTemplate(dino, m, text, options = {}) {
  const {
    react = true,
    reactStart = '⏱️',
    reactDone = '✅',
    mentions = [],
    useThumbnail = null,
    useChannel = null
  } = options

  // React start
  if (react) {
    try {
      await dino.sendMessage(m.chat, { react: { text: reactStart, key: m.key } })
    } catch (e) {
      console.error('[sendWithTemplate] react start error:', e.message)
    }
  }

  // Load config dengan prioritas: options > dino.config > global
  const shouldUseThumbnail = useThumbnail !== null ? useThumbnail : (dino.config?.useThumbnail ?? global.useThumbnail ?? true)
  const shouldUseChannel = useChannel !== null ? useChannel : (dino.config?.useChannel ?? global.useChannel ?? true)
  
  const menuimg = dino.config?.menuimg || global.menuimg
  const namach = dino.config?.namach || global.namach
  const ch = dino.config?.ch || global.ch
  const idch = dino.config?.idch || global.idch
  const foother = dino.config?.foother || global.foother
  const namabot = dino.config?.namabot || global.namabot

  // Jika tidak pakai thumbnail dan tidak pakai channel, kirim text biasa
  if (!shouldUseThumbnail && !shouldUseChannel) {
    await dino.sendMessage(m.chat, { 
      text,
      mentions: mentions.length > 0 ? mentions : undefined
    })
    
    if (react) {
      try {
        await dino.sendMessage(m.chat, { react: { text: reactDone, key: m.key } })
      } catch (e) {
        console.error('[sendWithTemplate] react done error:', e.message)
      }
    }
    return
  }

  // Prepare thumbnail (jika diaktifkan)
  let thumbBuffer = null
  let imgMsg = null
  let thumbW = 1280
  let thumbH = 720

  if (shouldUseThumbnail && menuimg) {
    thumbBuffer = await fetchThumbBuffer(menuimg)
    
    if (thumbBuffer) {
      const size = getJpegSize(thumbBuffer)
      thumbW = size.width || thumbW
      thumbH = size.height || thumbH
      imgMsg = await uploadThumbnailToWA(dino, thumbBuffer)
    }
  }

  // Build extended text message
  const ext = {
    text: shouldUseThumbnail && menuimg ? `${menuimg}\n${text}` : text,
    contextInfo: {
      mentionedJid: mentions.length > 0 ? mentions : [m.sender],
      forwardingScore: 999,
      isForwarded: true
    }
  }

  // Add channel info jika diaktifkan
  if (shouldUseChannel && idch && namach) {
    ext.contextInfo.forwardedNewsletterMessageInfo = {
      newsletterJid: idch,
      newsletterName: namach,
      serverMessageId: 143
    }
  }

  // Add thumbnail info jika ada
  if (shouldUseThumbnail && menuimg) {
    ext.matchedText = menuimg
    ext.description = foother
    ext.title = namabot
    ext.previewType = 0
    ext.inviteLinkGroupTypeV2 = 0
    ext.endCardTiles = []

    if (imgMsg) {
      ext.jpegThumbnail = imgMsg.jpegThumbnail
      ext.thumbnailDirectPath = imgMsg.directPath
      ext.mediaKey = imgMsg.mediaKey
      ext.mediaKeyTimestamp = imgMsg.mediaKeyTimestamp
      ext.thumbnailSha256 = imgMsg.fileSha256
      ext.thumbnailEncSha256 = imgMsg.fileEncSha256
      ext.thumbnailWidth = imgMsg.width || thumbW
      ext.thumbnailHeight = imgMsg.height || thumbH
    } else if (thumbBuffer) {
      ext.jpegThumbnail = thumbBuffer.toString('base64')
      ext.thumbnailWidth = thumbW
      ext.thumbnailHeight = thumbH
    }
  }

  // Send message
  try {
    await dino.relayMessage(
      m.chat,
      { extendedTextMessage: ext },
      {
        useUserDevicesCache: false,
        useCachedGroupMetadata: false
      }
    )
  } catch (e) {
    console.error('[sendWithTemplate] relayMessage error:', e.message)
    // Fallback ke text biasa jika gagal
    await dino.sendMessage(m.chat, { 
      text,
      mentions: mentions.length > 0 ? mentions : undefined
    })
  }

  // React done
  if (react) {
    try {
      await dino.sendMessage(m.chat, { react: { text: reactDone, key: m.key } })
    } catch (e) {
      console.error('[sendWithTemplate] react done error:', e.message)
    }
  }
}

/**
 * Send message tanpa template (text biasa dengan mention)
 */
async function sendText(dino, m, text, mentions = []) {
  await dino.sendMessage(m.chat, { 
    text,
    mentions: mentions.length > 0 ? mentions : undefined
  })
}

/**
 * Wrapper function yang kompatibel dengan format menu.js
 * Ini untuk backward compatibility
 */
async function sendMenuTemplate(dino, m, caption, ctx = {}) {
  return await sendWithTemplate(dino, m, caption, {
    react: true,
    reactStart: '⏱️',
    reactDone: '✅',
    mentions: [m.sender]
  })
}

module.exports = {
  sendWithTemplate,
  sendText,
  sendMenuTemplate,
  extractChannelId,
  extractChannelIdSync,
  fetchThumbBuffer,
  getJpegSize,
  uploadThumbnailToWA
}
