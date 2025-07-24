const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { ephemeralReply, ephemeralDefer, ephemeralEdit } = require('../utils/ephemeralHelper');
const { loadHistoryToMemory } = require('../modules/verificationManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('import-data')
    .setDescription('Import database data from a JSON file')
    .addStringOption(option => 
      option.setName('type')
        .setDescription('Type of data to import')
        .setRequired(true)
        .addChoices(
          { name: 'applications', value: 'applications' },
          { name: 'history', value: 'history' },
          { name: 'blacklist', value: 'blacklist' },
          { name: 'botState', value: 'botState' }
        ))
    .addAttachmentOption(option =>
      option.setName('file')
        .setDescription('JSON file to import')
        .setRequired(true))
    .addBooleanOption(option =>
      option.setName('overwrite')
        .setDescription('Overwrite existing data (defaults to true, set false to merge, not recommended)')
        .setRequired(false)),
  
  async execute(client, interaction) {
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (!member.roles.cache.has(process.env.STAFF_ROLE_ID)) {
        return await ephemeralReply(interaction, 'u cant run dis command silly :P');
      }

      await ephemeralDefer(interaction);
      
      const dataType = interaction.options.getString('type');
      const file = interaction.options.getAttachment('file');
      const overwrite = interaction.options.getBoolean('overwrite') ?? true;
      
      if (!file.name.endsWith('.json')) {
        return await ephemeralEdit(interaction, 'plz upload a .json file.');
      }
      
      const response = await fetch(file.url);
      if (!response.ok) {
        return await ephemeralEdit(interaction, 'Could not download the file.');
      }
      
      let importedData;
      try {
        const text = await response.text();
        importedData = JSON.parse(text);
      } catch (error) {
        return await ephemeralEdit(interaction, 'Invalid JSON file. Please check the format.');
      }
      
      const dataDir = path.join(__dirname, '..', '..', 'data');
      const filePath = path.join(dataDir, `${dataType}.json`);
      
      if (!overwrite && fs.existsSync(filePath)) {
        try {
          const existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          importedData = { ...existingData, ...importedData };
        } catch (error) {
          console.error('Error merging data:', error);
          return await ephemeralEdit(interaction, 'Error merging with existing data. File may be corrupted.');
        }
      }
      
      fs.writeFileSync(filePath, JSON.stringify(importedData, null, 2), 'utf8');
      
      if (dataType === 'history') {
        loadHistoryToMemory(client);
      }
      
      await ephemeralEdit(interaction, `Successfully imported ${dataType} data (${overwrite ? 'overwritten' : 'merged'}).`);
    } catch (error) {
      console.error('Error importing data:', error);
      if (interaction.deferred) {
        await ephemeralEdit(interaction, 'wuh woh, sumthin went wrong importing the data.');
      } else {
        await ephemeralReply(interaction, 'wuh woh, sumthin went wrong importing the data.');
      }
    }
  }
};