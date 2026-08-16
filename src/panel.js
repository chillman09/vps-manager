const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function buildPanelEmbed(container, liveStats) {
  const embed = new EmbedBuilder()
    .setTitle(`VPS - ${container.lxc_name}`)
    .setColor(container.status === 'running' ? 0x2ecc71 : 0x555555)
    .addFields(
      { name: 'Configuration', value: `${container.ram_mb}MB RAM / ${container.cpu_cores} CPU / ${container.disk_gb}GB Disk`, inline: false },
      { name: 'Status', value: container.status.toUpperCase(), inline: true },
      { name: 'OS', value: container.os_image, inline: true },
    )
    .setFooter({ text: `Container ID: ${container.id}` })
    .setTimestamp();

  if (liveStats) {
    embed.addFields({ name: 'Live usage', value: liveStats, inline: false });
  }

  return embed;
}

function buildPanelButtons(lxcName) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`start:${lxcName}`).setLabel('Start').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`stop:${lxcName}`).setLabel('Stop').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`reinstall:${lxcName}`).setLabel('Reinstall').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`ssh:${lxcName}`).setLabel('SSH').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`stats:${lxcName}`).setLabel('Stats').setStyle(ButtonStyle.Secondary),
  );
  return [row];
}

module.exports = { buildPanelEmbed, buildPanelButtons };
