const fs = require('fs');
const path = require('path');
const { HistoryDB, ApplicationDB, BlacklistDB } = require('../utils/databaseManager');
const { loadHistoryToMemory } = require('./verificationManager');

async function handleAdminDbButtons(client, interaction) {
  // this file is for future stuff
  
  return;
}

module.exports = { handleAdminDbButtons };