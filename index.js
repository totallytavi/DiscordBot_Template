const { Client, Collection, IntentsBitField } = require("discord.js");
const { Sequelize } = require("sequelize");
const { InteractionType } = require("discord-api-types/v10");
const { interactionEmbed, toConsole } = require("./functions.js");
const config = require("./config.json");
const fs = require("node:fs");
const wait = require("node:util").promisify(setTimeout);
let ready = false;

//#region Setup
// Database
const sequelize = new Sequelize(config.mysql.database, config.mysql.user, config.mysql.password, {
  dialect: "mysql",
  logging: process.env.environment === "development" ? console.log : false,
});
if(!fs.existsSync("./models")) fs.mkdirSync("./models");
const models = fs.readdirSync("models").filter(file => file.endsWith(".js"));
for(const model of models) {
  try {
    const file = require(`./models/${model}`);
    file.import(sequelize);
  } catch(e) {
    console.error(`[DB] Unloaded ${model}\n`, e);
  }
}

// Discord bot
const client = new Client({
  intents: [IntentsBitField.Flags.Guilds]
});
const slashCommands = [];
client.commands = new Collection();
client.sequelize = sequelize;
client.models = sequelize.models;
//#endregion

//#region Events
client.on("ready", async () => {
  toConsole(`[READY] Logged in as ${client.user.tag} (${client.user.id}) at <t:${Math.floor(Date.now()/1000)}:T>. Client ${ready ? "can" : "**cannot**"} receive commands!`, "client.on(ready)", client);
  client.guilds.cache.each(g => g.members.fetch());
  client.user.setActivity(`${client.users.cache.size} users across ${client.guilds.cache.size} servers`, { type: "LISTENING" });

  if(!fs.existsSync("./commands")) fs.mkdirSync("./commands");
  const commands = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
  for(const command of commands) {
    try {
      const file = require(`./commands/${command}`);
      slashCommands.push(file.data.toJSON());
      client.commands.set(file.data.name, file);
    } catch(e) {
      console.error(`[CMD] Unloaded ${command}\n`, e);
    }
  }
  await client.application.commands.set(slashCommands)
    .then(() => ready = true)
    .catch(e => console.error("[APP-CMD] Failed to set slash commands\n", e));

  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: process.env.environment === "development" });
  } catch(e) {
    console.error("[DB] Failed validation\n", e);
    process.exit(16);
  }

  setInterval(() => {
    client.guilds.cache.each(g => g.members.fetch());
    client.user.setActivity(`${client.users.cache.size} users across ${client.guilds.cache.size} servers`, { type: "LISTENING" });
  }, 60000);
});

client.on("interactionCreate", async (interaction) => {
  if(!ready) return interactionEmbed(4, "", "The bot is starting up, please wait", interaction, client, [true, 10]);
  if(!interaction.inGuild()) return interactionEmbed(2, "[WARN-NODM]", "", interaction, client, [true, 10]);
  // Remove this line if you want to allow DM commands

  switch(interaction.type) {
  case InteractionType.ApplicationCommand: {
    let command = client.commands.get(interaction.commandName);
    if(command) {
      const ack = command.run(client, interaction, interaction.options)
        .catch((e) => {
          interaction.editReply("Something went wrong while executing the command. Please report this to <@409740404636909578> (Tavi#0001)");
          return toConsole(e.stack, new Error().stack, client);
        });
      
      await wait(1e4);
      if(ack != null) return; // Already executed
      interaction.fetchReply()
        .then(m => {
          if(m.content === "" && m.embeds.length === 0) interactionEmbed(3, "[ERR-UNK]", "The command timed out and failed to reply in 10 seconds", interaction, client, [true, 15]);
        });
    }
    break;
  }
  case InteractionType.ModalSubmit: {
    let modal = client.modals.get(interaction.customId);
    if(modal) {
      const ack = modal.run(client, interaction, interaction.fields)
        .catch((e) => {
          interaction.editReply("Something went wrong while executing the modal. Please report this to <@409740404636909578> (Tavi#0001)");
          return toConsole(e.stack, new Error().stack, client);
        });

      await wait(1e4);
      if(ack != null) return; // Already executed
      interaction.fetchReply()
        .then(m => {
          if(m.content === "" && m.embeds.length === 0) interactionEmbed(3, "[ERR-UNK]", "The modal timed out and failed to reply in 10 seconds", interaction, client, [true, 15]);
        });
    }
    break;
  }
  default: {
    interaction.deleteReply();
  }
  }
});
//#endregion

client.login(config.bot.token);

//#region Error handling
process.on("uncaughtException", (err, origin) => {
  if(!ready) {
    console.warn("Exiting due to a [uncaughtException] during start up");
    console.error(err, origin);
    return process.exit(14);
  }
  toConsole(`An [uncaughtException] has occurred and the process is exiting\n\n> ${err}\n> ${origin}`, "process.on('uncaughtException')", client);
});
process.on("unhandledRejection", async (promise) => {
  if(!ready) {
    console.warn("Exiting due to a [unhandledRejection] during start up");
    console.error(promise);
    return process.exit(15);
  }
  toConsole(`An [unhandledRejection] has occurred\n\n> ${promise}`, "process.on('unhandledRejection')", client, promise);
});
process.on("warning", async (warning) => {
  if(!ready) {
    console.warn("[warning] has occurred during start up");
    console.warn(warning);
  }
  toConsole(`A [warning] has occurred.\n\n> ${warning}`, "process.on('warning')", client);
});
process.on("exit", (code) => {
  console.error("[EXIT] The process is exiting!");
  console.error(`[EXIT] Code: ${code}`);
});
//#endregion
