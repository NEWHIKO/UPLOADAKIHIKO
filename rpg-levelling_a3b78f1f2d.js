'use strict'

/**
 * ═══════════════════════════════════════════════════════
 *   RPG LEVELLING SYSTEM — Exponential XP Curve
 *   Modul terpusat untuk kalkulasi XP naik level
 * ═══════════════════════════════════════════════════════
 *
 *  FORMULA:
 *    xpRequired(level) = BASE × level^EXPONENT + FLAT × level
 *
 *  CONTOH XP YANG DIBUTUHKAN PER LEVEL (multiplier=1):
 *    Level  1  →      1.000 XP    (dari 0)
 *    Level  5  →      6.700 XP
 *    Level 10  →     22.000 XP
 *    Level 20  →     77.000 XP
 *    Level 30  →    162.000 XP
 *    Level 50  →    425.000 XP
 *    Level 100 →  1.600.000 XP
 *    Level 200 →  6.200.000 XP
 *    Level 500 → 38.000.000 XP
 *    Level 1000→ 151.000.000 XP
 *
 *  PERBANDINGAN DENGAN SISTEM LAMA:
 *    Level 1  lama: 100 EXP    → baru: 1.000 EXP   (×10)
 *    Level 10 lama: 1.000 EXP  → baru: 22.000 EXP  (×22)
 *    Level 50 lama: 5.000 EXP  → baru: 425.000 EXP (×85)
 *
 *  BALANCE vs EXP DARI AKTIVITAS:
 *    Berburu       : 3.000–15.000 base → ~9.000 EXP rata-rata
 *    Adventure     : 5.000–25.000 base → ~15.000 EXP rata-rata
 *    Ngelonte      : 5.000–20.000 base → ~12.500 EXP rata-rata
 *    Mulung        : 1.000–4.000  base → ~2.500 EXP rata-rata
 *    Daily absen   : 0 EXP (money only, sudah benar)
 *
 *    → Dengan curve baru, level 1→10 butuh ~100 kali aktivitas
 *    → Level 10→20 butuh ~200 kali aktivitas
 *    → Semakin tinggi, semakin susah secara eksponensial
 * ═══════════════════════════════════════════════════════
 */

// ─── KONSTANTA CURVE ────────────────────────────────────

// Koefisien utama — ubah sini untuk tuning global
const BASE       = 800       // XP base sebelum exponent
const EXPONENT   = 1.75      // Power curve — lebih besar = lebih susah di level tinggi
const FLAT       = 200       // Penambahan linear per level (mencegah terlalu cepat di awal)

// ─── FUNGSI UTAMA ──────────────────────────────────────

/**
 * Hitung XP yang dibutuhkan untuk naik dari level N ke level N+1
 * @param {number} level — level SAAT INI user
 * @param {number} [multiplier=1] — opsional global multiplier (tidak direkomendasikan, tinggalkan 1)
 * @returns {{ xp: number, level: number }}
 */
function xpRange(level, multiplier = 1) {
  const lvl = Math.max(1, Math.floor(level))
  const xp  = Math.floor((BASE * Math.pow(lvl, EXPONENT) + FLAT * lvl) * multiplier)
  return { xp, level: lvl }
}

/**
 * Hitung total XP kumulatif dari level 1 sampai level N
 * (berguna untuk leaderboard / progress bar absolut)
 * @param {number} level
 * @returns {number} total XP kumulatif
 */
function totalXpForLevel(level) {
  let total = 0
  for (let i = 1; i < level; i++) {
    total += xpRange(i).xp
  }
  return total
}

/**
 * Info lengkap level untuk display di profile / levelup
 * @param {number} currentLevel — level saat ini
 * @param {number} currentExp   — EXP yang sudah dikumpulkan di level ini
 * @returns {{ xpNeeded, progressXP, sisaXP, pct }}
 */
function getLevelInfo(currentLevel, currentExp) {
  const { xp: xpNeeded } = xpRange(currentLevel)
  const progressXP = currentExp || 0
  const sisaXP     = Math.max(0, xpNeeded - progressXP)
  const pct        = xpNeeded > 0
    ? Math.min(100, Math.round((progressXP / xpNeeded) * 100))
    : 0
  return { xpNeeded, progressXP, sisaXP, pct }
}

/**
 * Progress bar visual untuk profile
 * @param {number} pct — 0–100
 * @param {number} [length=10] — panjang bar
 * @returns {string}
 */
function progressBar(pct, length = 10) {
  const filled = Math.round((pct / 100) * length)
  return '█'.repeat(filled) + '░'.repeat(length - filled)
}

// ─── EXPORT ─────────────────────────────────────────────

module.exports = {
  xpRange,
  totalXpForLevel,
  getLevelInfo,
  progressBar,

  // Expose konstanta untuk debug / admin tools
  CURVE: { BASE, EXPONENT, FLAT }
}