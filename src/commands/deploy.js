const db = require('../db');
const lxc = require('../lxc');
const { isAdmin } = require('../permissions');
const { parseKeyValues, extractUserId, normalizeOsAlias } = require('../util');
const { buildPanelEmbed, buildPanelButtons } = require('../panel');

// Usage: ?deploy @user ram:64 cpu:8 disk:128 os:ubuntu-24.04
module.exports = {
  name: 'deploy',
  async execute(message, args) {
    if (!isAdmin(message.member)) {
      return message.reply('You need admin permissions to deploy a VPS.');
    }

    const targetId = extractUserId(args[0]);
    if (!targetId) {
      return message.reply('Usage: `?deploy @user ram:64 cpu:8 disk:128 os:ubuntu-24.04`');
    }

    const kv = parseKeyValues(args.slice(1));
    const ramMb = parseInt(kv.ram || '2048', 10) * (kv.ram && kv.ram.length <= 3 ? 1024 : 1); // allow ram:2 meaning 2GB shorthand
    const cpuCores = parseInt(kv.cpu || '2', 10);
    const diskGb = parseInt(kv.disk || '20', 10);
    const osAlias = normalizeOsAlias(kv.os || 'ubuntu-24.04');

    const lxcName = `vps-${targetId}-${Date.now().toString().slice(-5)}`;
    const status = await message.reply(`Deploying \`${lxcName}\` (${ramMb}MB RAM / ${cpuCores} CPU / ${diskGb}GB) — this can take a minute...`);

    try {
      const hostPort = db.nextFreePort(
        parseInt(process.env.SSH_PORT_RANGE_START, 10),
        parseInt(process.env.SSH_PORT_RANGE_END, 10)
      );
      const password = lxc.genPassword();

      await lxc.launch(lxcName, osAlias);
      await lxc.setLimits(lxcName, ramMb, cpuCores);
      await lxc.setDiskLimit(lxcName, diskGb).catch(() => {}); // not all storage backends support this
      await lxc.addSshProxy(lxcName, hostPort);
      await lxc.setRootPassword(lxcName, password);

      db.insertContainer({
        lxc_name: lxcName,
        discord_user_id: targetId,
        ssh_port: hostPort,
        ssh_user: process.env.DEFAULT_SSH_USER || 'root',
        ssh_password: password,
        ram_mb: ramMb,
        cpu_cores: cpuCores,
        disk_gb: diskGb,
        os_image: osAlias,
        status: 'running'
      });

      const container = db.getByName(lxcName);
      const embed = buildPanelEmbed(container);
      const rows = buildPanelButtons(lxcName);

      await status.edit({
        content: `<@${targetId}> your VPS is ready. Use \`?manage\` to control it.`,
        embeds: [embed],
        components: rows
      });
    } catch (err) {
      console.error(err);
      await status.edit(`Deploy failed: ${err.message}`);
    }
  }
};
