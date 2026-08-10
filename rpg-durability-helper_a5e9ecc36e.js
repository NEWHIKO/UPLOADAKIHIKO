// Tier durability maxima — used by all files
const TIER_DUR_MAX = { 1: 100, 2: 200, 3: 400, 4: 700, 5: 1000 }

/**
 * Terapkan kerusakan durability ke sebuah tool.
 * Jika durability habis → tier TURUN 1, durability di-reset ke max tier baru.
 * Jika sudah tier 1 dan habis → tool hilang (tier = 0, dur = 0).
 *
 * @param {object} user        - user object dari db
 * @param {string} toolKey     - e.g. 'sword', 'pickaxe', 'armor', 'fishingrod', 'axe'
 * @param {number} loss        - jumlah durability yang dikurangi
 * @returns {{ tierDropped: boolean, tierGone: boolean, newTier: number, newDur: number, msg: string }}
 */
function applyDurabilityLoss(user, toolKey, loss) {
    const durKey = `${toolKey}durability`

    user[toolKey]  = user[toolKey]  || 0
    user[durKey]   = user[durKey]   || 0

    if (user[toolKey] === 0) return { tierDropped: false, tierGone: false, newTier: 0, newDur: 0, msg: '' }

    user[durKey] = Math.max(0, user[durKey] - loss)

    let tierDropped = false
    let tierGone    = false

    if (user[durKey] <= 0) {
        const prevTier = user[toolKey]
        user[toolKey] = Math.max(0, prevTier - 1)

        if (user[toolKey] === 0) {
            // Tier 1 habis → tool hilang
            user[durKey] = 0
            tierGone = true
        } else {
            // Tier turun, reset durability ke max tier baru
            user[durKey] = TIER_DUR_MAX[user[toolKey]] || 100
            tierDropped = true
        }
    }

    const toolNames = {
        sword:      ['','🪵 Wooden','🪨 Stone','⚪ Iron','💎 Diamond','🔥 Netherite'],
        pickaxe:    ['','🪵 Wooden','🪨 Stone','⚪ Iron','💎 Diamond','🔥 Netherite'],
        fishingrod: ['','🪵 Wooden','⚪ Iron','💎 Diamond','🔥 Netherite'],
        armor:      ['','🟤 Leather','⚪ Iron','🥇 Gold','💎 Diamond','🔥 Netherite'],
        axe:        ['','🪵 Wooden','🪨 Stone','⚪ Iron','💎 Diamond','🔥 Netherite'],
    }
    const names = toolNames[toolKey] || []
    let msg = ''
    if (tierGone) {
        msg = `\n⚠️ *${toolKey.toUpperCase()} RUSAK TOTAL!* Tool hilang karena durability habis di tier 1.`
    } else if (tierDropped) {
        const newName = names[user[toolKey]] || `Tier ${user[toolKey]}`
        msg = `\n⚠️ *${toolKey.toUpperCase()} TURUN TIER!* Sekarang: ${newName} (Dur reset: ${user[durKey]})`
    }

    return { tierDropped, tierGone, newTier: user[toolKey], newDur: user[durKey], msg }
}

module.exports = { applyDurabilityLoss, TIER_DUR_MAX }
