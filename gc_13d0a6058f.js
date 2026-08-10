require("./config");
require("./lib/groupMetaHelper"); // Load group metadata helper
const fs = require("fs");

// WA_DEFAULT_EPHEMERAL = 86400 detik (24 jam) — nilai konstanta dari baileys
const WA_DEFAULT_EPHEMERAL = 86400;

const { getGroup } = require("./lib/userHelper");
const { createCanvas, loadImage } = require('canvas')
const { fetchThumbBuffer, uploadThumbnailToWA, getJpegSize } = require('./lib/sendWithTemplate')

const delay = ms => new Promise(res => setTimeout(res, ms));

async function makeCanvas(dino, user, bgUrl, _unused1 = '', _unused2 = '', type = 'welcome') {
    // Load background
    let bg
    try {
        const axios = require('axios')
        const res = await axios.get(bgUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
        })
        if (!res.data || res.data.byteLength < 1000) return null
        bg = await loadImage(Buffer.from(res.data))
    } catch {
        return null
    }

    // Load profile picture
    let pp
    try {
        const ppUrl = await dino.profilePictureUrl(user, 'image')
        pp = await loadImage(ppUrl)
    } catch {
        try {
            pp = await loadImage('https://raw.githubusercontent.com/dinosaurusxoffc/image/main/pp-kosong.jpg')
        } catch {
            pp = null
        }
    }

    try {
        const W = 820, H = 420
        const canvas = createCanvas(W, H)
        const ctx = canvas.getContext('2d')

        // ── Background penuh ──────────────────────────────────────────────
        ctx.drawImage(bg, 0, 0, W, H)

        // ── Helper: path rounded rect ─────────────────────────────────────
        const roundRect = (x, y, w, h, rad) => {
            ctx.beginPath()
            ctx.moveTo(x + rad, y)
            ctx.lineTo(x + w - rad, y)
            ctx.quadraticCurveTo(x + w, y, x + w, y + rad)
            ctx.lineTo(x + w, y + h - rad)
            ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h)
            ctx.lineTo(x + rad, y + h)
            ctx.quadraticCurveTo(x, y + h, x, y + h - rad)
            ctx.lineTo(x, y + rad)
            ctx.quadraticCurveTo(x, y, x + rad, y)
            ctx.closePath()
        }

        const pad = 40, r = 28
        const rx = pad, ry = pad, rw = W - pad * 2, rh = H - pad * 2

        // ── PANEL GLASSMORPHISM 3D ────────────────────────────────────────

        // 0. Outer glow / ambient shadow — kesan panel melayang di atas bg
        ctx.save()
        ctx.shadowColor = 'rgba(0,0,0,0.25)'
        ctx.shadowBlur = 20
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 6
        roundRect(rx, ry, rw, rh, r)
        ctx.fillStyle = 'rgba(0,0,0,0.01)'
        ctx.fill()
        ctx.restore()

        // 1. Base glass — sangat tipis, hampir invisible
        roundRect(rx, ry, rw, rh, r)
        ctx.fillStyle = 'rgba(15,15,25,0.04)'
        ctx.fill()

        // 2. Clip ke dalam panel untuk semua efek internal
        ctx.save()
        roundRect(rx, ry, rw, rh, r)
        ctx.clip()

        // 2a. Specular highlight atas — sangat tipis
        const hlTop = ctx.createLinearGradient(0, ry, 0, ry + rh * 0.18)
        hlTop.addColorStop(0, 'rgba(255,255,255,0.04)')
        hlTop.addColorStop(1, 'rgba(255,255,255,0.00)')
        ctx.fillStyle = hlTop
        ctx.fillRect(rx, ry, rw, rh * 0.18)

        // 2b. Specular highlight kiri — sangat tipis
        const hlLeft = ctx.createLinearGradient(rx, 0, rx + rw * 0.08, 0)
        hlLeft.addColorStop(0, 'rgba(255,255,255,0.02)')
        hlLeft.addColorStop(1, 'rgba(255,255,255,0.00)')
        ctx.fillStyle = hlLeft
        ctx.fillRect(rx, ry, rw * 0.08, rh)

        // 2c. Bottom edge darkening — hampir hilang
        const shBottom = ctx.createLinearGradient(0, ry + rh * 0.75, 0, ry + rh)
        shBottom.addColorStop(0, 'rgba(0,0,0,0.00)')
        shBottom.addColorStop(1, 'rgba(0,0,0,0.05)')
        ctx.fillStyle = shBottom
        ctx.fillRect(rx, ry + rh * 0.75, rw, rh * 0.25)

        // 2d. Right edge darkening — hampir hilang
        const shRight = ctx.createLinearGradient(rx + rw * 0.80, 0, rx + rw, 0)
        shRight.addColorStop(0, 'rgba(0,0,0,0.00)')
        shRight.addColorStop(1, 'rgba(0,0,0,0.04)')
        ctx.fillStyle = shRight
        ctx.fillRect(rx + rw * 0.80, ry, rw * 0.20, rh)

        ctx.restore()

        // 3a. Border terang (atas & kiri) — highlight edge → kesan raised/emboss
        ctx.save()
        roundRect(rx + 0.6, ry + 0.6, rw - 1.2, rh - 1.2, r - 0.6)
        ctx.strokeStyle = 'rgba(255,255,255,0.28)'
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.restore()

        // 3b. Border gelap (bawah & kanan) — shadow edge
        ctx.save()
        roundRect(rx + 1.5, ry + 1.5, rw - 3, rh - 3, r - 1)
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.restore()

        // 4. Inset shadow bawah — efek panel seperti "tebal"
        ctx.save()
        roundRect(rx, ry, rw, rh, r)
        ctx.clip()
        const insetShadow = ctx.createLinearGradient(0, ry + rh - 30, 0, ry + rh)
        insetShadow.addColorStop(0, 'rgba(0,0,0,0.00)')
        insetShadow.addColorStop(1, 'rgba(0,0,0,0.05)')
        ctx.fillStyle = insetShadow
        ctx.fillRect(rx, ry + rh - 30, rw, 30)
        ctx.restore()

        // ── PP bulat di tengah — sedikit di atas center ───────────────────
        const ppSize = 200
        const ppCX = W / 2
        const ppCY = H / 2 - 30

        if (pp) {
            ctx.save()
            ctx.beginPath()
            ctx.arc(ppCX, ppCY, ppSize / 2, 0, Math.PI * 2)
            ctx.closePath()
            ctx.clip()
            ctx.drawImage(pp, ppCX - ppSize / 2, ppCY - ppSize / 2, ppSize, ppSize)
            ctx.restore()
        }

        // ── Teks "Welcome" / "Goodbye" ────────────────────────────────────
        const label = type === 'welcome' ? 'Welcome' : 'Goodbye'
        const textY = ppCY + ppSize / 2 + 58

        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = 'rgba(0,0,0,0.85)'
        ctx.shadowBlur = 14
        ctx.shadowOffsetY = 2
        ctx.font = '72px "SF-Bold"'
        ctx.fillStyle = '#ffffff'
        ctx.fillText(label, W / 2, textY)
        ctx.shadowBlur = 0

        const buf = canvas.toBuffer('image/png')
        if (!buf || buf.byteLength < 500) return null
        return buf
    } catch {
        return null
    }
}

/**
 * Kirim pesan welcome/goodbye sebagai extendedTextMessage.
 * - matchedText = bgUrl (URL background) → trigger WA buat render preview
 * - jpegThumbnail / mediaKey = hasil upload canvas buffer → gambar yang muncul sebagai thumbnail
 * - Thumbnail selalu aktif (forced). Channel ikut config bot.
 *
 * @param {Object}      dino       - WA connection
 * @param {string}      chatId     - Group JID
 * @param {string}      text       - Teks pesan
 * @param {Array}       mentions   - Array JID yang di-mention
 * @param {string}      bgUrl      - URL background (jadi matchedText)
 * @param {Buffer|null} canvasBuf  - Buffer hasil canvas (PP + background) — jadi thumbnail
 */
async function _sendWelcomeGoodbye(dino, chatId, text, mentions, bgUrl, canvasBuf) {
    const namach  = dino.config?.namach  || global.namach
    const idch    = dino.config?.idch    || global.idch
    const foother = dino.config?.foother || global.foother
    const namabot = dino.config?.namabot || global.namabot

    // Channel: ikut config bot — user grup tidak bisa toggle ini
    const shouldUseChannel = dino.config?.useChannel ?? global.useChannel ?? true

    // Upload canvas buffer sebagai thumbnail ke WA server
    let imgMsg = null
    let thumbW = 820
    let thumbH = 420

    if (canvasBuf) {
        imgMsg = await uploadThumbnailToWA(dino, canvasBuf).catch(() => null)
        // canvas ukuran 820x420 — hardcode karena getJpegSize ga baca PNG
        thumbW = 820
        thumbH = 420
    }

    // Build extendedTextMessage
    // matchedText = bgUrl → wajib ada biar WA mau render thumbnail
    // thumbnail data → dari canvas upload (bukan dari bgUrl)
    const ext = {
        text: `${bgUrl}\n${text}`,
        matchedText: bgUrl,
        description: foother,
        title: namabot,
        previewType: 0,
        inviteLinkGroupTypeV2: 0,
        endCardTiles: [],
        contextInfo: {
            mentionedJid: mentions,
            forwardingScore: 999,
            isForwarded: true
        }
    }

    // Isi thumbnail dari hasil upload canvas
    if (imgMsg) {
        ext.jpegThumbnail       = imgMsg.jpegThumbnail
        ext.thumbnailDirectPath = imgMsg.directPath
        ext.mediaKey            = imgMsg.mediaKey
        ext.mediaKeyTimestamp   = imgMsg.mediaKeyTimestamp
        ext.thumbnailSha256     = imgMsg.fileSha256
        ext.thumbnailEncSha256  = imgMsg.fileEncSha256
        ext.thumbnailWidth      = imgMsg.width  || thumbW
        ext.thumbnailHeight     = imgMsg.height || thumbH
    } else if (canvasBuf) {
        // Fallback: upload gagal, kirim jpegThumbnail base64 langsung
        ext.jpegThumbnail   = canvasBuf.toString('base64')
        ext.thumbnailWidth  = thumbW
        ext.thumbnailHeight = thumbH
    }

    // Channel forward info
    if (shouldUseChannel && idch && namach) {
        ext.contextInfo.forwardedNewsletterMessageInfo = {
            newsletterJid: idch,
            newsletterName: namach,
            serverMessageId: 143
        }
    }

    try {
        await dino.relayMessage(
            chatId,
            { extendedTextMessage: ext },
            { useUserDevicesCache: false, useCachedGroupMetadata: false }
        )
    } catch (e) {
        console.error('[_sendWelcomeGoodbye] relayMessage error:', e.message)
        await dino.sendMessage(chatId, {
            text,
            contextInfo: { mentionedJid: mentions }
        }, { ephemeralExpiration: WA_DEFAULT_EPHEMERAL }).catch(() => {})
    }
}

async function GroupParticipants(dino, event) {
    const { id, participants, action, author } = event; 

    try {     
        let gcdata;
        try {
            gcdata = await global.getGroupMetaSafe(dino, id);
        } catch {
            gcdata = { subject: "Group", desc: "" };
        }
        const subject = gcdata.subject;
        const desc = gcdata.desc || "";

        // ── Ambil data grup dari global.db via userHelper ──
        const groupData = getGroup(id);

        const mentions = participants;
        const names = participants.map(jid => `@${jid.split("@")[0]}`).join(", ");

        const _replaceVars = (tpl) => tpl
            .replace(/@(user|tag|member)\b/gi, names)
            .replace(/@(group|grup|gc|gb)\b/gi, subject)
            .replace(/@(desc|desk|deskripsi)\b/gi, desc)

        switch (action) {
            // ── WELCOME ──────────────────────────────────────────────────
            case "add": {
                if (!groupData.welcome) break;

                await delay(3000);

                const _defaultWelcomeTpl = (dino.config?.defaultWelcomeText ?? global.defaultWelcomeText)
                    || `𝗛𝗮𝗶 @user 👋\n𝗦𝗲𝗹𝗮𝗺𝗮𝘁 𝗱𝗮𝘁𝗮𝗻𝗴 𝗱𝗶 *@group*!\n\n> > 𝗷𝗶𝗸𝗮 𝗶𝗻𝗴𝗶𝗻 𝗺𝗲𝗻𝗴𝗮𝘁𝘂𝗿 𝘁𝗲𝗸𝘀 𝘄𝗲𝗹𝗰𝗼𝗺𝗲 𝘀𝗶𝗹𝗮𝗵𝗸𝗮𝗻 𝗶𝗻𝗽𝘂𝘁 𝗰𝗼𝗺𝗺𝗮𝗻𝗱 \`.𝘀𝗲𝘁𝘄𝗲𝗹𝗰𝗼𝗺𝗲\``

                const captionText = groupData.welcomeText
                    ? _replaceVars(groupData.welcomeText)
                    : _replaceVars(_defaultWelcomeTpl)

                const _welcomeBgUrl = groupData.welcomeBgUrl
                    || "https://raw.githubusercontent.com/dinosaurusxoffc/image/main/background-welcome.jpg"

                // Ambil nama user dari WA
                let _welcomeUserName = ''
                try { _welcomeUserName = await dino.getName(participants[0]) || '' } catch {}

                // Render canvas dengan teks nama + grup
                const _welcomeCanvas = await makeCanvas(dino, participants[0], _welcomeBgUrl, _welcomeUserName, subject, 'welcome').catch(() => null)

                // matchedText = bgUrl, thumbnail = canvas buffer
                await _sendWelcomeGoodbye(dino, id, captionText, mentions, _welcomeBgUrl, _welcomeCanvas)
                break;
            }

            // ── GOODBYE ──────────────────────────────────────────────────
            case "remove": {
                if (!groupData.goodbye) break;

                await delay(3000);

                const _defaultGoodbyeTpl = (dino.config?.defaultGoodbyeText ?? global.defaultGoodbyeText)
                    || `𝗦𝗲𝗹𝗮𝗺𝗮𝘁 𝗧𝗶𝗻𝗴𝗴𝗮𝗹 @user 👋\n𝗧𝗲𝗿𝗶𝗺𝗮 𝗸𝗮𝘀𝗶𝗵 𝘀𝘂𝗱𝗮𝗵 𝗺𝗲𝗻𝗷𝗮𝗱𝗶 𝗯𝗮𝗴𝗶𝗮𝗻 𝗱𝗮𝗿𝗶 𝗗𝗶𝗻𝗼 𝗕𝗼𝘁𝘇 🌸`

                const byeText = groupData.byeText
                    ? _replaceVars(groupData.byeText)
                    : _replaceVars(_defaultGoodbyeTpl)

                const _goodbyeBgUrl = groupData.goodbyeBgUrl
                    || "https://raw.githubusercontent.com/dinosaurusxoffc/image/main/background-goodbye.jpg"

                // Ambil nama user dari WA
                let _goodbyeUserName = ''
                try { _goodbyeUserName = await dino.getName(participants[0]) || '' } catch {}

                // Render canvas dengan teks nama + grup
                const _goodbyeCanvas = await makeCanvas(dino, participants[0], _goodbyeBgUrl, _goodbyeUserName, subject, 'goodbye').catch(() => null)

                // matchedText = bgUrl, thumbnail = canvas buffer
                await _sendWelcomeGoodbye(dino, id, byeText, mentions, _goodbyeBgUrl, _goodbyeCanvas)
                break;
            }

            case "promote":
                await delay(3000);
                if (author) {
                    await dino.sendMessage(id, {
                        text: `⬣────▣ 𝗡𝗼𝘁𝗶𝗳𝗶𝗰𝗮𝘁𝗶𝗼𝗻 - 𝗚𝗿𝗼𝘂𝗽 ▣────⬣\n🥳 *@${author.split("@")[0]}* 𝘁𝗲𝗹𝗮𝗵 𝗺𝗲𝗻𝗮𝗶𝗸𝗸𝗮𝗻\n*${names}* 𝗺𝗲𝗻𝗷𝗮𝗱𝗶 𝗮𝗱𝗺𝗶𝗻👑`,
                        contextInfo: { mentionedJid: [author, ...participants] }
                    });
                }
                break;

            case "demote":
                await delay(3000);
                if (author) {
                    await dino.sendMessage(id, {
                        text: `⬣────▣ 𝗡𝗼𝘁𝗶𝗳𝗶𝗰𝗮𝘁𝗶𝗼𝗻 - 𝗚𝗿𝗼𝘂𝗽 ▣────⬣\n🤧 *@${author.split("@")[0]}* 𝘁𝗲𝗹𝗮𝗵 𝗺𝗲𝗻𝘂𝗿𝘂𝗻𝗸𝗮𝗻\n*${names}* 𝗱𝗮𝗿𝗶 𝗮𝗱𝗺𝗶𝗻`,
                        contextInfo: { mentionedJid: [author, ...participants] }
                    });
                }
                break;
        }

    } catch (err) {
        console.error("GroupParticipants Error:", err);
    }
}

module.exports = GroupParticipants;