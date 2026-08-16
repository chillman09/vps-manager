const db = require('../db');
const lxc = require('../lxc');
const { isAdmin } = require('../permissions');

// Usage: ?delete <lxc_name>
module.exports = {
  name: 'delete',
  async execute(message, args) {
    if (!isAdmin(message.member)) {
      return message.reply('You need admin permissions to delete a VPS.');
    }

    const lxcName = args[0];
    if (!lxcName) return message.reply('Usage: `?delete <container_name>`');

    const container = db.getByName(lxcName);
    if (!container) return message.reply(`No container found named \`${lxcName}\`.`);

    const status = await message.reply(`Deleting \`${lxcName}\`...`);
    try {
      await lxc.remove(lxcName);
      db.deleteContainer(lxcName);
      await status.edit(`Deleted \`${lxcName}\`.`);
    } catch (err) {
      console.error(err);
      await status.edit(`Delete failed: ${err.message}`);
    }
  }
};
