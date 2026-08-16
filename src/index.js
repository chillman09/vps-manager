require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { handleButton } = require('./buttons');

const PREFIX = process.env.COMMAND_PREFIX || '?';

const commands = new Map();
for (const file of ['deploy', 'delete', 'list', 'resize', 'manage']) {
  const cmd = require(`./commands/${file}`);
  commands.set(cmd.name, cmd);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel]
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}. Prefix: ${PREFIX}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const cmdName = args.shift().toLowerCase();
  const cmd = commands.get(cmdName);
  if (!cmd) return;

  try {
    await cmd.execute(message, args);
  } catch (err) {
    console.error(err);
    message.reply('Something went wrong running that command.').catch(() => {});
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  await handleButton(interaction);
});

client.login(process.env.DISCORD_TOKEN);
