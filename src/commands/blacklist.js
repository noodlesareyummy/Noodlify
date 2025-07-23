const { SlashCommandBuilder } = require('discord.js');
const { blacklistUser, removeBlacklist, isBlacklisted, getAllBlacklisted } = require('../utils/cooldownManager');
const { cancelVerification } = require('../modules/verificationManager');
const { ephemeralReply } = require('../utils/ephemeralHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Manage verification blacklist')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a user to the blacklist')
        .addUserOption(option => 
          option.setName('user')
            .setDescription('The user to blacklist')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Reason for blacklisting')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a user from the blacklist')
        .addUserOption(option => 
          option.setName('user')
            .setDescription('The user to remove from blacklist')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all blacklisted users')),
  
  async execute(client, interaction) {
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (!member.roles.cache.has(process.env.STAFF_ROLE_ID)) {
        return await ephemeralReply(interaction, 'u cant run dis command silly :P');
      }
      
      const subcommand = interaction.options.getSubcommand();
      
      if (subcommand === 'add') {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'no reason given';
        
        if (isBlacklisted(targetUser.id)) {
          return await ephemeralReply(interaction, `${targetUser.tag} is already blacklisted.`);
        }
        
        blacklistUser(targetUser.id, reason);
        
        if (client.activeVerifications.has(targetUser.id)) {
          cancelVerification(client, targetUser.id, 'User was blacklisted');
        }
        
        return await ephemeralReply(interaction, `${targetUser.tag} has been added to the verification blacklist. Reason: ${reason}`);
      }
      
      else if (subcommand === 'remove') {
        const targetUser = interaction.options.getUser('user');
        
        if (removeBlacklist(targetUser.id)) {
          return await ephemeralReply(interaction, `${targetUser.tag} no longer blacklisted`);
        } else {
          return await ephemeralReply(interaction, `${targetUser.tag} isnt even blacklisted dumdum`);
        }
      }
      
      else if (subcommand === 'list') {
        const blacklist = getAllBlacklisted();
        
        if (blacklist.size === 0) {
          return await ephemeralReply(interaction, 'nuthin to show here :P');
        }
        
        let response = '**Blacklisted Users:**\n';
        
        for (const [userId, data] of blacklist.entries()) {
          try {
            const user = await client.users.fetch(userId);
            response += `- ${user.tag} (${userId}): ${data.reason}\n`;
          } catch {
            response += `- Unknown User (${userId}): ${data.reason}\n`;
          }
        }
        
        return await ephemeralReply(interaction, response);
      }
    } catch (error) {
      console.error('wuh woh, sumthin went wrong:', error);
      await ephemeralReply(interaction, 'wuh woh, sumthin went wrong while managing the blacklist.');
    }
  }
};