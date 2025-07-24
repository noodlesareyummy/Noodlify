const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('export-data')
    .setDescription('Export database data as JSON files')
    .addStringOption(option => 
      option.setName('type')
        .setDescription('Type of data to export')
        .setRequired(true)
        .addChoices(
          { name: 'applications', value: 'applications' },
          { name: 'history', value: 'history' },
          { name: 'blacklist', value: 'blacklist' },
          { name: 'botState', value: 'botState' },
          { name: 'all', value: 'all' }
        )),
  
  async execute(client, interaction) {
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (!member.roles.cache.has(process.env.STAFF_ROLE_ID)) {
        return await interaction.reply({
          content: 'u cant run dis command silly :P',
          ephemeral: true
        });
      }

      await interaction.deferReply({ ephemeral: true });
      
      const dataType = interaction.options.getString('type');
      const dataDir = path.join(__dirname, '..', '..', 'data');
      
      if (dataType === 'all') {
        const files = ['applications.json', 'history.json', 'blacklist.json', 'botState.json'];
        const attachments = [];
        
        for (const file of files) {
          const filePath = path.join(dataDir, file);
          if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            attachments.push({
              attachment: Buffer.from(data),
              name: file
            });
          }
        }
        
        if (attachments.length === 0) {
          return await interaction.editReply('No data files found to export.');
        }
        
        return await interaction.editReply({
          content: `Exported ${attachments.length} database files.`,
          files: attachments
        });
      } else {
        const filePath = path.join(dataDir, `${dataType}.json`);
        
        if (!fs.existsSync(filePath)) {
          return await interaction.editReply(`No ${dataType} database file found.`);
        }
        
        const data = fs.readFileSync(filePath, 'utf8');
        
        await interaction.editReply({
          content: `Exported ${dataType} database:`,
          files: [{
            attachment: Buffer.from(data),
            name: `${dataType}.json`
          }]
        });
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      if (interaction.deferred) {
        await interaction.editReply('wuh woh, sumthin went wrong exporting the data.');
      } else {
        await interaction.reply({
          content: 'wuh woh, sumthin went wrong exporting the data.',
          ephemeral: true
        });
      }
    }
  }
};