const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { ephemeralReply, ephemeralDefer } = require('../utils/ephemeralHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('applications')
    .setDescription('view open verify applications'),
  
  async execute(client, interaction) {
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (!member.roles.cache.has(process.env.STAFF_ROLE_ID)) {
        return await ephemeralReply(interaction, 'u cant run dis command silly :P');
      }
      
      const openApplications = [...client.activeVerifications.values()]
        .filter(v => v.step === 'staff_review' || v.step === 'question_response');
      
      if (openApplications.length === 0) {
        return await ephemeralReply(interaction, 'seems like there arent any open applications...');
      }
      
      const embed = new EmbedBuilder()
        .setTitle('Open Verification Applications')
        .setColor('#3498DB')
        .setDescription(`There are ${openApplications.length} open applications.`)
        .setTimestamp();
      
      for (const app of openApplications) {
        const user = await client.users.fetch(app.userId);
        
        embed.addFields({
          name: `${user.tag} (${user.id})`,
          value: `ID: ${app.applicationId || 'Unknown'}\nStarted: <t:${Math.floor(app.startTime / 1000)}:R>\nStatus: ${app.step === 'question_response' ? 'Waiting for staff review after question' : 'Waiting for staff review'}`
        });
      }
      
      await ephemeralReply(interaction, { embeds: [embed] });
    } catch (error) {
      console.error('wuh woh, sumthin went wrong:', error);
      await ephemeralReply(interaction, 'wuh woh, sumthin went wrong while fetchin applications.');
    }
  }
};