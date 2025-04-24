import { SlashCommandBuilder } from 'discord.js';
import { CmdFileArgs } from '../typings/Extensions.js';

export const name = 'example';
export const data = new SlashCommandBuilder()
  .setName(name)
  .setDescription('This is your first command!')
  .addStringOption((option) => {
    return option.setName('text').setDescription('The text to send in the response');
  });
export async function execute({ client, interaction, options }: CmdFileArgs): Promise<void> {
  const text = options.getString('text') ?? 'It works!';
  await interaction.editReply({
    content: `${client.user.username} says: '${text}'`
  });
}
