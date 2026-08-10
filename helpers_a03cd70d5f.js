const fs = require('fs')
const path = require('path')
const { Sticker, StickerTypes } = require('wa-sticker-formatter')
const { createCanvas, loadImage, registerFont } = require('canvas')

const { 
  tiktokSearchVideo, tiktokDownloaderVideo, tiktokDownloaderAudio, tiktokdl,
  igDownload, capcutDownload, pinterest, pinterest2, remini, mediafire,
  toAudio, toPTT, toVideo, getLyrics, DinosaurusHD, Igstory, SaveTube,
  animeScrape, stalkInstagram, stalkTiktok, stalkRoblox, stickerlySearch, stickerlyDownload, translate, removeBackground
} = require("./scrapers")

const { unixTimestampSeconds, generateMessageTag, processTime, webApi, getBuffer, fetchJson, runtime, clockString, sleep, isUrl, getTime, formatDate, tanggal, formatp, jsonformat, reSize, toHD, logic, generateProfilePicture, bytesToSize, checkBandwidth, getSizeMedia, parseMention, getGroupAdmins, readFileTxt, readFileJson, getHashedPassword, generateAuthToken, cekMenfes, generateToken, batasiTeks, randomText, isEmoji, getTypeUrlMedia, pickRandom, toIDR, capital, ucapanWaktu, getWIBTime, getWIBDayPasaran, toMs, msToTime, getWIBDateTime, react, getRandom, resolveTarget, delay, drawCircularTextTop } = require('./function.js');

const getMime = (m) => {
  return m.mime || m.quoted?.mimetype || ''
}

const getMedia = async (m, type) => {
  const mime = getMime(m)
  if (!mime.includes(type)) return null

  try {
    const media = m.quoted 
      ? await m.quoted.download() 
      : await m.download()

    return media || null
  } catch (e) {
    console.error('[getMedia ERROR]', e)
    return null
  }
}

const getImage = (m) => getMedia(m, 'image')
const getVideo = (m) => getMedia(m, 'video')
const getAudio = (m) => getMedia(m, 'audio')

const lidToJid = (groupMetadata, lid) => {
  const user = groupMetadata?.participants?.find(p => p.lid === lid)
  return user?.jid || lid
}

const getTarget = async (dino, m, q, pushname) => {
  let user = m.mentionedJid?.[0] || m.sender
  let name = m.mentionedJid?.[0] 
    ? await dino.getName(user) 
    : (q || pushname)
  return { user, name }
}

const DinosaurusFitur = () => {
  try {
    const fiturDir = path.join(__dirname, 'fitur')
    if (!fs.existsSync(fiturDir)) return 0

    const files = fs.readdirSync(fiturDir).filter(f => f.endsWith('.js'))

    let total = 0
    for (const file of files) {
      const filePath = path.join(fiturDir, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const matches = content.match(/case\s+['"`][\w-]+['"`]\s*:/g) || []
      total += matches.length
    }

    return total
  } catch (err) {
    console.error('[DINOSAURUS FITUR ERROR]', err.message)
    return 0
  }
}


module.exports = {
  // Scrapers
  tiktokSearchVideo, tiktokDownloaderVideo, tiktokDownloaderAudio, tiktokdl,
  igDownload, capcutDownload, pinterest, pinterest2, remini, mediafire,
  toAudio, toPTT, toVideo, getLyrics, DinosaurusHD, Igstory, SaveTube,
  animeScrape, stalkInstagram, stalkTiktok, stalkRoblox, stickerlySearch, stickerlyDownload, translate, removeBackground,
  
  // Function
  unixTimestampSeconds, generateMessageTag, processTime, webApi, getBuffer, fetchJson, runtime, clockString, sleep, isUrl, getTime, formatDate, tanggal, formatp, jsonformat, reSize, toHD, logic, generateProfilePicture, bytesToSize, checkBandwidth, getSizeMedia, parseMention, getGroupAdmins, readFileTxt, readFileJson, getHashedPassword, generateAuthToken, cekMenfes, generateToken, batasiTeks, randomText, isEmoji, getTypeUrlMedia, pickRandom, toIDR, capital, ucapanWaktu, getWIBTime, getWIBDayPasaran, toMs, msToTime, getWIBDateTime, react, getRandom, resolveTarget, delay, drawCircularTextTop,
  
  // Helpers
  getMime, getMedia, getImage, getVideo, getAudio, lidToJid, getTarget, DinosaurusFitur, Sticker, StickerTypes, createCanvas, loadImage, registerFont
}