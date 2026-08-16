const db = require('../db');
const { isAdmin } = require('../permissions');
const { EmbedBuilder } = require('discord.js');

// Usage: ?list
module.exports = {
  name: 'list',
  async execute(message) {
    if (!isAdmin(message.member)) {
      return message.reply('You need admin permissions to list all VPS containers.');
    }

    const containers = db.getAll();
    if (containers.length === 0) {
      return message.reply('No containers deployed yet.');
    }

    const embed = new EmbedBuilder()
      .setTitle('All deployed VPS containers')
      .setColor(0x3498db)
      .setDescription(
        containers.map(c =>
          `**${c.lxc_name}** — owner <@${c.discord_user_id}> — ${c.ram_mb}MB/${c.cpu_cores}CPU/${c.disk_gb}GB — port ${c.ssh_port} — ${c.status}`
        ).join('\n')
      );

    await message.reply({ embeds: [embed] });
  }
};
