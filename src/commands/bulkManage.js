const { SlashCommandBuilder } = require('discord.js');
const { denyAllVerifications } = require('../modules/verificationManager');
const { ephemeralReply, ephemeralEdit, ephemeralDefer } = require('../utils/ephemeralHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bulk-manage')
    .setDescription('Bulk manage verification applications')
    .addSubcommand(subcommand =>
      subcommand
        .setName('deny-all')
        .setDescription('Deny all pending verifications')
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Reason for denying')
            .setRequired(false))),
  
  async execute(client, interaction) {
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (!member.roles.cache.has(process.env.STAFF_ROLE_ID)) {
        return await ephemeralReply(interaction, 'u cant run dis command silly :P');
      }
      
      const subcommand = interaction.options.getSubcommand();
      
      if (subcommand === 'deny-all') {
        const reason = interaction.options.getString('reason') || 'Bulk denied by staff';
        
        await ephemeralDefer(interaction);
        
        const count = await denyAllVerifications(client, interaction.user.id, reason);
        
        if (count === 0) {
          await ephemeralEdit(interaction, 'theres nuthin to deny.');
        } else {
          await ephemeralEdit(interaction, `Successfully denied ${count} pending verifications. Reason: ${reason}`);
        }
      }
    } catch (error) {
      console.error('wuh woh, sumthin went wrong:', error);
      if (interaction.deferred) {
        await ephemeralEdit(interaction, 'wuh woh, sumthin went wrong while processing the command.');
      } else {
        await ephemeralReply(interaction, 'wuh woh, sumthin went wrong while processing the command.');
      }
    }
  }
};