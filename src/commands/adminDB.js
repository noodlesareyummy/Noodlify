const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { HistoryDB, ApplicationDB, BlacklistDB } = require('../utils/databaseManager');
const { ephemeralReply, ephemeralDefer } = require('../utils/ephemeralHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin-db')
    .setDescription('Admin database management')
    .addSubcommand(subcommand =>
      subcommand
        .setName('clear')
        .setDescription('Clear a specific database completely')
        .addStringOption(option => 
          option.setName('type')
            .setDescription('Type of database to clear')
            .setRequired(true)
            .addChoices(
              { name: 'applications', value: 'applications' },
              { name: 'history', value: 'history' },
              { name: 'blacklist', value: 'blacklist' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove-user')
        .setDescription('Remove all data for a specific user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User to remove data for')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('type')
            .setDescription('Type of data to remove')
            .setRequired(true)
            .addChoices(
              { name: 'applications', value: 'applications' },
              { name: 'history', value: 'history' },
              { name: 'blacklist', value: 'blacklist' },
              { name: 'all', value: 'all' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('prune')
        .setDescription('Prune old records')
        .addStringOption(option => 
          option.setName('type')
            .setDescription('Type of data to prune')
            .setRequired(true)
            .addChoices(
              { name: 'applications', value: 'applications' },
              { name: 'history', value: 'history' }
            ))
        .addIntegerOption(option =>
          option.setName('days')
            .setDescription('Remove records older than this many days')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(365))),
  
  async execute(client, interaction) {
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (!member.roles.cache.has(process.env.STAFF_ROLE_ID)) {
        return await interaction.reply({
          content: 'u cant run dis command silly :P',
          ephemeral: true
        });
      }
      
      const subcommand = interaction.options.getSubcommand();
      
      if (subcommand === 'clear') {
        const dataType = interaction.options.getString('type');
        
        const confirmButton = new ButtonBuilder()
          .setCustomId(`confirm_clear_${dataType}`)
          .setLabel('Yes, clear everything')
          .setStyle(ButtonStyle.Danger);
          
        const cancelButton = new ButtonBuilder()
          .setCustomId('cancel_clear')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Secondary);
          
        const row = new ActionRowBuilder()
          .addComponents(confirmButton, cancelButton);
          
        await interaction.reply({
          content: `r u sure u want to clear the entire ${dataType} database...? dis can't be undone...`,
          components: [row],
          ephemeral: true
        });
        
        const filter = i => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ 
          filter, 
          time: 30000,
          max: 1
        });
        
        collector.on('collect', async i => {
          if (i.customId === `confirm_clear_${dataType}`) {
            await clearDatabase(dataType, client);
            await i.update({
              content: `${dataType} database has been cleared!`,
              components: []
            });
          } else if (i.customId === 'cancel_clear') {
            await i.update({
              content: 'Database clear operation cancelled.',
              components: []
            });
          }
        });
        
        collector.on('end', async collected => {
          if (collected.size === 0) {
            await interaction.editReply({
              content: 'Operation timed out.',
              components: []
            });
          }
        });
      }
      
      else if (subcommand === 'remove-user') {
        const user = interaction.options.getUser('user');
        const dataType = interaction.options.getString('type');
        
        const confirmButton = new ButtonBuilder()
          .setCustomId(`confirm_remove_${user.id}_${dataType}`)
          .setLabel('Yes, remove data')
          .setStyle(ButtonStyle.Danger);
          
        const cancelButton = new ButtonBuilder()
          .setCustomId('cancel_remove')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Secondary);
          
        const row = new ActionRowBuilder()
          .addComponents(confirmButton, cancelButton);
          
        await interaction.reply({
          content: `u sure u want to remove ${dataType === 'all' ? 'ALL' : dataType} data for ${user.tag}? dis can't be undone...`,
          components: [row],
          ephemeral: true
        });
        
        const filter = i => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ 
          filter, 
          time: 30000,
          max: 1
        });
        
        collector.on('collect', async i => {
          if (i.customId === `confirm_remove_${user.id}_${dataType}`) {
            const result = await removeUserData(user.id, dataType);
            await i.update({
              content: `Removed ${result.removed} entries for ${user.tag} from ${dataType === 'all' ? 'all databases' : `the ${dataType} database`}.`,
              components: []
            });
          } else if (i.customId === 'cancel_remove') {
            await i.update({
              content: 'User data removal cancelled.',
              components: []
            });
          }
        });
        
        collector.on('end', async collected => {
          if (collected.size === 0) {
            await interaction.editReply({
              content: 'Operation timed out.',
              components: []
            });
          }
        });
      }
      
      else if (subcommand === 'prune') {
        const dataType = interaction.options.getString('type');
        const days = interaction.options.getInteger('days');
        
        // Create confirmation buttons
        const confirmButton = new ButtonBuilder()
          .setCustomId(`confirm_prune_${dataType}_${days}`)
          .setLabel('Yes, prune old data')
          .setStyle(ButtonStyle.Danger);
          
        const cancelButton = new ButtonBuilder()
          .setCustomId('cancel_prune')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Secondary);
          
        const row = new ActionRowBuilder()
          .addComponents(confirmButton, cancelButton);
          
        await interaction.reply({
          content: `u sure u want to remove ${dataType} entries older than ${days} days? dis cant be undone...`,
          components: [row],
          ephemeral: true
        });
        
        const filter = i => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ 
          filter, 
          time: 30000,
          max: 1
        });
        
        collector.on('collect', async i => {
          if (i.customId === `confirm_prune_${dataType}_${days}`) {
            const result = await pruneOldData(dataType, days);
            await i.update({
              content: `Pruned ${result.removed} old entries from the ${dataType} database.`,
              components: []
            });
          } else if (i.customId === 'cancel_prune') {
            await i.update({
              content: 'Prune operation cancelled.',
              components: []
            });
          }
        });
        
        collector.on('end', async collected => {
          if (collected.size === 0) {
            await interaction.editReply({
              content: 'Operation timed out.',
              components: []
            });
          }
        });
      }
    } catch (error) {
      console.error('Error with admin-db command:', error);
      if (interaction.deferred) {
        await interaction.editReply('wuh woh, sumthin went wrong with the database operation.');
      } else {
        await interaction.reply({
          content: 'wuh woh, sumthin went wrong with the database operation.',
          ephemeral: true
        });
      }
    }
  }
};


async function clearDatabase(dataType, client) {
  const dataDir = path.join(__dirname, '..', '..', 'data');
  const filePath = path.join(dataDir, `${dataType}.json`);
  
  fs.writeFileSync(filePath, JSON.stringify({}, null, 2), 'utf8');
  
  if (dataType === 'history' && client) {
    client.applicationHistory.clear();
  }
  
  return true;
}

async function removeUserData(userId, dataType) {
  let removed = 0;
  
  if (dataType === 'all' || dataType === 'applications') {
    const applications = ApplicationDB.findByUser(userId);
    for (const app of applications) {
      ApplicationDB.delete(app.applicationId);
      removed++;
    }
  }
  
  if (dataType === 'all' || dataType === 'history') {
    const history = HistoryDB.getByUser(userId);
    for (const entry of history) {
      const db = HistoryDB.getAll();
      const entryKey = Object.keys(db).find(key => db[key].id === entry.id);
      if (entryKey) {
        delete db[entryKey];
        removed++;
      }
    }
    const dataDir = path.join(__dirname, '..', '..', 'data');
    const filePath = path.join(dataDir, 'history.json');
    fs.writeFileSync(filePath, JSON.stringify(HistoryDB.getAll(), null, 2), 'utf8');
  }
  
  if (dataType === 'all' || dataType === 'blacklist') {
    if (BlacklistDB.isBlacklisted(userId)) {
      BlacklistDB.remove(userId);
      removed++;
    }
  }
  
  return { removed };
}

async function pruneOldData(dataType, days) {
  const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
  let removed = 0;
  
  if (dataType === 'applications') {
    const applications = ApplicationDB.getAll();
    for (const [id, app] of Object.entries(applications)) {
      if (app.completedAt && app.completedAt < cutoffTime) {
        ApplicationDB.delete(id);
        removed++;
      }
    }
  }
  
  if (dataType === 'history') {
    const history = HistoryDB.getAll();
    const newHistory = {};
    
    for (const [id, entry] of Object.entries(history)) {
      if (entry.timestamp && entry.timestamp >= cutoffTime) {
        newHistory[id] = entry;
      } else {
        removed++;
      }
    }
    
    const dataDir = path.join(__dirname, '..', '..', 'data');
    const filePath = path.join(dataDir, 'history.json');
    fs.writeFileSync(filePath, JSON.stringify(newHistory, null, 2), 'utf8');
  }
  
  return { removed };
}