const toQuestSpaceUser = (user) => ({
  id: user.id || String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar || '',
  title: user.title || '',
  exp: user.exp || 0,
  gold: user.gold || 0,
  homeItems: Array.isArray(user.homeItems) ? user.homeItems : []
});

module.exports = {
  toQuestSpaceUser
};
