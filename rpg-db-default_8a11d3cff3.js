// ═══════════════════════════════════════════════════════════════
//  RPG DB DEFAULT  —  lib/fitur/rpg/rpg-db-default.js
//  Auto-generated dari scan plugin RPG. Jalankan ulang scan jika
//  ada plugin baru ditambahkan.
//
//  CARA PAKAI (sudah di-handle otomatis oleh userHelper):
//    const { RPG_DEFAULT } = require('./rpg/rpg-db-default')
//
//    // Merge ke user yang sudah ada (tidak timpa nilai yang sudah ada):
//    user = { ...RPG_DEFAULT, ...user }
// ═══════════════════════════════════════════════════════════════

const RPG_DEFAULT = {

  // ─── EKONOMI ───────────────────────────────────────────
  money:            0,
  bank:             0,
  exp:              0,
  level:            0,

  // ─── KONDISI ───────────────────────────────────────────
  health:           200,   // max 200
  stamina:          300,   // max 300

  // ─── METADATA ──────────────────────────────────────────
  role:             '',
  pet:              '',    // nama pet aktif (crate pet)
  pasangan:         '',

  // ─── COOLDOWN / TIMESTAMP (0 = belum pernah) ───────────
  lastberburu:      0,
  lastfishing:      0,
  lasthunter:       0,     // cooldown hunter (30 menit)
  lastadventure:    0,
  lastadventurepet: 0,
  lastdagang:       0,
  merampok:         0,     // cooldown merampok (60 menit)
  mulung:           0,     // cooldown mulung (30 menit)
  membunuh:         0,     // cooldown membunuh (60 menit)
  lastopen:         0,     // cooldown open crate (8 detik)
  lastTomoney:      0,     // cooldown tomoney (4 jam)
  judilast:         0,     // cooldown judi (5 detik)
  rpgdaily:         0,
  rpghourly:        0,
  rpgweekly:        0,
  rpgmonthly:       0,
  rpgyearly:        0,
  streakdaily:      0,
  ngelonte:         0,     // cooldown ngelonte (12 jam)
  ngewe:            0,     // cooldown ngewe (30 menit)
  ojekk:            0,     // cooldown ojek (20 menit)
  nambang:          0,     // cooldown nambang (30 menit)
  nebang:           0,     // cooldown nebang (60 menit)

  // ─── SPACEMAN GAME STATE ───────────────────────────────
  spacemanActive:    false, // apakah sedang ada game spaceman berjalan
  spacemanBet:       0,     // jumlah taruhan game aktif
  spacemanStartTime: 0,     // timestamp mulai game (untuk deteksi zombie)

  // ─── TOMONEY DAILY CAP ─────────────────────────────────
  tomoneyUsedToday: 0,     // total money yang sudah dikonversi hari ini
  tomoneyDateKey:   '',    // tanggal reset daily cap (Date.toDateString())

  // ─── ARRAY / OBJECT KHUSUS ─────────────────────────────
  dagangPartners:   [],   // { jid, time }[] — anti multi-account exploit berdagang

  // ─── CRATE / RARITY ────────────────────────────────────
  common:           0,
  uncommon:         0,
  legendary:        0,
  mythic:           0,

  // ─── EQUIPMENT ─────────────────────────────────────────
  sword:             0,
  sworddurability:   0,
  armor:             0,
  armordurability:   0,
  pickaxe:           0,
  pickaxedurability: 0,
  axe:               0,
  axedurability:     0,
  fishingrod:        0,
  fishingroddurability: 0,

  // ─── MATERIAL TAMBANG ──────────────────────────────────
  rock:             0,
  coal:             0,
  iron:             0,
  gold:             0,
  diamond:          0,
  string:           0,
  wood:             0,
  trash:            0,
  herb:             0,
  botol:            0,
  kardus:           0,
  kaleng:           0,
  potion:           0,

  // ─── HASIL BERBURU ─────────────────────────────────────
  ayam:             0,
  kambing:          0,
  sapi:             0,
  babi:             0,
  monyet:           0,
  panda:            0,
  harimau:          0,
  gajah:            0,
  kerbau:           0,
  banteng:          0,
  buaya:            0,
  babihutan:        0,

  // ─── HASIL MANCING ─────────────────────────────────────
  nila:             0,
  lele:             0,
  bawal:            0,
  paus:             0,
  kepiting:         0,
  udang:            0,
  // catatan: u.ikan (generic) sudah dihapus — tidak ada di sini

  // ─── BUAH ──────────────────────────────────────────────
  pisang:           0,
  anggur:           0,
  mangga:           0,
  jeruk:            0,
  apel:             0,

  // ─── BIBIT ─────────────────────────────────────────────
  bibitpisang:      0,
  bibitanggur:      0,
  bibitmangga:      0,
  bibitjeruk:       0,
  bibitapel:        0,

  // ─── BUMBU / BAHAN MASAK ───────────────────────────────
  bawang:           0,
  cabai:            0,
  garam:            0,
  jahe:             0,
  kecap:            0,
  kunyit:           0,
  mentega:          0,
  minyak:           0,
  santan:           0,
  tepung:           0,

  // ─── MAKANAN JADI ──────────────────────────────────────
  // Basic (+30~50 stamina)
  ayamgeprek:       0,
  satemadura:       0,
  dendengmonyet:    0,
  lelepenyet:       0,
  pepisnila:        0,

  // Medium (+50~70 stamina)
  babikecap:        0,
  tonsengbanteng:   0,
  sotokerbau:       0,
  gulaibabihutan:   0,
  bawalmanis:       0,
  udangcrispy:      0,

  // Premium (+70~90 stamina)
  rendang:          0,
  harimaurica:      0,
  dimsumpanda:      0,
  semurgajah:       0,
  supbuaya:         0,
  steakpaus:        0,
  kepitingpadang:   0,

  // ─── PET LEVEL ─────────────────────────────────────────
  naga:             0,
  nagaexp:          0,
  nagastamina:      100,
  phonix:           0,
  phonixexp:        0,
  phonixstamina:    100,
  griffin:          0,
  griffinexp:       0,
  griffinstamina:   100,
  kyubi:            0,
  kyubiexp:         0,
  kyubistamina:     100,
  centaur:          0,
  centaurexp:       0,
  centaurstamina:   100,

  // ─── MAKANAN PET ───────────────────────────────────────
  makanannaga:      0,
  makananphonix:    0,
  makanangriffin:   0,
  makanankyubi:     0,
  makanancentaur:   0,

}

// ═══════════════════════════════════════════════════════════════
//  DB GLOBAL DEFAULT — inisialisasi di db/index.js atau loader
//  Bukan bagian dari RPG_DEFAULT (per-user), tapi perlu ada
//  agar tidak error saat pertama kali diakses.
// ═══════════════════════════════════════════════════════════════
//
//  global.db.data.giveaway = global.db.data.giveaway || {}
//    └─ { [chatId]: { [giveawayId]: { host, hadiah, peserta[], active } } }
//
//  Tambahkan baris di atas di db/index.js bagian inisialisasi global:
//    data.giveaway = data.giveaway || {}
//
// ═══════════════════════════════════════════════════════════════

const DB_GLOBAL_DEFAULT = {
  giveaway: {},   // { [chatId]: { [id]: { host, hadiah, peserta[], active } } }
}

module.exports = { RPG_DEFAULT, DB_GLOBAL_DEFAULT }