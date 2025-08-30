const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys")

const pino = require("pino")
const chalk = require("chalk")

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session")
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true, // QR tampil kalau pairing belum dipakai
    logger: pino({ level: "silent" })
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log(chalk.green("✅ Bot berhasil tersambung!"))
    } else if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode
      if (reason !== DisconnectReason.loggedOut) {
        console.log(chalk.red("❌ Koneksi terputus, mencoba ulang..."))
        startBot()
      } else {
        console.log(chalk.red("⚠️ Kamu logout, hapus folder session lalu pairing ulang"))
      }
    }
  })

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return
    const from = msg.key.remoteJid
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text

    if (text?.toLowerCase() === "menu") {
      await sock.sendMessage(from, { text: "Hai 👋 ini menu bot kamu!" })
    }
  })
}

startBot()startSock()
