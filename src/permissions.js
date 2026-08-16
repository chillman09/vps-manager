function isAdmin(member) {
  if (!member) return false;
  if (member.permissions.has('Administrator')) return true;
  const adminRoleId = process.env.ADMIN_ROLE_ID;
  if (adminRoleId && member.roles.cache.has(adminRoleId)) return true;
  return false;
}

module.exports = { isAdmin };
