const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

async function setupVerificationChannel(client) {
  const verifyChannel = await client.channels.fetch(process.env.VERIFY_CHANNEL_ID);
  
  try {
    const messages = await verifyChannel.messages.fetch({ limit: 10 });
    if (messages.size > 0) {
      await verifyChannel.bulkDelete(messages);
    }
  } catch (error) {
    console.error('Error clearing channel:', error);
  }
  
  const verifyEmbed = new EmbedBuilder()
    .setTitle('Server Verification')
    .setDescription(`
    **Instructions to verify...**
    
    1. Take a pic with your thumb and pinkie out like dis (🤙)
    2. Include a paper with the name of the server and the last 6 letters of ur username
       (if you have less than 6 letters, simply write your entire username)
    3. Click the button below to start the verification process
    4. Follow the instructions from the bot in ur DMs

    *You can blur or cover ur face if u want...
    `)
    .setColor('#FF5733')
    .setFooter({ text: 'yes u need to verif to see the entire server duh' });
  
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('start_verification')
        .setLabel('Start Verification')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✅')
    );
  
  await verifyChannel.send({ embeds: [verifyEmbed], components: [row] });
  console.log('Verification channel setup complete!');
}

module.exports = { setupVerificationChannel };