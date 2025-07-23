const fs = require('fs');
const path = require('path');

const commands = new Map();
const commandsPath = path.join(__dirname, '..', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.set(command.data.name, command);
  }
}

async function handleSlashCommands(client, interaction) {
  const command = commands.get(interaction.commandName);
  
  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return interaction.reply({ 
      content: 'Unknown command.', 
      ephemeral: true 
    });
  }
  
  try {
    await command.execute(client, interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ 
        content: 'wuh woh, sumethin went wrong...',
        ephemeral: true 
      });
    } else {
      await interaction.reply({ 
        content: 'wuh woh, sumethin went wrong...',
        ephemeral: true 
      });
    }
  }
}

module.exports = { handleSlashCommands };