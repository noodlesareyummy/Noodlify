const { EmbedBuilder } = require('discord.js');

async function handleCodeVerification(client, message, verification) {
  console.log(`Code verification: User input "${message.content}", expected "${verification.code}"`);
  
  if (message.content.trim() === verification.code) {
    verification.step = 'photo_submission';
    client.activeVerifications.set(message.author.id, verification);
    
    const photoEmbed = new EmbedBuilder()
      .setTitle('Photo Submission')
      .setDescription(`
      Veryu gud! Now plz send a pic of yourself holding a piece of paper with:
      
      1. Your hand making a thingy that looks like dis: 🤙
      2. A paper showing the server name and the last 6 letters of ur username
         (or ur entire username if it's less than 6 letters :P)

      *You can blur or cover ur face if u want...
      `)
      .setColor('#2ECC71');
    
    await message.reply({ embeds: [photoEmbed] });
    console.log(`User ${message.author.tag} passed code verification`);
  } else {
    await message.reply('thas the wrong code... plz try again or type `cancel` to stop :P');
    console.log(`User ${message.author.tag} failed code verification`);
  }
}

module.exports = { handleCodeVerification };