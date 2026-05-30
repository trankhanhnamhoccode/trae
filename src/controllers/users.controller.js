const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { toQuestSpaceUser } = require('../utils/questspaceMappers');

const sendQuestSpaceError = (res, statusCode, code, message) => {
  return res.status(statusCode).json({
    error: {
      code,
      message
    }
  });
};

const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = (await User.findOne({ id }).select('-passwordHash')) || (await User.findById(id).select('-passwordHash'));

  if (!user) {
    return sendQuestSpaceError(res, 404, 'USER_NOT_FOUND', 'User not found');
  }

  const mapped = toQuestSpaceUser(user);
  return res.status(200).json({
    user: mapped,
    success: true,
    data: { user: mapped }
  });
});

const getMembers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-passwordHash');
  const members = users.map((u) => toQuestSpaceUser(u));

  return res.status(200).json({
    members,
    success: true,
    data: { members }
  });
});

module.exports = {
  getUserById,
  getMembers
};
