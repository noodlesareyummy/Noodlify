const { MessageFlags } = require('discord.js');

function ephemeralReply(interaction, options) {
  if (typeof options === 'string') {
    return interaction.reply({
      content: options,
      flags: MessageFlags.Ephemeral
    });
  }
  
  return interaction.reply({
    ...options,
    flags: MessageFlags.Ephemeral
  });
}

function ephemeralFollowUp(interaction, options) {
  if (typeof options === 'string') {
    return interaction.followUp({
      content: options,
      flags: MessageFlags.Ephemeral
    });
  }
  
  return interaction.followUp({
    ...options,
    flags: MessageFlags.Ephemeral
  });
}

function ephemeralEdit(interaction, options) {
  if (typeof options === 'string') {
    return interaction.editReply({
      content: options
    });
  }
  
  return interaction.editReply(options);
}

module.exports = { 
  ephemeralReply, 
  ephemeralFollowUp, 
  ephemeralEdit 
};