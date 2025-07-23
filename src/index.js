require('dotenv').config();
const { Client } = require('discord.js');
const { setupClient } = require('./utils/clientSetup');
const { registerEvents } = require('./events/eventRegistrar');
const fs = require('fs');
const path = require('path');

const client = setupClient();

registerEvents(client);

client.login(process.env.TOKEN)
  .then(() => console.log('Bot logged in successfully'))
  .catch(err => console.error('Failed to log in:', err));