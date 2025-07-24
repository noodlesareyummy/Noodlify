const { handleVerificationStart } = require('../modules/verificationStart');
const { handleStaffReviewAction } = require('../modules/staffReview');
const { handleModalSubmit } = require('../modules/modalHandler');
const { handleSlashCommands } = require('../modules/commandHandler');
const { handleAdminDbButtons } = require('../modules/adminDbHandler');

module.exports = {
  name: 'interactionCreate',
  async execute(client, interaction) {
    try {
      if (interaction.isButton() && interaction.customId === 'start_verification') {
        await handleVerificationStart(client, interaction);
      }

      if (interaction.isButton() && ['approve', 'deny', 'question', 'retry'].includes(interaction.customId.split('_')[0])) {
        await handleStaffReviewAction(client, interaction);
      }
      
      if (interaction.isButton() && ['confirm_clear', 'cancel_clear', 'confirm_remove', 'cancel_remove', 
                                    'confirm_prune', 'cancel_prune'].some(prefix => interaction.customId.startsWith(prefix))) {
        await handleAdminDbButtons(client, interaction);
      }

      if (interaction.isChatInputCommand()) {
        await handleSlashCommands(client, interaction);
      }

      if (interaction.isModalSubmit()) {
        await handleModalSubmit(client, interaction);
      }
    } catch (error) {
      console.error('wuh woh, sumthin went wrong with handling interaction:', error);
    }
  }
};