const { execFile } = require('child_process');
const crypto = require('crypto');

function run(args) {
  return new Promise((resolve, reject) => {
    execFile('lxc', args, { timeout: 60_000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(stdout.trim());
    });
  });
}

function genPassword() {
  return crypto.randomBytes(9).toString('base64').replace(/[+/=]/g, '');
}

module.exports = {
  genPassword,

  // Launch a fresh unprivileged container from an image alias, e.g. "ubuntu/24.04"
  async launch(name, imageAlias) {
    await run(['launch', `images:${imageAlias}`, name]);
    // wait for network to come up before further config
    await new Promise(r => setTimeout(r, 5000));
  },

  async setLimits(name, ramMb, cpuCores) {
    await run(['config', 'set', name, 'limits.memory', `${ramMb}MB`]);
    await run(['config', 'set', name, 'limits.cpu', String(cpuCores)]);
  },

  async setDiskLimit(name, diskGb) {
    // requires the container's root disk device to support size override
    await run(['config', 'device', 'override', name, 'root', `size=${diskGb}GB`])
      .catch(() => run(['config', 'device', 'set', name, 'root', `size=${diskGb}GB`]));
  },

  async addSshProxy(name, hostPort) {
    await run([
      'config', 'device', 'add', name, 'ssh', 'proxy',
      `listen=tcp:0.0.0.0:${hostPort}`,
      'connect=tcp:127.0.0.1:22'
    ]);
  },

  async setRootPassword(name, password) {
    // pipe "root:password" into chpasswd inside the container
    await new Promise((resolve, reject) => {
      const child = execFile('lxc', ['exec', name, '--', 'chpasswd'], (err, _stdout, stderr) => {
        if (err) return reject(new Error(stderr || err.message));
        resolve();
      });
      child.stdin.write(`root:${password}\n`);
      child.stdin.end();
    });
    // make sure SSH allows password auth (many cloud images disable it by default)
    await run(['exec', name, '--', 'bash', '-c',
      "sed -i 's/^#\\?PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config && systemctl restart sshd"
    ]).catch(() => {});
  },

  async start(name) {
    await run(['start', name]);
  },

  async stop(name) {
    await run(['stop', name, '--force']);
  },

  async restart(name) {
    await run(['restart', name, '--force']);
  },

  async remove(name) {
    await run(['stop', name, '--force']).catch(() => {});
    await run(['delete', name, '--force']);
  },

  // Full reinstall = wipe and relaunch fresh from the same image, keep same name/ports
  async reinstall(name, imageAlias) {
    await run(['stop', name, '--force']).catch(() => {});
    await run(['delete', name, '--force']);
    await run(['launch', `images:${imageAlias}`, name]);
    await new Promise(r => setTimeout(r, 5000));
  },

  async info(name) {
    return run(['info', name, '--resources']);
  },

  async state(name) {
    // returns 'RUNNING' / 'STOPPED' etc, parsed from `lxc list`
    const out = await run(['list', name, '--format', 'csv', '--columns', 's']);
    return out.trim();
  }
};
