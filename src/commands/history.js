const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { HistoryDB } = require('../utils/databaseManager');
const { ephemeralReply, ephemeralDefer } = require('../utils/ephemeralHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('View application history')
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Number of results to show (default: 10, max: 25)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(25)),

  async execute(client, interaction) {
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (!member.roles.cache.has(process.env.STAFF_ROLE_ID)) {
        return await ephemeralReply(interaction, 'u cant run dis command silly :P');
      }

      const limit = interaction.options.getInteger('limit') || 10;

      const recentHistory = HistoryDB.getRecent(limit);

      if (recentHistory.length === 0) {
        return await ephemeralReply(interaction, 'theres nuthin here yet.');
      }

      const embed = new EmbedBuilder()
        .setTitle('Recent Verification History')
        .setColor('#9B59B6')
        .setDescription(`Showing the ${recentHistory.length} most recent verification entries.`)
        .setTimestamp();

      for (const entry of recentHistory) {
        let user;
        let moderator;

        try {
          user = await client.users.fetch(entry.userId);
        } catch {
          user = { tag: 'Unknown User', id: entry.userId };
        }

        try {
          moderator = await client.users.fetch(entry.moderatorId);
        } catch {
          moderator = { tag: 'Unknown Moderator', id: entry.moderatorId };
        }

        const statusColors = {
          approved: '✅',
          denied: '❌',
          cancelled: '⏱️',
          photo_retry: '📸'
        };

        const statusEmoji = statusColors[entry.status] || '❓';

        embed.addFields({
          name: `${statusColors[entry.status]} ${entry.applicationId || 'Unknown ID'}`,
          value: `User: ${user.tag} (${user.id})\nStatus: ${entry.status}\nModerator: ${moderator.tag}\nTime: <t:${Math.floor(entry.timestamp / 1000)}:R>${entry.reason ? `\nReason/Feedback: ${entry.reason}` : ''}`
        });
      }

      await ephemeralReply(interaction, { embeds: [embed] });
    } catch (error) {
      console.error('wuh woh, sumthin went wrong with the history command:', error);
      await interaction.reply({
        content: 'wuh woh, sumthin went wrong while fetching history.',
        ephemeral: true
      });
    }
  }
};