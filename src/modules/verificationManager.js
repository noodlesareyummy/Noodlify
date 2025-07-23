const { EmbedBuilder } = require('discord.js');
const config = require('../../config/config');
const { setCooldown } = require('../utils/cooldownManager');
const { HistoryDB, ApplicationDB } = require('../utils/databaseManager');

function generateRandomCode(length = config.verificationCodeLength) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters.charAt(randomIndex);
  }

  return code;
}

async function cancelVerification(client, userId, reason = 'Timeout') {
  try {
    const verification = client.activeVerifications.get(userId);
    
    if (!verification) {
      return false;
    }
    
    if (verification.timeout) {
      clearTimeout(verification.timeout);
    }

    try {
      const user = await client.users.fetch(userId);
      await user.send(`ur verification process has been cancelled. Reason: ${reason}`);
    } catch (error) {
      console.error(`Could not notify user ${userId} about cancellation:`, error);
    }

    if (verification.staffMessageId) {
      try {
        const staffChannel = await client.channels.fetch(process.env.STAFF_CHANNEL_ID);
        if (!staffChannel) throw new Error('Staff channel not found');
        
        const staffMessage = await staffChannel.messages.fetch(verification.staffMessageId);
        if (!staffMessage) throw new Error('Staff message not found');

        const updatedEmbed = EmbedBuilder.from(staffMessage.embeds[0])
          .setTitle(`Verification Cancelled | ID: ${verification.applicationId || 'Unknown'}`)
          .setColor('#808080')
          .addFields({
            name: 'Status',
            value: `Cancelled: ${reason}`
          });

        await staffMessage.edit({
          embeds: [updatedEmbed],
          components: []
        });
      } catch (error) {
        console.error(`Could not update staff message for cancelled verification (${userId}):`, error);
      }
    }

    if (verification.applicationId) {
      addToHistory(client, userId, 'cancelled', null, reason, verification.applicationId);
    }

    client.activeVerifications.delete(userId);
    console.log(`Verification cancelled for user ${userId}. Reason: ${reason}`);
    return true;
  } catch (error) {
    console.error(`Error in cancelVerification for user ${userId}:`, error);
    client.activeVerifications.delete(userId);
    return false;
  }
}

function addToHistory(client, userId, status, moderatorId, reason = null, applicationId = null) {
  const historyId = `${userId}_${Date.now()}`;
  
  const historyEntry = {
    id: historyId,
    userId,
    status,
    moderatorId,
    reason,
    timestamp: Date.now(),
    applicationId
  };
  
  client.applicationHistory.set(historyId, historyEntry);
  
  HistoryDB.add(historyEntry);
  
  if (['approved', 'denied', 'cancelled'].includes(status)) {
    ApplicationDB.update(applicationId, { 
      status,
      completedAt: Date.now(),
      moderatorId,
      reason
    });
  }
  
  console.log(`Added history entry for ${userId}: ${status}`);
}

async function cancelAllVerifications(client, reason = 'Cancelled by staff') {
  let count = 0;

  for (const [userId, verification] of client.activeVerifications.entries()) {
    await cancelVerification(client, userId, reason);
    count++;
  }

  return count;
}

async function denyAllVerifications(client, moderatorId, reason = 'Bulk denied by staff') {
  let count = 0;

  const pendingVerifications = [...client.activeVerifications.entries()]
    .filter(([_, v]) => v.step === 'staff_review' || v.step === 'question_response');

  for (const [userId, verification] of pendingVerifications) {
    try {
      const user = await client.users.fetch(userId);
      await user.send(`ur verification has been denied. Reason: ${reason}`);

      if (verification.staffMessageId) {
        const staffChannel = await client.channels.fetch(process.env.STAFF_CHANNEL_ID);
        try {
          const staffMessage = await staffChannel.messages.fetch(verification.staffMessageId);

          const updatedEmbed = EmbedBuilder.from(staffMessage.embeds[0])
            .setTitle(`Verification Denied | ID: ${verification.applicationId || 'Unknown'}`)
            .setColor('#E74C3C')
            .addFields({ name: 'Denied by', value: `Bulk denial` })
            .addFields({ name: 'Reason', value: reason });

          await staffMessage.edit({
            embeds: [updatedEmbed],
            components: []
          });
        } catch (error) {
          console.error(`Could not update staff message for user ${userId}:`, error);
        }
      }

      addToHistory(client, userId, 'denied', moderatorId, reason, verification.applicationId);
      setCooldown(userId, reason);
      
      ApplicationDB.update(verification.applicationId, {
        status: 'denied',
        completedAt: Date.now(),
        moderatorId,
        reason
      });

      clearTimeout(verification.timeout);
      client.activeVerifications.delete(userId);

      count++;
    } catch (error) {
      console.error(`Error denying verification for user ${userId}:`, error);
    }
  }

  return count;
}

function loadHistoryToMemory(client) {
  try {
    const history = HistoryDB.getAll();
    
    for (const [id, entry] of Object.entries(history)) {
      client.applicationHistory.set(id, entry);
    }
    
    console.log(`Loaded ${Object.keys(history).length} history entries from database`);
  } catch (error) {
    console.error('Error loading history from database:', error);
  }
}

module.exports = {
  generateRandomCode,
  cancelVerification,
  addToHistory,
  cancelAllVerifications,
  denyAllVerifications,
  loadHistoryToMemory
};