const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { getStateValue } = require('./stateManager');
const { loadHistoryToMemory } = require('../modules/verificationManager');

function setupClient() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.DirectMessageReactions,
      GatewayIntentBits.DirectMessageTyping
    ],
    partials: [
      Partials.Channel,
      Partials.Message,
      Partials.User
    ]
  });

  client.activeVerifications = new Collection();
  client.applicationHistory = new Collection();
  
  client.verificationDisabled = !getStateValue('verificationEnabled');
  
  client.once('ready', () => {
    loadHistoryToMemory(client);
  });

  return client;
}

module.exports = { setupClient };