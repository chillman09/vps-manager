const db = require('./db');
const lxc = require('./lxc');
const { buildPanelEmbed, buildPanelButtons } = require('./panel');
const { isAdmin } = require('./permissions');

async function handleButton(interaction) {
  const [action, lxcName] = interaction.customId.split(':');
  const container = db.getByName(lxcName);

  if (!container) {
    return interaction.reply({ content: 'This container no longer exists.', ephemeral: true });
  }

  const owner = container.discord_user_id === interaction.user.id;
  const admin = isAdmin(interaction.member);
  if (!owner && !admin) {
    return interaction.reply({ content: 'This is not your VPS.', ephemeral: true });
  }

  try {
    switch (action) {
      case 'start': {
        await interaction.deferUpdate();
        await lxc.start(lxcName);
        db.updateStatus(lxcName, 'running');
        break;
      }
      case 'stop': {
        await interaction.deferUpdate();
        await lxc.stop(lxcName);
        db.updateStatus(lxcName, 'stopped');
        break;
      }
      case 'reinstall': {
        await interaction.deferUpdate();
        await interaction.followUp({ content: `Reinstalling \`${lxcName}\`, this wipes all data on it...`, ephemeral: true });
        await lxc.reinstall(lxcName, container.os_image);
        await lxc.addSshProxy(lxcName, container.ssh_port).catch(() => {}); // proxy device is wiped on reinstall
        await lxc.setRootPassword(lxcName, container.ssh_password);
        db.updateStatus(lxcName, 'running');
        break;
      }
      case 'ssh': {
        const host = process.env.HOST_PUBLIC_IP || 'YOUR_HOST_IP';
        return interaction.reply({
          content: `\`\`\`ssh ${container.ssh_user}@${host} -p ${container.ssh_port}\`\`\`Password: \`${container.ssh_password}\``,
          ephemeral: true
        });
      }
      case 'stats': {
        await interaction.deferUpdate();
        break;
      }
    }

    let liveStats = null;
    if (action === 'stats') {
      try {
        const raw = await lxc.info(lxcName);
        liveStats = '```\n' + raw.slice(0, 900) + '\n```';
      } catch {
        liveStats = 'Unable to fetch live stats right now.';
      }
    }

    const updated = db.getByName(lxcName);
    const embed = buildPanelEmbed(updated, liveStats);
    const rows = buildPanelButtons(lxcName);
    await interaction.editReply({ embeds: [embed], components: rows });
  } catch (err) {
    console.error(err);
    const msg = { content: `Action failed: ${err.message}`, ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
}

module.exports = { handleButton };
