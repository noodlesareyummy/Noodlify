const { EmbedBuilder } = require('discord.js');
const { addToHistory } = require('./verificationManager');
const { setCooldown } = require('../utils/cooldownManager');

async function handleModalSubmit(client, interaction) {
  const [action, type, userId] = interaction.customId.split('_');
  const verification = client.activeVerifications.get(userId);

  if (!verification) {
    return await interaction.reply({
      content: 'This verification is no longer active.',
      ephemeral: true
    });
  }

  switch (`${action}_${type}`) {
    case 'approve_feedback':
      await completeApproval(client, interaction, verification, userId);
      break;

    case 'deny_feedback':
      await completeDenial(client, interaction, verification, userId);
      break;

    case 'question_modal':
      await sendQuestionToUser(client, interaction, verification, userId);
      break;

    case 'retry_photo':
      await requestNewPhoto(client, interaction, verification, userId);
      break;
  }
}

async function completeApproval(client, interaction, verification, userId) {
  try {
    const feedback = interaction.fields.getTextInputValue('feedback');

    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    const member = await guild.members.fetch(userId);

    await member.roles.add(process.env.VERIFIED_ROLE_ID);
    await member.roles.remove(process.env.UNVERIFIED_ROLE_ID);

    const user = await client.users.fetch(userId);
    let message = 'Yierpie! u got approved :D';
    if (feedback) message += `\n\nStaff feedback: ${feedback}`;

    await user.send(message);

    const staffChannel = await client.channels.fetch(process.env.STAFF_CHANNEL_ID);
    const staffMessage = await staffChannel.messages.fetch(verification.staffMessageId);

    const updatedEmbed = EmbedBuilder.from(staffMessage.embeds[0])
      .setTitle(`Verification Approved | ID: ${verification.applicationId}`)
      .setColor('#2ECC71')
      .addFields({ name: 'Approved by', value: `${interaction.user.tag}` });

    if (feedback) {
      updatedEmbed.addFields({ name: 'Feedback', value: feedback });
    }

    await staffMessage.edit({
      embeds: [updatedEmbed],
      components: []
    });

    addToHistory(client, userId, 'approved', interaction.user.id, feedback, verification.applicationId);

    clearTimeout(verification.timeout);
    client.activeVerifications.delete(userId);

    await interaction.reply({
      content: `Verification for ${user.tag} has been approved.`,
      ephemeral: true
    });

    console.log(`Verification for ${user.tag} approved by ${interaction.user.tag}`);
  } catch (error) {
    console.error('Error completing approval:', error);
    await interaction.reply({
      content: 'An error occurred while processing this approval.',
      ephemeral: true
    });
  }
}

async function completeDenial(client, interaction, verification, userId) {
  try {
    const reason = interaction.fields.getTextInputValue('reason');

    const user = await client.users.fetch(userId);
    await user.send(`ur verification got denied... Reason: ${reason}\n\nbuuuut u can try again after a 5-minute cooldown :P`);

    const staffChannel = await client.channels.fetch(process.env.STAFF_CHANNEL_ID);
    const staffMessage = await staffChannel.messages.fetch(verification.staffMessageId);

    const updatedEmbed = EmbedBuilder.from(staffMessage.embeds[0])
      .setTitle(`Verification Denied | ID: ${verification.applicationId}`)
      .setColor('#E74C3C')
      .addFields({ name: 'Denied by', value: `${interaction.user.tag}` })
      .addFields({ name: 'Reason', value: reason });

    await staffMessage.edit({
      embeds: [updatedEmbed],
      components: []
    });

    addToHistory(client, userId, 'denied', interaction.user.id, reason, verification.applicationId);
    setCooldown(userId, reason);

    clearTimeout(verification.timeout);
    client.activeVerifications.delete(userId);

    await interaction.reply({
      content: `Verification for ${user.tag} has been denied.`,
      ephemeral: true
    });

    console.log(`Verification for ${user.tag} denied by ${interaction.user.tag}`);
  } catch (error) {
    console.error('Error completing denial:', error);
    await interaction.reply({
      content: 'An error occurred while processing this denial.',
      ephemeral: true
    });
  }
}

async function sendQuestionToUser(client, interaction, verification, userId) {
  try {
    const question = interaction.fields.getTextInputValue('question');

    const user = await client.users.fetch(userId);
    await user.send(`**Staff question:** ${question}\n\nplz respond with ur response...`);

    verification.step = 'question_response';
    verification.lastQuestion = question;
    verification.lastQuestionBy = interaction.user.id;
    client.activeVerifications.set(userId, verification);

    const staffChannel = await client.channels.fetch(process.env.STAFF_CHANNEL_ID);
    const staffMessage = await staffChannel.messages.fetch(verification.staffMessageId);

    const updatedEmbed = EmbedBuilder.from(staffMessage.embeds[0])
      .addFields({
        name: `Question from ${interaction.user.tag}`,
        value: question
      });

    await staffMessage.edit({
      embeds: [updatedEmbed]
    });

    await interaction.reply({
      content: `Question sent to the user. Waiting for their response.`,
      ephemeral: true
    });

    console.log(`Question sent to ${user.tag} by ${interaction.user.tag}`);
  } catch (error) {
    console.error('Error sending question:', error);
    await interaction.reply({
      content: 'An error occurred while sending the question.',
      ephemeral: true
    });
  }
}

async function requestNewPhoto(client, interaction, verification, userId) {
  try {
    const reason = interaction.fields.getTextInputValue('reason');

    const user = await client.users.fetch(userId);

    const photoEmbed = new EmbedBuilder()
      .setTitle('Photo Request')
      .setDescription(`
      A staff member asked for a new verification photo:

      **Reason:** ${reason}
      
      You can respond with any questions or comments first, then send a new photo with:
      1. Your hand making a 🤙 gesture
      2. A paper showing the server name and the last 6 letters of your username
         (or your entire username if it's less than 6 letters)
      
      You can blur or cover ur face if u want...
      `)
      .setColor('#FF9900');

    await user.send({ embeds: [photoEmbed] });

    verification.step = 'photo_retry_response';
    verification.photoAttempts = 0;
    verification.photoRetry = true;
    verification.photoRetryReason = reason;
    verification.photoRetryBy = interaction.user.id;

    const staffChannel = await client.channels.fetch(process.env.STAFF_CHANNEL_ID);

    try {
      if (verification.staffMessageId) {
        try {
          const oldMessage = await staffChannel.messages.fetch(verification.staffMessageId);
          if (oldMessage) {
            await oldMessage.delete();
            console.log(`Deleted old staff message: ${verification.staffMessageId}`);
          }
        } catch (err) {
          console.error('Failed to delete old staff message:', err);
        }
      }

      const newStaffEmbed = new EmbedBuilder()
        .setTitle(`Awaiting New Photo | ID: ${verification.applicationId}`)
        .setDescription(`
        **User:** ${user.tag} (${user.id})
        **Started:** <t:${Math.floor(verification.startTime / 1000)}:R>
        `)
        .setImage(verification.imageUrl)
        .setColor('#FF9900')
        .addFields({
          name: 'New Photo Requested',
          value: `${interaction.user.tag} requested a new photo: ${reason}`
        });

      const newStaffMessage = await staffChannel.send({
        content: `${interaction.user} requested a new photo from ${user.tag}`,
        embeds: [newStaffEmbed]
      });

      setTimeout(async () => {
        try {
          await newStaffMessage.edit({
            content: null,
            embeds: [newStaffEmbed]
          });
        } catch (error) {
          console.error('Error removing staff ping:', error);
        }
      }, 5000);

      verification.staffMessageId = newStaffMessage.id;
      client.activeVerifications.set(userId, verification);

    } catch (error) {
      console.error('Error updating staff message:', error);
    }

    await interaction.reply({
      content: `New photo requested from the user. Reason: ${reason}`,
      ephemeral: true
    });

    addToHistory(client, userId, 'photo_retry', interaction.user.id, reason, verification.applicationId);

    console.log(`New photo requested from ${user.tag} by ${interaction.user.tag}`);
  } catch (error) {
    console.error('Error requesting new photo:', error);
    await interaction.reply({
      content: 'An error occurred while requesting a new photo.',
      ephemeral: true
    });
  }
}

module.exports = { handleModalSubmit };