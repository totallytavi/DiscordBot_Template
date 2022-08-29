/* eslint-disable no-unused-vars */
// ^ REMOVE THIS LINE WHEN IN PRODUCTION
// eslint-disable-next-line no-unused-vars
const { SlashCommandBuilder, Client, CommandInteraction, CommandInteractionOptionResolver } = require("discord.js");

module.exports = {
  name: "command",
  data: new SlashCommandBuilder()
    .setName("command")
    .setDescription("Your first slash command"),
  /**
   * @param {Client} client
   *  @param {CommandInteraction} interaction
   * @param {CommandInteractionOptionResolver} options
   */
  async run(client, interaction, options) {
    await interaction.deferReply();
    return await interaction.editReply("It works!");
  }
};