const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

async function sendVerificationToStaff(client, user, verification) {
  try {
    const staffChannel = await client.channels.fetch(process.env.STAFF_CHANNEL_ID);
    
    const reviewId = `review_${Date.now()}_${user.id}`;
    verification.reviewId = reviewId;
    
    const staffEmbed = new EmbedBuilder()
      .setTitle(`Verification Request | ID: ${verification.applicationId}`)
      .setDescription(`
      **User:** ${user.tag} (${user.id})
      **Started:** <t:${Math.floor(verification.startTime / 1000)}:R>
      `)
      .setImage(verification.imageUrl)
      .setColor('#3498DB')
      .setTimestamp();
    
    const actionRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`approve_${reviewId}`)
          .setLabel('Approve')
          .setStyle(ButtonStyle.Success),
        
        new ButtonBuilder()
          .setCustomId(`deny_${reviewId}`)
          .setLabel('Deny')
          .setStyle(ButtonStyle.Danger),
        
        new ButtonBuilder()
          .setCustomId(`retry_${reviewId}`)
          .setLabel('Request New Photo')
          .setStyle(ButtonStyle.Secondary),
        
        new ButtonBuilder()
          .setCustomId(`question_${reviewId}`)
          .setLabel('Ask Question')
          .setStyle(ButtonStyle.Primary)
      );
    
    const staffMessage = await staffChannel.send({ 
      embeds: [staffEmbed], 
      components: [actionRow] 
    });
    
    verification.staffMessageId = staffMessage.id;
    client.activeVerifications.set(user.id, verification);
    
    console.log(`Verification for ${user.tag} sent to staff for review (ID: ${verification.applicationId})`);
  } catch (error) {
    console.error('Error sending verification to staff:', error);
  }
}

async function handleStaffReviewAction(client, interaction) {
  const [action, ...reviewIdParts] = interaction.customId.split('_');
  const reviewId = reviewIdParts.join('_');
  const userId = reviewId.split('_')[2];
  
  const verification = client.activeVerifications.get(userId);
  
  if (!verification) {
    return await interaction.reply({ 
      content: 'This verification session is no longer active.', 
      ephemeral: true 
    });
  }
  
  switch (action) {
    case 'approve':
      await handleApprove(client, interaction, verification, userId);
      break;
    
    case 'deny':
      await handleDeny(client, interaction, verification, userId);
      break;
    
    case 'question':
      await handleQuestion(client, interaction, verification, userId);
      break;
      
    case 'retry':
      await handleRetry(client, interaction, verification, userId);
      break;
  }
}

async function handleApprove(client, interaction, verification, userId) {
  try {
    const modal = new ModalBuilder()
      .setCustomId(`approve_feedback_${userId}`)
      .setTitle('Approval Feedback');
    
    const feedbackInput = new TextInputBuilder()
      .setCustomId('feedback')
      .setLabel('optional message or whatever')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('welcum to the servor')
      .setRequired(false)
      .setMaxLength(1000);
    
    const actionRow = new ActionRowBuilder().addComponents(feedbackInput);
    modal.addComponents(actionRow);
    
    await interaction.showModal(modal);
  } catch (error) {
    console.error('Error handling approval:', error);
    await interaction.reply({ 
      content: 'An error occurred while processing this approval.', 
      ephemeral: true 
    });
  }
}

async function handleDeny(client, interaction, verification, userId) {
  try {
    const modal = new ModalBuilder()
      .setCustomId(`deny_feedback_${userId}`)
      .setTitle('Denial Reason');
    
    const reasonInput = new TextInputBuilder()
      .setCustomId('reason')
      .setLabel('Reason for denial (will be sent to user)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('ur weird..')
      .setRequired(true)
      .setMaxLength(1000);
    
    const actionRow = new ActionRowBuilder().addComponents(reasonInput);
    modal.addComponents(actionRow);
    
    await interaction.showModal(modal);
  } catch (error) {
    console.error('Error handling denial:', error);
    await interaction.reply({ 
      content: 'An error occurred while processing this denial.', 
      ephemeral: true 
    });
  }
}

async function handleQuestion(client, interaction, verification, userId) {
  try {
    const modal = new ModalBuilder()
      .setCustomId(`question_modal_${userId}`)
      .setTitle('Ask Question');
    
    const questionInput = new TextInputBuilder()
      .setCustomId('question')
      .setLabel('ask question to the guy')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('r u real')
      .setRequired(true)
      .setMaxLength(1000);
    
    const actionRow = new ActionRowBuilder().addComponents(questionInput);
    modal.addComponents(actionRow);
    
    await interaction.showModal(modal);
  } catch (error) {
    console.error('Error handling question:', error);
    await interaction.reply({ 
      content: 'An error occurred while asking a question.', 
      ephemeral: true 
    });
  }
}

async function handleRetry(client, interaction, verification, userId) {
  try {
    const modal = new ModalBuilder()
      .setCustomId(`retry_photo_${userId}`)
      .setTitle('Request New Photo');
    
    const reasonInput = new TextInputBuilder()
      .setCustomId('reason')
      .setLabel('reason for the new pic request')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('ur ugly bleh...')
      .setRequired(true)
      .setMaxLength(1000);
    
    const actionRow = new ActionRowBuilder().addComponents(reasonInput);
    modal.addComponents(actionRow);
    
    await interaction.showModal(modal);
  } catch (error) {
    console.error('Error handling retry request:', error);
    await interaction.reply({ 
      content: 'An error occurred while requesting a new photo.', 
      ephemeral: true 
    });
  }
}

module.exports = {
  sendVerificationToStaff,
  handleStaffReviewAction,
  handleApprove,
  handleDeny,
  handleQuestion,
  handleRetry
};