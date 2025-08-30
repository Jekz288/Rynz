const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  jidDecode,
  proto,
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs");

const store = makeInMemoryStore({
  logger: pino({ level: "silent" }).child({ stream: "store" }),
});
store.readFromFile("./session/store.json");
setInterval(() => {
  store.writeToFile("./session/store.json");
}, 10_000);

async function startBot(pairingCode = true) {
  const { state, saveCreds } = await useMultiFileAuthState("session");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    printQRInTerminal: !pairingCode,
    browser: ["TanjiroBot", "Chrome", "1.0.0"],
    auth: state,
    logger: pino({ level: "silent" }),
  });

  sock.ev.on("creds.update", saveCreds);

  if (pairingCode && !sock.authState.creds.registered) {
    const phoneNumber = process.env.PHONE_NUMBER || "";
    if (!phoneNumber) {
      console.log("❌ Tambahkan PHONE_NUMBER di .env untuk pairing!");
      process.exit(0);
    }
    setTimeout(async () => {
      const code = await sock.requestPairingCode(phoneNumber);
      console.log("✅ Pairing Code:", code);
    }, 3000);
  }

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      if (
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut
      ) {
        console.log("♻️ Reconnecting...");
        startBot();
      } else {
        console.log("❌ Logged out.");
      }
    } else if (connection === "open") {
      console.log("✅ Bot Connected!");
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (text.toLowerCase() === "ping") {
      await sock.sendMessage(from, { text: "pong ✅" });
    }
  });

  return sock;
}

module.exports = {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  jidDecode,
  proto,
  startBot,
};
