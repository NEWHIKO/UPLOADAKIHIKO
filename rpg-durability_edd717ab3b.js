// ================================================================
//  DURABILITY.JS — Unified Durability Before-Handler
//  Dipanggil otomatis sebelum setiap pesan.
//  Fungsi: memastikan data tools terinitalisasi dengan benar.
//  Logika kerusakan aktual ada di rpg-durability-helper.js
//  yang dipanggil oleh masing-masing modul aktivitas.
// ================================================================

const { TIER_DUR_MAX } = require('./rpg-durability-helper.js')

const TOOLS = ['sword', 'pickaxe', 'fishingrod', 'armor', 'axe']

module.exports = {
  before: async function (m) {
    let user = global.db.data.users[m.sender]
    if (!user) {
      global.db.data.users[m.sender] = {}
      user = global.db.data.users[m.sender]
    }

    for (const tool of TOOLS) {
      const durKey = `${tool}durability`

      // Inisialisasi jika undefined
      if (typeof user[tool]   === 'undefined') user[tool]   = 0
      if (typeof user[durKey] === 'undefined') user[durKey] = 0

      // Tidak punya tool → durability harus 0
      if (user[tool] === 0) {
        user[durKey] = 0
        continue
      }

      // Punya tool tapi durability belum di-set (migrasi user lama)
      // → set ke max tier mereka sebagai nilai awal
      if (user[durKey] <= 0 && user[tool] > 0) {
        user[durKey] = TIER_DUR_MAX[user[tool]] || 100
      }
    }
  }
}