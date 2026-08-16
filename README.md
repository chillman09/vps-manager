# VPS deployment Discord bot

Admin deploys an LXC container to a user via Discord; the user manages it (start/stop/reinstall/SSH/stats)
through buttons on their panel.

## Commands

Admin only (prefix `?`):
- `?deploy @user ram:64 cpu:8 disk:128 os:ubuntu-24.04` — creates the container
- `?delete <container_name>`
- `?list` — all deployed containers
- `?resize <container_name> ram:8192 cpu:4`

Everyone (ownership-checked):
- `?manage` — shows your container panel with Start / Stop / Reinstall / SSH / Stats buttons

## Setup

```bash
cp .env.example .env
# fill in DISCORD_TOKEN, ADMIN_ROLE_ID, HOST_PUBLIC_IP
npm install
npm start
```

## Where this needs to run

- **Bot logic (this whole repo) can be developed and tested in GitHub Codespaces.**
- **The `lxc.js` module needs a real LXD-capable host to actually create containers.**
  Codespaces can't run nested LXC/LXD (no privileged kernel access, no systemd, no
  stable public IP). In production, run this bot on the same machine as your LXD
  install so it can shell out to the local `lxc` binary directly.

## Requirements on the LXD host

- LXD installed and initialized (`lxd init`)
- Bot process has permission to run `lxc` commands (either run as a user in the
  `lxd` group, or run the bot as root)
- Ubuntu cloud images (or whatever you pass via `os:`) available via `lxc launch images:<alias>`
- A public IP reachable from the internet — set as `HOST_PUBLIC_IP` in `.env`,
  this is what users SSH into

## Notes / things to double check before going live

- SSH password auth is force-enabled inside each container (`setRootPassword` in `lxc.js`)
  since cloud images usually ship with it off. Switch to injecting SSH keys instead if you
  want stronger auth.
- Disk limits (`setDiskLimit`) depend on your LXD storage backend supporting device-level
  size overrides (zfs/btrfs do, some others don't) — it fails silently if unsupported.
- Reinstall wipes the container and relaunches from the same image; the SSH proxy device
  and password are reapplied automatically since the container is fully recreated.
- No global rate limiting on `?deploy` yet — add if you don't want admins/spam creating
  unlimited containers.
