import { Client, Collection, IntentsBitField, InteractionType } from 'discord.js';
import { default as disc } from './configs/discord.json' assert { 'type': 'json' };
import { CustomClient } from './typings/Extensions.js';

//#region Setup
const client: CustomClient = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.MessageContent
  ]
});
client.commands = new Collection();
client.ready = false;
client.logs = console;
// Load functions
client.logs.debug('M | ✦ Loading functions');
const autoload = await import('./functions/load.js');
await autoload.load(client);
// Initialization functions
for (const f of Object.values(client.functions.init)) {
  f(client);
}
//#endregion

//#region Events
client.logs.debug('M | ✦ Attaching events');
//? client.eventNames() for a full list
client.once('ready', async () => {
  // Ready handlers
  for (const func of Object.values(client.functions.ready)) {
    func(client);
  }
});
// Interaction handlers
client.on('interactionCreate', async (interaction) => {
  switch (interaction.type) {
    case InteractionType.ApplicationCommand: {
      // Get the command
      const command = client.commands.get(interaction.commandName);
      // If the command doesn't exist, return
      if (!command) return;
      // Defer in the event of high load
      await interaction.deferReply({ ephemeral: command.ephemeral ?? false });
      // Run the command
      command.run(client, interaction, interaction.options);
      break;
    }
  }
});
//#endregion

// Log into Discord
client.logs.debug('M | ✦ Logging into Discord');
client.login(disc.bot.token);
