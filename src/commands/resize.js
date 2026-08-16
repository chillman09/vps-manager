const db = require('../db');
const lxc = require('../lxc');
const { isAdmin } = require('../permissions');
const { parseKeyValues } = require('../util');

// Usage: ?resize <lxc_name> ram:8192 cpu:4
module.exports = {
  name: 'resize',
  async execute(message, args) {
    if (!isAdmin(message.member)) {
      return message.reply('You need admin permissions to resize a VPS.');
    }

    const lxcName = args[0];
    if (!lxcName) return message.reply('Usage: `?resize <container_name> ram:8192 cpu:4`');

    const container = db.getByName(lxcName);
    if (!container) return message.reply(`No container found named \`${lxcName}\`.`);

    const kv = parseKeyValues(args.slice(1));
    const ramMb = kv.ram ? parseInt(kv.ram, 10) : container.ram_mb;
    const cpuCores = kv.cpu ? parseInt(kv.cpu, 10) : container.cpu_cores;

    try {
      await lxc.setLimits(lxcName, ramMb, cpuCores);
      db.updateResources(lxcName, ramMb, cpuCores);
      await message.reply(`Resized \`${lxcName}\` to ${ramMb}MB RAM / ${cpuCores} CPU.`);
    } catch (err) {
      console.error(err);
      await message.reply(`Resize failed: ${err.message}`);
    }
  }
};
