// Parses tokens like "ram:64 cpu:8 disk:128 os:ubuntu-24.04" into an object.
function parseKeyValues(tokens) {
  const out = {};
  for (const tok of tokens) {
    const idx = tok.indexOf(':');
    if (idx === -1) continue;
    const key = tok.slice(0, idx).toLowerCase();
    const val = tok.slice(idx + 1);
    out[key] = val;
  }
  return out;
}

function extractUserId(mentionOrId) {
  if (!mentionOrId) return null;
  const match = mentionOrId.match(/^<@!?(\d+)>$/);
  return match ? match[1] : (/^\d+$/.test(mentionOrId) ? mentionOrId : null);
}

// os alias like "ubuntu-24.04" -> lxc image alias "ubuntu/24.04"
function normalizeOsAlias(os) {
  if (!os) return 'ubuntu/24.04';
  return os.replace('-', '/');
}

module.exports = { parseKeyValues, extractUserId, normalizeOsAlias };
