const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'vps.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS containers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lxc_name TEXT UNIQUE NOT NULL,
    discord_user_id TEXT NOT NULL,
    ssh_port INTEGER UNIQUE NOT NULL,
    ssh_user TEXT NOT NULL DEFAULT 'root',
    ssh_password TEXT NOT NULL,
    ram_mb INTEGER NOT NULL,
    cpu_cores INTEGER NOT NULL,
    disk_gb INTEGER NOT NULL,
    os_image TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'running',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = {
  raw: db,

  insertContainer(row) {
    const stmt = db.prepare(`
      INSERT INTO containers
        (lxc_name, discord_user_id, ssh_port, ssh_user, ssh_password, ram_mb, cpu_cores, disk_gb, os_image, status)
      VALUES (@lxc_name, @discord_user_id, @ssh_port, @ssh_user, @ssh_password, @ram_mb, @cpu_cores, @disk_gb, @os_image, @status)
    `);
    return stmt.run(row);
  },

  getByOwner(discordUserId) {
    return db.prepare(`SELECT * FROM containers WHERE discord_user_id = ?`).all(discordUserId);
  },

  getByName(lxcName) {
    return db.prepare(`SELECT * FROM containers WHERE lxc_name = ?`).get(lxcName);
  },

  getAll() {
    return db.prepare(`SELECT * FROM containers ORDER BY created_at DESC`).all();
  },

  updateStatus(lxcName, status) {
    return db.prepare(`UPDATE containers SET status = ? WHERE lxc_name = ?`).run(status, lxcName);
  },

  updateResources(lxcName, ramMb, cpuCores) {
    return db.prepare(`UPDATE containers SET ram_mb = ?, cpu_cores = ? WHERE lxc_name = ?`).run(ramMb, cpuCores, lxcName);
  },

  deleteContainer(lxcName) {
    return db.prepare(`DELETE FROM containers WHERE lxc_name = ?`).run(lxcName);
  },

  nextFreePort(start, end) {
    const used = db.prepare(`SELECT ssh_port FROM containers`).all().map(r => r.ssh_port);
    for (let p = start; p <= end; p++) {
      if (!used.includes(p)) return p;
    }
    throw new Error('No free SSH ports left in configured range');
  }
};
