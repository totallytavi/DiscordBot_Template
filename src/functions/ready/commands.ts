import { SlashCommandBuilder } from 'discord.js';
import { CustomClient } from '../../typings/Extensions.js';
import { readdirSync } from 'node:fs';
import { default as disc } from '../../configs/discord.json' assert { 'type': 'json' };

export const name = 'commands';
export async function execute(client: CustomClient): Promise<void> {
  // Get all files in the commands directory
  const files = readdirSync('./commands', { recursive: true })
    // Map Buffers to string
    .map((f) => String(f))
    // Trim directory
    .map((f) => f.replace('./commands/', ''))
    // Remove Windows backslashes
    .map((f) => f.replace('\\', '/'))
    // Filter out non-JS files
    .filter((f) => f.endsWith('.js'));
  // For each file, load the command
  const cmds: ReturnType<SlashCommandBuilder['toJSON']>[] = [];
  client.logs.debug(`F | ✦ Expecting ${files.length} commands`);
  for (const file of files) {
    try {
      const command = await import(`../../commands/${file}`);
      cmds.push(command.data.toJSON());
      client.commands.set(command.name, command);
      client.logs.info(`F | ✓ ${file}`);
    } catch (err) {
      client.logs.error({ err }, `F | ✘ ${file}`);
    }
  }
  // Register the commands
  if (process.env.environment === 'development') {
    // Testing server if development
    client.guilds.fetch(disc.bot.guildId).then((g) => g.commands.set(cmds));
  } else {
    // Global if production
    await client.application!.commands.set(cmds);
  }
  client.logs.debug(`F | ✦ Registered ${cmds.length} commands`);
  return;
}
