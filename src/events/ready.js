const { setupVerificationChannel } = require('../modules/verificationSetup');
const { registerCommands } = require('../modules/commandRegistration');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user.tag}`);
    
    try {
      await setupVerificationChannel(client);
      
      await registerCommands();
      
      console.log('Bot is fully initialized!');
    } catch (error) {
      console.error('Error during initialization:', error);
    }
  }
};