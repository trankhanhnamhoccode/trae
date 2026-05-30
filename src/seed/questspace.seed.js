const bcrypt = require('bcryptjs');
const User = require('../models/User');

const ensureQuestSpaceDemoAccounts = async () => {
  const passwordHash = await bcrypt.hash('password', 10);

  const managerEmail = 'manager@questspace.dev';
  const employeeEmail = 'employee@questspace.dev';

  const existingManager = await User.findOne({ email: managerEmail });
  if (!existingManager) {
    await User.create({
      id: 'u_01',
      name: 'Ava Manager',
      email: managerEmail,
      passwordHash,
      role: 'manager',
      avatar: 'manager_01',
      title: 'Guild Master',
      exp: 0,
      gold: 0,
      homeItems: []
    });
  }

  const existingEmployee = await User.findOne({ email: employeeEmail });
  if (!existingEmployee) {
    await User.create({
      id: 'u_02',
      name: 'Eli Employee',
      email: employeeEmail,
      passwordHash,
      role: 'employee',
      avatar: 'employee_01',
      title: 'New Adventurer',
      exp: 0,
      gold: 0,
      homeItems: []
    });
  }
};

module.exports = {
  ensureQuestSpaceDemoAccounts
};
