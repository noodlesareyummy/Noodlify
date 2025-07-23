const { handleVerificationStart } = require('../modules/verificationStart');
const { handleStaffReviewAction } = require('../modules/staffReview');
const { handleModalSubmit } = require('../modules/modalHandler');
const { handleSlashCommands } = require('../modules/commandHandler');

module.exports = {
  name: 'interactionCreate',
  async execute(client, interaction) {
    try {
      // Handle verification start button
      if (interaction.isButton() && interaction.customId === 'start_verification') {
        await handleVerificationStart(client, interaction);
      }

      // Handle staff review buttons
      if (interaction.isButton() && ['approve', 'deny', 'question', 'retry'].includes(interaction.customId.split('_')[0])) {
        await handleStaffReviewAction(client, interaction);
      }

      // Handle slash commands
      if (interaction.isChatInputCommand()) {
        await handleSlashCommands(client, interaction);
      }

      // Handle modal submissions
      if (interaction.isModalSubmit()) {
        await handleModalSubmit(client, interaction);
      }
    } catch (error) {
      console.error('wuh woh, sumthin went wrong with handling interaction:', error);
    }
  }
};