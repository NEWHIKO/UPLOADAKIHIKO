require("./case")
const fs = require('fs')


global.configSchema = {
  // Bot Identity
  owner: { value: "6285147519536", editable: true, type: "string", label: "Owner Number", category: "identity" },
  namaowner: { value: "Dino", editable: true, type: "string", label: "Owner Name", category: "identity" },
  namabot: { value: "Vionyx ID", editable: true, type: "string", label: "Bot Name", category: "identity" },
  
  // Watermark & Branding
  foother: { value: "© VIonyx ID", editable: true, type: "string", label: "Footer/Watermark", category: "branding" },
  author: { value: "Vionyx", editable: true, type: "string", label: "Author (Sticker)", category: "branding" },
  packname: { value: "VIonyx ID", editable: true, type: "string", label: "Pack Name (Sticker)", category: "branding" },
  
  // Channel & Links
  namach: { value: "𝙑𝙞𝙤𝙣𝙮𝙭 𝙄𝙣𝙛𝙤𝙧𝙢𝙖𝙩𝙞𝙤𝙣", editable: true, type: "string", label: "Channel Name", category: "identity" },
  ch: { value: "https://whatsapp.com/channel/0029VaqPkZ7ISTkQthJkuf1N", editable: true, type: "string", label: "Channel Link", category: "links" },
  idch: { value: "120363361392073733@newsletter", editable: false, type: "string", label: "Channel ID (Auto)", category: "links", description: "Auto-generated from channel link" },
  
  // Command Prefix
  setprefix: { value: ".", editable: true, type: "string", label: "Command Prefix", category: "command" },
  
  // Media URLs
  menuimg: { value: "https://uploader.bimxyz.my.id/image/VIONYXID.jpg", editable: true, type: "string", label: "Menu Image URL", category: "media" },
  
  // Message Template Settings
  useThumbnail: { value: true, editable: true, type: "boolean", label: "Use Thumbnail in Messages", category: "template" },
  useChannel: { value: true, editable: true, type: "boolean", label: "Use Channel Forward in Messages", category: "template" },
  
  // Bot Behavior
  onlygc: { value: true, editable: true, type: "boolean", label: "Group Only Mode", category: "behavior", description: "Jika true, bot hanya merespons di group. Jika false, bot merespons di group & private chat." },

  // Game Settings
  gamewaktu: { value: 60, editable: true, type: "number", label: "Game Timeout (seconds)", category: "game" },
  
  // Messages
  mess_owner: { value: "<!> 𝗙𝗶𝘁𝘂𝗿 𝗞𝗵𝘂𝘀𝘂𝘀 𝗢𝘄𝗻𝗲𝗿", editable: true, type: "string", label: "Owner Only Message", category: "messages" },
  mess_group: { value: "<!> 𝗙𝗶𝘁𝘂𝗿 𝗞𝗵𝘂𝘀𝘂𝘀 𝗚𝗿𝗼𝘂𝗽", editable: true, type: "string", label: "Group Only Message", category: "messages" },
  mess_admin: { value: "<!> 𝗙𝗶𝘁𝘂𝗿 𝗞𝗵𝘂𝘀𝘂𝘀 𝗔𝗱𝗺𝗶𝗻𝘀", editable: true, type: "string", label: "Admin Only Message", category: "messages" },
  mess_botadmin: { value: "<!> 𝗕𝗼𝘁 𝗵𝗮𝗿𝘂𝘀 𝗮𝗱𝗺𝗶𝗻 𝗮𝗴𝗮𝗿 𝗯𝗶𝘀𝗮 𝗺𝗲𝗻𝗴𝗮𝗸𝘀𝗲𝘀 𝗳𝗶𝘁𝘂𝗿 𝗶𝗻𝗶", editable: true, type: "string", label: "Bot Admin Required Message", category: "messages" },
  mess_private: { value: "<!> 𝗙𝗶𝘁𝘂𝗿 𝗞𝗵𝘂𝘀𝘂𝘀 𝗣𝗿𝗶𝘃𝗮𝘁𝗲 𝗖𝗵𝗮𝘁", editable: true, type: "string", label: "Private Only Message", category: "messages" },
  mess_daftar: { value: "❌ Belum terdaftar!\nKetik: .daftar Nama Kamu", editable: true, type: "string", label: "Not Registered Message", category: "messages" },
  mess_done: { value: "𝗗𝗼𝗻𝗲...", editable: true, type: "string", label: "Done Message", category: "messages" },
  defaultWelcomeText: {
  value: `👋 Halo @user!\nSelamat datang di *📌 @group*.\nSemoga betah dan jangan lupa membaca deskripsi grup terlebih dahulu.\n📖 Deskripsi:\n@desc
\nSelamat bergabung dan semoga harimu menyenangkan! ✨`,
  editable: true,
  type: "string",
  label: "Default Welcome Text",
  category: "messages",
  description: "Teks default welcome. Tersedia variabel: @user @group @desc"
},

defaultGoodbyeText: {
  value: `👋 Selamat tinggal @user.\nTerima kasih sudah pernah menjadi bagian dari *📌 @group*.\nSemoga sukses dan sampai bertemu lagi di lain waktu. 🤝`,
  editable: true,
  type: "string",
  label: "Default Goodbye Text",
  category: "messages",
  description: "Teks default goodbye. Tersedia variabel: @user @group @desc"
},
  
}


function applyConfigToGlobal() {
  for (const [key, config] of Object.entries(global.configSchema)) {
    global[key] = config.value
  }
  
  
  global.mess = {
    owner: global.mess_owner,
    group: global.mess_group,
    admin: global.mess_admin,
    botadmin: global.mess_botadmin,
    private: global.mess_private,
    daftar: global.mess_daftar,
    done: global.mess_done
  }
  
  try {
    global.thumbnail = fs.readFileSync("./media/dino.jpg")
    global.qris = fs.readFileSync("./media/qris.jpg")
  } catch (e) {
    console.warn('[CONFIG] Media files not found:', e.message)
  }
  
  // Initialize game object for game state management
  global.game = global.game || {}
}

applyConfigToGlobal()

global.promtai = `Kamu adalah ${global.namabot}, asisten AI pintar dari bot WhatsApp.

IDENTITAS KAMU:
- Nama bot: ${global.namabot}
- Owner: ${global.namaowner}
- Bahasa: Indonesia (santai, ramah, tidak kaku)
- Karakter: Helpful, informatif, lucu tapi tetap sopan
- Prefix command: ${global.setprefix}

... (command list tetap sama)`



let file = require.resolve(__filename)
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file)
  console.log('\x1b[0;32m'+__filename+' \x1b[1;32mupdated!\x1b[0m')
  delete require.cache[file]
  require(file)
})

module.exports = {
  getConfigSchema: () => global.configSchema,
  applyConfigToGlobal
}