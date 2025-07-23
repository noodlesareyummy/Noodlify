const { EmbedBuilder } = require('discord.js');
const { generateRandomCode, cancelVerification } = require('./verificationManager');
const { isOnCooldown, getRemainingCooldown, isBlacklisted, getBlacklistReason } = require('../utils/cooldownManager');
const { generateApplicationId } = require('../utils/applicationIdGenerator');
const config = require('../../config/config');

async function handleVerificationStart(client, interaction) {
  try {
    if (client.verificationDisabled) {
      return await interaction.reply({
        content: 'nuh uh, verifying is disable atm...',
        ephemeral: true
      });
    }

    if (isBlacklisted(interaction.user.id)) {
      const reason = getBlacklistReason(interaction.user.id);
      return await interaction.reply({
        content: `rip, u got blacklisted... ${reason ? `Reason: ${reason}` : ''}`,
        ephemeral: true
      });
    }

    if (isOnCooldown(interaction.user.id)) {
      const remaining = getRemainingCooldown(interaction.user.id);
      return await interaction.reply({
        content: `Please wait ${remaining} seconds before trying again...`,
        ephemeral: true
      });
    }

    if (client.activeVerifications.has(interaction.user.id)) {
      return await interaction.reply({
        content: 'u already have an active verification process. plz check ur DMs.',
        ephemeral: true
      });
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (member.roles.cache.has(process.env.VERIFIED_ROLE_ID)) {
      return await interaction.reply({
        content: 'u are already verified silly',
        ephemeral: true
      });
    }

    const applicationId = generateApplicationId();

    const verificationCode = generateRandomCode(config.verificationCodeLength);

    const timeout = setTimeout(() => {
      cancelVerification(client, interaction.user.id, 'Timeout');
    }, config.verificationTimeout);

    client.activeVerifications.set(interaction.user.id, {
      userId: interaction.user.id,
      applicationId: applicationId,
      code: verificationCode,
      startTime: Date.now(),
      step: 'code_verification',
      timeout: timeout
    });

    const { ApplicationDB } = require('../utils/databaseManager');
    ApplicationDB.save({
      applicationId: applicationId,
      userId: interaction.user.id,
      userTag: interaction.user.tag,
      startTime: Date.now(),
      status: 'in_progress',
      step: 'code_verification',
    });

    const user = await client.users.fetch(interaction.user.id);
    const verifyEmbed = new EmbedBuilder()
      .setTitle('Verification Process')
      .setDescription(`
      welcum! plz follow these steps :D
      
      1. First, plz reply to this message with the code to confirm ur not a bot or sumthin:
      **${verificationCode}**
      
      2. After that, I'll ask you to send the verification pic.
      
      You can type \`cancel\` at any time to stop if u want.
      I u are inactive for longer than 10 minutes, the verification will be canceled...
      `)
      .setColor('#3498DB')
      .setFooter({ text: `Application ID: ${applicationId}` });

    await user.send({ embeds: [verifyEmbed] });

    // Respond to the interaction
    await interaction.reply({
      content: 'Verification process started! plz check ur DMs.',
      ephemeral: true
    });

    console.log(`Verification started for ${interaction.user.tag} with ID: ${applicationId}`);
  } catch (error) {
    console.error('Error starting verification:', error);

    // If error is likely due to closed DMs
    if (error.code === 50007) {
      await interaction.reply({
        content: 'I cannot send u a DM... plz enable DMs and try again.',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: 'An error occurred while starting the verification process. Please try again later.',
        ephemeral: true
      });
    }
  }
}

module.exports = { handleVerificationStart };