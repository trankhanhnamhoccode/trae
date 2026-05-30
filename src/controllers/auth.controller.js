const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { nextPrefixedId } = require('../utils/questspaceIds');
const { toQuestSpaceUser } = require('../utils/questspaceMappers');

const signToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    const error = new Error('JWT_SECRET is missing. Please set it in your .env file.');
    error.statusCode = 500;
    throw error;
  }

  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const sendQuestSpaceAuthResponse = (res, statusCode, token, user) => {
  return res.status(statusCode).json({
    token,
    user,
    success: true,
    data: { token, user }
  });
};

const sendQuestSpaceError = (res, statusCode, code, message) => {
  return res.status(statusCode).json({
    error: {
      code,
      message
    }
  });
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return sendQuestSpaceError(res, 400, 'VALIDATION_ERROR', 'name, email, password, and role are required');
  }

  if (password.length < 6) {
    return sendQuestSpaceError(res, 400, 'VALIDATION_ERROR', 'Password must be at least 6 characters long');
  }

  if (role !== 'manager' && role !== 'employee') {
    return sendQuestSpaceError(res, 400, 'VALIDATION_ERROR', 'role must be manager or employee');
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return sendQuestSpaceError(res, 409, 'EMAIL_EXISTS', 'Email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = await nextPrefixedId(User, 'u', 2);

  const avatar = role === 'manager' ? 'manager_01' : 'employee_01';
  const title = role === 'manager' ? 'Guild Master' : 'New Adventurer';

  const user = await User.create({
    id: userId,
    name,
    email,
    passwordHash,
    role,
    avatar,
    title,
    exp: 0,
    gold: 0,
    homeItems: []
  });

  const token = signToken(user.id || user._id);

  return sendQuestSpaceAuthResponse(res, 201, token, toQuestSpaceUser(user));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendQuestSpaceError(res, 400, 'VALIDATION_ERROR', 'email and password are required');
  }

  const user = await User.findOne({ email });

  if (!user) {
    return sendQuestSpaceError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    return sendQuestSpaceError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const token = signToken(user.id || user._id);

  return sendQuestSpaceAuthResponse(res, 200, token, toQuestSpaceUser(user));
});

const me = asyncHandler(async (req, res) => {
  const user = toQuestSpaceUser(req.user);
  return res.status(200).json({
    user,
    success: true,
    data: { user }
  });
});

module.exports = {
  register,
  login,
  me
};
