const lastTrigger = {}

function normalize(jid) {
    return jid.replace(/@lid$/, "@s.whatsapp.net")
}

function getTriggerKey(jid, group) {
    return `${normalize(jid)}_${group}`
}

function lidToJid(lid, metadata) {
    if (!lid.endsWith("@lid")) return lid
    const user = lid.split("@")[0]
    const target = metadata?.participants?.find(p => p.lid?.startsWith(user))
    return target?.jid || lid.replace(/@lid$/, "@s.whatsapp.net")
}

function setAFK(jid, group, reason) {
    jid = normalize(jid)
    if (!global.db.groups[group]) return
    if (!global.db.groups[group].afk) global.db.groups[group].afk = {}
    global.db.groups[group].afk[jid] = { time: Date.now(), reason }
    if (global.saveDB) global.saveDB(global.db)
}

function getAFK(jid, group) {
    jid = normalize(jid)
    return global.db.groups[group]?.afk?.[jid] || null
}

function removeAFK(jid, group) {
    jid = normalize(jid)
    if (global.db.groups[group]?.afk) {
        delete global.db.groups[group].afk[jid]
        if (global.saveDB) global.saveDB(global.db)
    }
}

function clockString(ms) {
    const h = Math.floor(ms / 3600000)
    const m = Math.floor(ms / 60000) % 60
    const s = Math.floor(ms / 1000) % 60
    if (h > 0) return `${h} jam ${m} menit`
    if (m > 0) return `${m} menit ${s} detik`
    return `${s} detik`
}

async function onMessage(dino, m) {
    try {
        if (!m.message) return
        if (m.key.fromMe) return
        if (!m.isGroup) return

        const sender = normalize(m.sender)
        const group  = m.chat
        const now    = Date.now()

        if (!global.db.groups[group]) return
        if (!global.db.groups[group].afk) global.db.groups[group].afk = {}

        // ─── CEK SELF AFK ────────────────────────────────
        const selfAFK = getAFK(sender, group)
        if (selfAFK) {
            const key = getTriggerKey(sender, group)
            if (lastTrigger[key] && now - lastTrigger[key] < 5000) return
            lastTrigger[key] = now

            const selama = clockString(now - selfAFK.time)
            removeAFK(sender, group)

            await dino.sendMessage(group, {
                text:
`╭━━━『 👋 𝗪𝗲𝗹𝗰𝗼𝗺𝗲 𝗕𝗮𝗰𝗸 』━━━╮
┃
┃  *@${sender.split('@')[0]} sudah kembali!*
┃
┃  *⏱️ Durasi AFK : ${selama}*
┃  *💬 Alasan     : ${selfAFK.reason || 'Tanpa alasan'}*
┃
╰━━━━━━━━━━━━━━━━━━━━━╯`,
                mentions: [sender]
            })
        }

        // ─── CEK MENTIONED ───────────────────────────────
        const rawMention = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
        const quoted     = m.quoted?.sender ? [m.quoted.sender] : []
        const text       = m.message?.conversation ||
                           m.message?.extendedTextMessage?.text ||
                           m.message?.imageMessage?.caption ||
                           m.message?.videoMessage?.caption || ""

        const textMention = (text.match(/@(\d{5,16})/g) || [])
            .map(v => v.replace("@", "") + "@s.whatsapp.net")

        let mentioned = [...rawMention, ...textMention, ...quoted]

        // ─── PAKAI CACHE, TIDAK FETCH ULANG ──────────────
        if (mentioned.some(j => j.endsWith('@lid'))) {
            const metadata = global.groupCache?.get(group) || null
            if (metadata) {
                mentioned = mentioned.map(jid => lidToJid(jid, metadata))
            }
        }

        mentioned = [...new Set(mentioned.map(j => normalize(j)))]

        for (const jid of mentioned) {
            const targetAFK = getAFK(jid, group)
            if (!targetAFK) continue

            const key = getTriggerKey(jid, group)
            if (lastTrigger[key] && now - lastTrigger[key] < 5000) continue
            lastTrigger[key] = now

            const selama = clockString(now - targetAFK.time)

            await dino.sendMessage(group, {
                text:
`╭━━━『 🚫 𝗦𝗲𝗱𝗮𝗻𝗴 𝗔𝗙𝗞 』━━━╮
┃
┃  @${jid.split('@')[0]} sedang AFK!
┃
┃  💬 Alasan  : ${targetAFK.reason || 'Tanpa alasan'}
┃  ⏱️ Selama  : ${selama}
┃
┃  Tunggu dia kembali ya! 👾
┃
╰━━━━━━━━━━━━━━━━━━━━━╯`,
                mentions: [jid]
            })
        }

    } catch (e) {
        console.log("AFK Error:", e.message)
    }
}

module.exports = { setAFK, getAFK, removeAFK, onMessage }