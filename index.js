require("dotenv").config();
const { startBot } = require("./lib/baileys");
const chalk = require("chalk");
const figlet = require("figlet");

console.clear();

// Banner TANJIRO
console.log(
  chalk.green(
    figlet.textSync("TANJIRO", {
      font: "Big",
      horizontalLayout: "default",
      verticalLayout: "default"
    })
  )
);

console.log(chalk.yellow("🚀 WhatsApp Bot dengan Baileys Custom Fix Pairing"));
console.log(chalk.cyan("✨ Dibuat oleh: Rynzz\n"));

// Start bot
startBot(true); // true = pairing code aktif
