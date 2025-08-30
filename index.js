const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys")
const pino = require("pino")

async function startSock() {
  // folder untuk simpan session (dibuat otomatis)
  const { state, saveCreds } = await useMultiFileAuthState("auth_info")

  // ambil versi terbaru WhatsApp Web
  const { version } = await fetchLatestBaileysVersion()

  // buat koneksi socket
  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: true
  })

  // simpan session setiap update
  sock.ev.on("creds.update", saveCreds)

  // Banner
  console.log(`
=========================================
🔥 TANJIRO CRASHER 🔥
✅ Bot berjalan stabil di Baileys v${version.join(".")}
=========================================
  `)

  // Pairing code (kalau belum login)
  if (!sock.authState.creds.registered) {
    const phoneNumber = "62xxxxxxxxxx" // ganti dengan nomor WA kamu
    const code = await sock.requestPairingCode(phoneNumber)
    console.log("🔑 Pairing Code:", code)
  }

  // handler pesan
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const from = msg.key.remoteJid
    const isGroup = from.endsWith("@g.us")
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ""

    if (text.toLowerCase() === ".ping") {
      await sock.sendMessage(from, { text: "🏓 Pong! Bot aktif" })
    }

    if (text.toLowerCase() === ".menu") {
      let menu = `
*📜 TANJIRO BOT MENU*
1. .ping → cek status
2. .menu → tampilkan menu
`
      menu += isGroup
        ? "\n📢 Dipakai dari *Group Chat*"
        : "\n📩 Dipakai dari *Private Chat*"

      await sock.sendMessage(from, { text: menu })
    }
  })

  // biar gak crash kalau ada error
  process.on("uncaughtException", console.error)
  process.on("unhandledRejection", console.error)
}

startSock()