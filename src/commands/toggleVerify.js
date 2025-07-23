const { SlashCommandBuilder } = require('discord.js');
const { cancelAllVerifications } = require('../modules/verificationManager');
const { setStateValue, getStateValue } = require('../utils/stateManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('toggle-verification')
    .setDescription('Enable or disable the verification system')
    .addBooleanOption(option => 
      option.setName('enabled')
        .setDescription('Whether verification should be enabled')
        .setRequired(true))
    .addBooleanOption(option => 
      option.setName('cancel-active')
        .setDescription('Cancel all active verifications')
        .setRequired(false)),
  
  async execute(client, interaction) {
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (!member.roles.cache.has(process.env.STAFF_ROLE_ID)) {
        return await interaction.reply({
          content: 'u cant run dis command silly :P',
          ephemeral: true
        });
      }
      
      const enabled = interaction.options.getBoolean('enabled');
      const cancelActive = interaction.options.getBoolean('cancel-active') || false;
      
      client.verificationDisabled = !enabled;
      setStateValue('verificationEnabled', enabled);
      
      let response = `Verification system is now ${enabled ? 'enabled' : 'disabled'}.`;
      
      if (!enabled && cancelActive) {
        const cancelCount = await cancelAllVerifications(client, 'nuh uh, try later. verifying is temp disabled...');
        response += `\nCancelled ${cancelCount} active verification processes.`;
      }
      
      await interaction.reply({
        content: response,
        ephemeral: true
      });
    } catch (error) {
      console.error('wuh woh, sumthin went wrong with handling toggle-verification command:', error);
      await interaction.reply({
        content: 'wuh woh, sumthin went wrong while toggling verification.',
        ephemeral: true
      });
    }
  }
};