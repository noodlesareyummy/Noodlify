const { EmbedBuilder } = require('discord.js');

async function handleQuestionResponse(client, message, verification) {
  try {
    const response = message.content;
    
    const staffChannel = await client.channels.fetch(process.env.STAFF_CHANNEL_ID);
    const staffMessage = await staffChannel.messages.fetch(verification.staffMessageId);
    
    const updatedEmbed = EmbedBuilder.from(staffMessage.embeds[0])
      .addFields({ 
        name: 'User Response', 
        value: response 
      });
    
    await staffMessage.edit({ 
      embeds: [updatedEmbed]
    });
    
    if (verification.lastQuestionBy) {
      const pingMessage = await staffChannel.send({
        content: `<@${verification.lastQuestionBy}> ${message.author.tag} has responded to ur question!`
      });
      
      setTimeout(() => {
        pingMessage.delete().catch(console.error);
      }, 10000);
    }
    
    verification.step = 'staff_review';
    client.activeVerifications.set(message.author.id, verification);
    
    await message.reply('ty for ur response, staff will review it soon maybe (joking)');
    
    console.log(`Response received from ${message.author.tag}`);
  } catch (error) {
    console.error('Error handling question response:', error);
    await message.reply('There was an error sending your response to the staff. Please try again.');
  }
}

module.exports = { handleQuestionResponse };