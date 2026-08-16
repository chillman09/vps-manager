const db = require('../db');
const { buildPanelEmbed, buildPanelButtons } = require('../panel');

// Usage: ?manage
// If the user owns exactly one container, shows it directly.
// If they own multiple, lists names and asks them to specify.
module.exports = {
  name: 'manage',
  async execute(message, args) {
    const owned = db.getByOwner(message.author.id);

    if (owned.length === 0) {
      return message.reply("You don't have a VPS deployed yet. Ask an admin to `?deploy` one for you.");
    }

    let container = owned[0];
    if (owned.length > 1) {
      if (args[0]) {
        const match = owned.find(c => c.lxc_name === args[0]);
        if (!match) return message.reply(`You don't own a container named \`${args[0]}\`.`);
        container = match;
      } else {
        return message.reply(
          `You own multiple containers, specify one:\n` +
          owned.map(c => `\`${c.lxc_name}\``).join(', ')
        );
      }
    }

    const embed = buildPanelEmbed(container);
    const rows = buildPanelButtons(container.lxc_name);
    await message.reply({ embeds: [embed], components: rows });
  }
};
