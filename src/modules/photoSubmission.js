const { sendVerificationToStaff } = require('./staffReview');
const { cancelVerification } = require('./verificationManager');

async function handlePhotoSubmission(client, message, verification) {
  if (!verification.photoAttempts) {
    verification.photoAttempts = 0;
  }

  if (message.attachments.size > 0) {
    const attachment = message.attachments.first();
    
    if (attachment.contentType?.startsWith('image/')) {
      verification.imageUrl = attachment.url;
      
      let responseMessage = 'ty! ur verification has been sent and will be reviewed by staff. plez wait...';
      if (verification.photoRetry) {
        responseMessage = 'ty for submitting a new photo! It will be reviewed by staff shortly.';
      }
      
      await sendVerificationToStaff(client, message.author, verification);
      
      verification.step = 'staff_review';
      verification.photoRetry = false;
      client.activeVerifications.set(message.author.id, verification);
      
      await message.reply(responseMessage);
      console.log(`User ${message.author.tag} submitted ${verification.photoRetry ? 'new ' : ''}verification photo`);
    } else {
      verification.photoAttempts++;
      client.activeVerifications.set(message.author.id, verification);
      await sendProgressiveResponse(message, verification.photoAttempts, 'not_image', client);
    }
  } else {
    verification.photoAttempts++;
    client.activeVerifications.set(message.author.id, verification);
    await sendProgressiveResponse(message, verification.photoAttempts, 'no_attachment', client);
  }
}

async function sendProgressiveResponse(message, attempts, type, client) {
  const responses = {
    no_attachment: [
      "plz attach a photo to ur message...",
      "I need a photo... plz attach one to ur message.",
      "PHOTO PLZ! gimme an image file.",
      "I SAID I NEED PHOTO! >:c ATTACH ONE!",
      "EY LAST WARNIN, SEND A PIC!!!"
    ],
    not_image: [
      "plz send an image file (JPG, or PNG plez).",
      "thas not an image silly... I need a JPG or PNG file :P",
      "THAS STILL NOT AN IMAGE! :C Send a pic!",
      "DO U KNOW WHAT AN IMAGE FILE IS?!",
      "EY LAST WARNIN >:C.. SEND A PIC!!!"
    ]
  };

  const responseList = responses[type];
  const index = Math.min(attempts - 1, responseList.length - 1);
  
  if (attempts >= 6) {
    await message.reply(".... ur verification is canceled bcs u gave too many invalid attempts. u can try again later....");
    await cancelVerification(client, message.author.id, 'Too many invalid photo submission attempts (dumb user)');
    return;
  }
  
  await message.reply(responseList[index]);
}

module.exports = { handlePhotoSubmission };