const { handleCodeVerification } = require('../modules/codeVerification');
const { handlePhotoSubmission } = require('../modules/photoSubmission');
const { handleQuestionResponse } = require('../modules/questionResponse');
const { handlePhotoRetryResponse } = require('../modules/photoRetryResponse');
const { cancelVerification } = require('../modules/verificationManager');

const userProcessing = new Set();

module.exports = {
  name: 'messageCreate',
  async execute(client, message) {

    if (userProcessing.has(message.author.id)) {
      console.log(`Skipping message from ${message.author.tag} - already processing a message from this user`);
      return;
    }

    userProcessing.add(message.author.id);

    if (message.author.bot) return;

    console.log(`Received message: "${message.content}" from ${message.author.tag} in channel type ${message.channel.type}`);

    const isDM = !message.guild;
    if (!isDM) return;

    const verification = client.activeVerifications.get(message.author.id);
    console.log(`Verification for ${message.author.id}: ${verification ? `Found in step ${verification.step}` : 'Not found'}`);

    if (!verification) return;

    if (message.content.toLowerCase() === 'cancel') {
      console.log(`User ${message.author.tag} cancelled verification`);
      cancelVerification(client, message.author.id, 'User cancelled');
      return message.reply('Verification cancelled... u can start again if u want same way u started this one...');
    }


    try {
      switch (verification.step) {
        case 'code_verification':
          console.log(`Processing code verification for ${message.author.tag}`);
          await handleCodeVerification(client, message, verification);
          break;

        case 'photo_retry_response':
          await handlePhotoRetryResponse(client, message, verification);
          break;

        case 'photo_submission':
          await handlePhotoSubmission(client, message, verification);
          break;

        case 'question_response':
          await handleQuestionResponse(client, message, verification);
          break;
      }
    } finally {
      userProcessing.delete(message.author.id);
    }
  }
};