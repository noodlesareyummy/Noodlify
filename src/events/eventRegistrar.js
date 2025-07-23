const fs = require('fs');
const path = require('path');

function registerEvents(client) {
  const eventFiles = fs.readdirSync(path.join(__dirname))
    .filter(file => file.endsWith('.js') && !file.includes('eventRegistrar'));
  
  for (const file of eventFiles) {
    const event = require(path.join(__dirname, file));
    
    if (event.once) {
      client.once(event.name, (...args) => event.execute(client, ...args));
    } else {
      client.on(event.name, (...args) => event.execute(client, ...args));
    }
    
    console.log(`Registered event handler: ${event.name}`);
  }
}

module.exports = { registerEvents };