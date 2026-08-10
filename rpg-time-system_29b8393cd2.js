/**
 * ═══════════════════════════════════════════════════════
 *   RPG TIME SYSTEM - Modul Terpusat Jam/Hari/Musim
 *   + Monthly/Yearly multiplier (baru)
 *   Berdasarkan flowchart RPG Economy Adaptation System
 * ═══════════════════════════════════════════════════════
 *
 *  FORMULA UTAMA:
 *    finalReward = baseReward × timeMult × dayMult × seasonMult × gearBonus
 *    CAP: totalMult ≤ 2.0 (anti-inflasi)
 *
 *  JAM (timeMult):
 *    Subuh  [00–05] → ×0.70
 *    Pagi   [06–11] → ×1.35
 *    Siang  [12–19] → ×1.00
 *    Malam  [20–23] → ×1.35
 *
 *  HARI (dayMult):
 *    Weekday [Sen–Jum] → ×0.85–1.15
 *    Weekend [Sab–Min] → ×1.10–1.45
 *
 *  MUSIM (seasonMult per aktivitas):
 *    ❄️ Hujan  [Des/Jan/Feb]
 *    🌸 Semi   [Mar/Apr/Mei]
 *    ☀️ Kemarau[Jun/Jul/Agu]
 *    🍂 Gugur  [Sep/Okt/Nov]
 *
 *  MONTHLY (monthMult): event bulanan 0.95–1.20
 *  YEARLY  (yearMult):  tahun kabisat ×1.05, lainnya ×1.00
 */

'use strict'

// ─── JAM ────────────────────────────────────────────────

function getJam() {
    const now = new Date()
    const hour = now.getHours()

    if ((hour >= 6 && hour <= 11)) {
        return {
            nama: 'JAM SIBUK ☀️ (Pagi)',
            kategori: 'SIBUK',
            icon: '☀️',
            jam: hour,
            timeMult: 1.35,
            timeExpMult: 1.25,
            staminaDrainBonus: 0,
            healthDrainBonus: 0,
            chanceGagalBonus: -0.05,
            dropBonus: 10,
            moneyBonus: 0,
            durabilityDrainBonus: -5,
            cuaca: '🌅 Jam sibuk pagi! Kondisi prima, semua aktivitas lebih menguntungkan.'
        }
    } else if (hour >= 20 && hour <= 23) {
        return {
            nama: 'JAM SIBUK 🌃 (Malam)',
            kategori: 'SIBUK',
            icon: '🌃',
            jam: hour,
            timeMult: 1.35,
            timeExpMult: 1.20,
            staminaDrainBonus: 10,
            healthDrainBonus: 10,
            chanceGagalBonus: 0.03,
            dropBonus: 5,
            moneyBonus: 0,
            durabilityDrainBonus: 5,
            cuaca: '🌙 Jam sibuk malam! Reward besar tapi stamina & health terkuras lebih cepat.'
        }
    } else if (hour >= 12 && hour <= 19) {
        return {
            nama: 'JAM NORMAL 🌤️ (Siang/Sore)',
            kategori: 'NORMAL',
            icon: '🌤️',
            jam: hour,
            timeMult: 1.00,
            timeExpMult: 1.00,
            staminaDrainBonus: 5,
            healthDrainBonus: 0,
            chanceGagalBonus: 0,
            dropBonus: 0,
            moneyBonus: 0,
            durabilityDrainBonus: 0,
            cuaca: '🌤️ Jam normal siang/sore. Reward standar, kondisi biasa.'
        }
    } else {
        return {
            nama: 'JAM SEPI 🌙 (Dini Hari)',
            kategori: 'SEPI',
            icon: '🌙',
            jam: hour,
            timeMult: 0.70,
            timeExpMult: 0.75,
            staminaDrainBonus: 15,
            healthDrainBonus: 5,
            chanceGagalBonus: 0.05,
            dropBonus: 0,
            moneyBonus: 0,
            durabilityDrainBonus: 10,
            cuaca: '🌙 Jam sepi dini hari! Reward berkurang drastis, stamina terkuras, risiko gagal meningkat.'
        }
    }
}

// ─── HARI ────────────────────────────────────────────────

function getHari() {
    const now = new Date()
    const hari = now.getDay()
    const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const isWeekend = hari === 0 || hari === 6

    const seed = Math.floor(Date.now() / 3600000)
    const seededRand = (min, max) => {
        const x = Math.sin(seed + hari * 31) * 10000
        return min + ((x - Math.floor(x)) * (max - min))
    }

    if (isWeekend) {
        const dayMult = seededRand(1.10, 1.45)
        return {
            nama: namaHari[hari],
            isWeekend: true,
            dayMult: parseFloat(dayMult.toFixed(2)),
            dropBonus: 15,
            shopPriceBonus: 1.10,
            staminaDrainBonus: 0,
            healthDrainBonus: 0,
            durabilityDrainBonus: 0,
            chanceGagalBonus: -0.03,
            cuaca: `🎉 WEEKEND! Hari ${namaHari[hari]} - Drop rate +15% dan market lebih ramai!`
        }
    } else {
        const dayMult = seededRand(0.85, 1.15)
        const isSenin = hari === 1
        const isJumat = hari === 5
        return {
            nama: namaHari[hari],
            isWeekend: false,
            dayMult: parseFloat(dayMult.toFixed(2)),
            dropBonus: 0,
            shopPriceBonus: 1.0,
            staminaDrainBonus: isSenin ? 5 : 0,
            healthDrainBonus: 0,
            durabilityDrainBonus: isSenin ? 5 : 0,
            chanceGagalBonus: isSenin ? 0.03 : (isJumat ? -0.03 : 0),
            cuaca: isSenin
                ? `😴 Hari Senin... Semua terasa berat. Stamina terkuras lebih cepat.`
                : isJumat
                    ? `💪 Hari Jumat! Semangat akhir pekan. Sedikit lebih beruntung!`
                    : `📆 Hari ${namaHari[hari]}. Kondisi normal.`
        }
    }
}

// ─── MUSIM ───────────────────────────────────────────────

function getMusim() {
    const now = new Date()
    const bulan = now.getMonth() + 1

    const musimMap = {
        hujan: {
            bulan: [12, 1, 2],
            nama: 'MUSIM HUJAN ❄️',
            icon: '❄️',
            key: 'hujan',
            mult: {
                wood: 1.3, bibit: 0.8, buah: 0.9, mining: 1.0,
                fishing: 1.0, hunting: 1.1, mulung: 0.9, narik: 1.2,
                ngelonte: 0.8, dagang: 0.9, crime: 1.1, adventure: 0.85,
                adventurepet: 0.9, hunter: 1.1
            },
            staminaDrainBonus: 5, healthDrainBonus: 10, durabilityDrainBonus: 10,
            chanceGagalBonus: 0.05, dropBonus: 0,
            cuaca: '🌧️ Hujan deras. Jalan licin dan tubuh mudah lelah!',
            flavor: '❄️ *MUSIM HUJAN* (Des–Feb)\nKayu berlimpah, tapi aktivitas outdoor berisiko lebih tinggi.'
        },
        semi: {
            bulan: [3, 4, 5],
            nama: 'MUSIM SEMI 🌸',
            icon: '🌸',
            key: 'semi',
            mult: {
                wood: 1.0, bibit: 1.4, buah: 1.3, mining: 1.0,
                fishing: 1.2, hunting: 1.0, mulung: 1.1, narik: 1.0,
                ngelonte: 1.2, dagang: 1.2, crime: 0.9, adventure: 1.2,
                adventurepet: 1.3, hunter: 1.0
            },
            staminaDrainBonus: -5, healthDrainBonus: 0, durabilityDrainBonus: -5,
            chanceGagalBonus: -0.05, dropBonus: 5,
            cuaca: '🌤️ Cuaca cerah dan angin sepoi. Kondisi ideal!',
            flavor: '🌸 *MUSIM SEMI* (Mar–Mei)\nMusim paling menyenangkan! Chance gagal berkurang!'
        },
        kemarau: {
            bulan: [6, 7, 8],
            nama: 'MUSIM KEMARAU ☀️',
            icon: '☀️',
            key: 'kemarau',
            mult: {
                wood: 0.9, bibit: 1.2, buah: 1.5, mining: 0.9,
                fishing: 0.8, hunting: 0.9, mulung: 1.2, narik: 0.9,
                ngelonte: 1.0, dagang: 1.0, crime: 1.0, adventure: 0.9,
                adventurepet: 0.9, hunter: 0.9
            },
            staminaDrainBonus: 15, healthDrainBonus: 5, durabilityDrainBonus: 5,
            chanceGagalBonus: 0.03, dropBonus: 0,
            cuaca: '☀️ Terik panas menyengat. Stamina terkuras sangat cepat!',
            flavor: '☀️ *MUSIM KEMARAU* (Jun–Agu)\nBuah melimpah tapi panas menguras stamina sangat cepat!'
        },
        gugur: {
            bulan: [9, 10, 11],
            nama: 'MUSIM GUGUR 🍂',
            icon: '🍂',
            key: 'gugur',
            mult: {
                wood: 1.2, bibit: 1.0, buah: 1.1, mining: 1.1,
                fishing: 1.0, hunting: 1.2, mulung: 1.0, narik: 1.1,
                ngelonte: 0.9, dagang: 1.1, crime: 1.0, adventure: 1.1,
                adventurepet: 1.1, hunter: 1.2
            },
            staminaDrainBonus: 0, healthDrainBonus: 0, durabilityDrainBonus: 0,
            chanceGagalBonus: 0, dropBonus: 5,
            cuaca: '🍂 Angin bertiup sejuk. Kondisi stabil dan nyaman.',
            flavor: '🍂 *MUSIM GUGUR* (Sep–Nov)\nMusim berburu terbaik!'
        }
    }

    for (const [key, val] of Object.entries(musimMap)) {
        if (val.bulan.includes(bulan)) return { ...val, key }
    }
    return { ...musimMap.gugur, key: 'gugur' }
}

// ─── MONTHLY BONUS (BARU) ────────────────────────────────

/**
 * Multiplier bulanan berdasarkan bulan kalender.
 * Bulan-bulan tertentu memiliki event dan bonus khusus.
 */
function getMonthlyBonus() {
    const bulan = new Date().getMonth() + 1
    const events = {
        1:  { nama: 'Januari 🎆',    mult: 1.10, bonusMsg: '🎆 Bonus Tahun Baru! Semua reward +10%' },
        2:  { nama: 'Februari 💝',   mult: 1.05, bonusMsg: '💝 Bulan Valentine! Bonus dagang & sosial +5%' },
        3:  { nama: 'Maret 🌱',      mult: 1.05, bonusMsg: '🌱 Awal Musim Semi. Bonus farming +5%' },
        4:  { nama: 'April 🌸',      mult: 1.08, bonusMsg: '🌸 Puncak Semi! Bonus berkebon & fishing +8%' },
        5:  { nama: 'Mei 🌺',        mult: 1.05, bonusMsg: '🌺 Akhir Semi. Bonus buah & bibit +5%' },
        6:  { nama: 'Juni 🌞',       mult: 1.00, bonusMsg: '' },
        7:  { nama: 'Juli ☀️',       mult: 0.95, bonusMsg: '☀️ Panas terik! Semua reward -5% tapi buah ×1.5' },
        8:  { nama: 'Agustus 🏳️',   mult: 1.17, bonusMsg: '🏳️ Kemerdekaan! Bonus nasional +17%' },
        9:  { nama: 'September 🍂',  mult: 1.08, bonusMsg: '🍂 Musim Gugur. Berburu & kayu +8%' },
        10: { nama: 'Oktober 🎃',    mult: 1.05, bonusMsg: '🎃 Oktober! Bonus crime & adventure +5%' },
        11: { nama: 'November 🍂',   mult: 1.10, bonusMsg: '🍂 Panen Besar! Semua hasil alam +10%' },
        12: { nama: 'Desember 🎄',   mult: 1.20, bonusMsg: '🎄 Natal & Akhir Tahun! Mega bonus +20%!' },
    }
    return events[bulan] || { nama: `Bulan ${bulan}`, mult: 1.0, bonusMsg: '' }
}

// ─── YEARLY BONUS (BARU) ─────────────────────────────────

/**
 * Multiplier tahunan.
 * Tahun kabisat memberikan bonus +5% semua reward.
 */
function getYearlyBonus() {
    const now = new Date()
    const tahun = now.getFullYear()
    const isLeapYear = (tahun % 4 === 0 && tahun % 100 !== 0) || tahun % 400 === 0
    const yearMult = isLeapYear ? 1.05 : 1.0
    const dayOfYear = Math.floor((now - new Date(tahun, 0, 0)) / 86400000)
    const progress = Math.round((dayOfYear / 365) * 100)
    return {
        tahun,
        isLeapYear,
        yearMult,
        dayOfYear,
        progress,
        bonusMsg: isLeapYear
            ? `🗓️ Tahun Kabisat ${tahun}! Bonus +5% semua reward!`
            : `📅 Tahun ${tahun}. Hari ke-${dayOfYear}/365 (${progress}% berlalu).`
    }
}

// ─── FUNGSI UTAMA ─────────────────────────────────────────

function getTimeContext() {
    const jam = getJam()
    const hari = getHari()
    const musim = getMusim()
    return { jam, hari, musim }
}

function hitungReward(aktivitas, baseMoney, baseExp, baseItems = 1, gearBonus = 1) {
    const { jam, hari, musim } = getTimeContext()

    const timeMult = jam.timeMult
    const timeExpMult = jam.timeExpMult
    const dayMult = hari.dayMult
    const seasonMult = musim.mult[aktivitas] || 1.0

    // Integrate monthly & yearly bonus sebagai global multiplier
    const monthBonus = getMonthlyBonus()
    const yearBonus  = getYearlyBonus()
    // Cap total kombinasi agar tidak inflasi: max ×1.35 dari bulan+tahun
    const globalMult = Math.min(monthBonus.mult * yearBonus.yearMult, 1.35)

    const rawMult = timeMult * dayMult * seasonMult * globalMult
    const capMult = Math.min(rawMult, 2.5)  // cap dinaikkan sedikit karena ada globalMult
    const capExpMult = Math.min(timeExpMult * dayMult * globalMult, 2.5)

    const finalMoney = Math.floor(baseMoney * capMult * gearBonus)
    const finalExp = Math.floor(baseExp * capExpMult)
    const finalItems = Math.max(1, Math.floor(baseItems * seasonMult))

    return {
        finalMoney, finalExp, finalItems,
        totalMult: parseFloat(capMult.toFixed(2)),
        globalMult: parseFloat(globalMult.toFixed(2)),
        monthBonus: monthBonus.bonusMsg,
        jam, hari, musim, seasonMult,
        dayMult: parseFloat(dayMult.toFixed(2))
    }
}

function hitungDebuff(baseStaminaLoss, baseHealthLoss = 0, baseDurabilityLoss = 0, baseChanceGagal = 0) {
    const { jam, hari, musim } = getTimeContext()

    const totalStaminaBonus = jam.staminaDrainBonus + hari.staminaDrainBonus + musim.staminaDrainBonus
    const totalHealthBonus = jam.healthDrainBonus + hari.healthDrainBonus + musim.healthDrainBonus
    const totalDurabilityBonus = jam.durabilityDrainBonus + hari.durabilityDrainBonus + musim.durabilityDrainBonus
    const totalChanceGagalBonus = jam.chanceGagalBonus + hari.chanceGagalBonus + musim.chanceGagalBonus

    const finalStaminaLoss = Math.max(0, baseStaminaLoss + Math.floor(totalStaminaBonus))
    const finalHealthLoss = Math.max(0, baseHealthLoss + Math.floor(totalHealthBonus))
    const finalDurabilityLoss = Math.max(0, baseDurabilityLoss + Math.floor(totalDurabilityBonus))
    const finalChanceGagal = Math.max(0, Math.min(0.95, baseChanceGagal + totalChanceGagalBonus))

    return { finalStaminaLoss, finalHealthLoss, finalDurabilityLoss, finalChanceGagal, jam, hari, musim }
}

function buildTimeInfo(aktivitas) {
    const { jam, hari, musim } = getTimeContext()
    const seasonMult = musim.mult[aktivitas] || 1.0

    const multSign = (v) => v >= 1 ? `×${v}` : `×${v} ↓`
    const multColor = (v) => v > 1 ? '📈' : v < 1 ? '📉' : '➖'

    const jamLabel = jam.kategori === 'SIBUK' ? '🔥 JAM SIBUK ×1.35'
                   : jam.kategori === 'NORMAL' ? '⚪ JAM NORMAL ×1.00'
                   : '💤 JAM SEPI ×0.70'

    return `
🕐 *${jamLabel}* → ${jam.nama}
📅 *Hari: ${hari.nama}* [${hari.isWeekend ? '🎉 WEEKEND' : '📆 Hari Biasa'}] ×${hari.dayMult}
🌍 *${musim.nama}* → ${multColor(seasonMult)} ${multSign(seasonMult)}
⚠️ ${jam.cuaca}`.trim()
}

function getDropBonus() {
    const { jam, hari, musim } = getTimeContext()
    return jam.dropBonus + hari.dropBonus + musim.dropBonus
}

// ─── EXPORT ──────────────────────────────────────────────

module.exports = {
    getJam,
    getHari,
    getMusim,
    getTimeContext,
    hitungReward,
    hitungDebuff,
    buildTimeInfo,
    getDropBonus,
    getMonthlyBonus,
    getYearlyBonus,
}
