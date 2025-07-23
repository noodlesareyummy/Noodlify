const { EmbedBuilder } = require('discord.js');

async function handlePhotoRetryResponse(client, message, verification) {
  try {
    if (message.attachments.size > 0) {
      const { handlePhotoSubmission } = require('./photoSubmission');
      return handlePhotoSubmission(client, message, verification);
    }

    const response = message.content;

    const staffChannel = await client.channels.fetch(process.env.STAFF_CHANNEL_ID);

    try {
      const staffMessage = await staffChannel.messages.fetch(verification.staffMessageId);

      if (staffMessage) {
        const updatedEmbed = EmbedBuilder.from(staffMessage.embeds[0])
          .addFields({
            name: 'User Response',
            value: response
          });

        await staffMessage.edit({
          embeds: [updatedEmbed]
        });
      }
    } catch (err) {
      console.error('Could not update staff message with response:', err);
    }

    if (verification.photoRetryBy) {
      try {
        const pingMessage = await staffChannel.send({
          content: `<@${verification.photoRetryBy}> ${message.author.tag} responded to ur photo request: "${response}"`
        });

        setTimeout(() => {
          pingMessage.delete().catch(console.error);
        }, 10000);
      } catch (err) {
        console.error('Could not send staff ping message:', err);
      }
    }

    verification.step = 'photo_submission';
    client.activeVerifications.set(message.author.id, verification);

    await message.reply('ty for your response! plz send ur new verification photo now...');

    console.log(`Photo retry response received from ${message.author.tag}`);
  } catch (error) {
    console.error('Error handling photo retry response:', error);
    await message.reply('There was an error processing your response. plz try sending ur new photo directly.');

    verification.step = 'photo_submission';
    client.activeVerifications.set(message.author.id, verification);
  }
}

module.exports = { handlePhotoRetryResponse };