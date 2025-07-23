const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { HistoryDB, ApplicationDB } = require('../utils/databaseManager');
const { ephemeralReply } = require('../utils/ephemeralHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lookup')
    .setDescription('Look up verification applications')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to look up')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('application-id')
        .setDescription('The application ID to look up')
        .setRequired(false))
    .addBooleanOption(option =>
      option.setName('list-all')
        .setDescription('List all application IDs')
        .setRequired(false)),

  async execute(client, interaction) {
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (!member.roles.cache.has(process.env.STAFF_ROLE_ID)) {
        return await ephemeralReply(interaction, 'u cant run dis command silly :P');
      }

      const targetUser = interaction.options.getUser('user');
      const applicationId = interaction.options.getString('application-id');
      const listAll = interaction.options.getBoolean('list-all');

      if (!targetUser && !applicationId && !listAll) {
        return await ephemeralReply(interaction, 'plz give a user, application ID, or enable the list-all option.');
      }

      if (listAll) {
        return await handleListAll(client, interaction);
      }

      let filteredHistory;

      if (applicationId && !targetUser) {
        const exactMatch = ApplicationDB.get(applicationId);
        if (exactMatch) {
          return await showSingleApplication(client, interaction, exactMatch);
        }

        filteredHistory = HistoryDB.getByApplication(applicationId);
      } else if (targetUser && !applicationId) {
        filteredHistory = [...client.applicationHistory.values()]
          .filter(entry => entry.userId === targetUser.id)
          .sort((a, b) => b.timestamp - a.timestamp);

        if (filteredHistory.length === 0) {
          return await interaction.reply({
            content: `nuthin found for: ${targetUser.tag}.`,
            ephemeral: true
          });
        }
      } else if (targetUser && applicationId) {
        filteredHistory = [...client.applicationHistory.values()]
          .filter(entry =>
            entry.userId === targetUser.id &&
            entry.applicationId &&
            entry.applicationId.includes(applicationId))
          .sort((a, b) => b.timestamp - a.timestamp);

        if (filteredHistory.length === 0) {
          return await interaction.reply({
            content: `nuthin found for: ${targetUser.tag} with application ID containing: ${applicationId}`,
            ephemeral: true
          });
        }
      }

      await showApplicationHistory(client, interaction, filteredHistory, targetUser);
    } catch (error) {
      console.error('wuh woh, sumthin went wrong with the lookup command:', error);
      await interaction.reply({
        content: 'wuh woh, sumthin went wrong while looking up applications.',
        ephemeral: true
      });
    }
  }
};

async function handleListAll(client, interaction) {
  const applications = [...client.applicationHistory.values()]
    .sort((a, b) => b.timestamp - a.timestamp);

  if (applications.length === 0) {
    return await interaction.reply({
      content: 'theres nuthin here...',
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('All Verification Applications')
    .setColor('#9B59B6')
    .setDescription(`Found ${applications.length} total applications.`)
    .setTimestamp();

  const itemsPerPage = 10;
  const totalPages = Math.ceil(applications.length / itemsPerPage);

  const firstPageItems = applications.slice(0, itemsPerPage);

  for (const app of firstPageItems) {
    let user;
    try {
      user = await client.users.fetch(app.userId);
    } catch {
      user = { tag: 'Unknown User', id: app.userId };
    }

    const statusEmoji = app.status === 'approved' ? '✅' : '❌';
    const date = new Date(app.timestamp).toLocaleDateString();

    embed.addFields({
      name: `${statusEmoji} ${app.applicationId || 'Unknown ID'}`,
      value: `User: ${user.tag}\nStatus: ${app.status}\nDate: ${date}\nUse \`/lookup application-id:${app.applicationId}\` for details`
    });
  }

  if (totalPages > 1) {
    embed.setFooter({
      text: `Page 1/${totalPages} • Showing ${firstPageItems.length} of ${applications.length} applications`
    });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function showSingleApplication(client, interaction, application) {
  let user;
  let moderator;

  try {
    user = await client.users.fetch(application.userId);
  } catch {
    user = { tag: 'Unknown User', id: application.userId };
  }

  try {
    moderator = await client.users.fetch(application.moderatorId);
  } catch {
    moderator = { tag: 'Unknown Moderator', id: application.moderatorId };
  }

  const timestamp = application.completedAt || application.timestamp || application.startTime;
  const formattedTime = timestamp ? `<t:${Math.floor(timestamp / 1000)}:F>` : 'Unknown';

  let statusColor;
  switch (application.status) {
    case 'approved':
      statusColor = '#2ECC71';
      break;
    case 'denied':
      statusColor = '#E74C3C';
      break;
    case 'cancelled':
      statusColor = '#808080';
      break;
    default:
      statusColor = '#3498DB';
  }

  const embed = new EmbedBuilder()
    .setTitle(`Application: ${application.applicationId}`)
    .setColor(statusColor)
    .setDescription(`Status: **${application.status ? application.status.toUpperCase() : 'IN PROGRESS'}**`)
    .addFields(
      { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
      { name: 'Moderator', value: moderator?.tag || 'None', inline: true },
      { name: 'Date', value: formattedTime, inline: true }
    );

  if (application.startTime && application.startTime !== timestamp) {
    embed.addFields({
      name: 'Started',
      value: `<t:${Math.floor(application.startTime / 1000)}:F>`,
      inline: true
    });
  }

  if (application.reason) {
    embed.addFields({ name: 'Reason/Feedback', value: application.reason });
  }

  if (user.displayAvatarURL) {
    embed.setThumbnail(user.displayAvatarURL());
  }

  embed.setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function showApplicationHistory(client, interaction, history, targetUser) {
  const embed = new EmbedBuilder()
    .setTitle(targetUser
      ? `Verification History for ${targetUser.tag}`
      : 'Application Search Results')
    .setColor('#9B59B6')
    .setDescription(`Found ${history.length} verification entries.`)
    .setTimestamp();

  if (targetUser) {
    embed.setThumbnail(targetUser.displayAvatarURL());
  }

  for (const entry of history) {
    let user;
    let moderator;

    if (!targetUser) {
      try {
        user = await client.users.fetch(entry.userId);
      } catch {
        user = { tag: 'Unknown User', id: entry.userId };
      }
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
      value: `${!targetUser ? `User: ${user.tag}\n` : ''}Status: ${entry.status}\nModerator: ${moderator.tag}\nTime: <t:${Math.floor(entry.timestamp / 1000)}:R>${entry.reason ? `\nReason/Feedback: ${entry.reason}` : ''}`
    });
  }

  await interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}