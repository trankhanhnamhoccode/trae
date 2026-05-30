const Quest = require('../models/Quest');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { nextPrefixedId } = require('../utils/questspaceIds');
const { toQuestSpaceUser } = require('../utils/questspaceMappers');

const sendQuestSpaceError = (res, statusCode, code, message) => {
  return res.status(statusCode).json({
    error: {
      code,
      message
    }
  });
};

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const recomputeMonsterHp = (quest) => {
  const maxHp = clamp(Number(quest.monster?.maxHp || 0), 0, Number.MAX_SAFE_INTEGER);
  const progress = clamp(Number(quest.progress || 0), 0, 100);
  const hp = Math.round(maxHp * (1 - progress / 100));
  quest.monster.hp = clamp(hp, 0, maxHp);
};

const resolveActorId = (req, fallbackId) => {
  if (req.user?.id) return req.user.id;
  if (req.user?._id) return String(req.user._id);
  return fallbackId;
};

const listQuests = asyncHandler(async (req, res) => {
  const quests = await Quest.find({}).sort({ createdAt: -1 });
  return res.status(200).json({
    quests,
    success: true,
    data: { quests }
  });
});

const createQuests = asyncHandler(async (req, res) => {
  const { prompt, managerId } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    return sendQuestSpaceError(res, 400, 'VALIDATION_ERROR', 'prompt is required');
  }

  const createdBy = resolveActorId(req, managerId || 'u_01');
  const now = new Date().toISOString();

  const baseId = await nextPrefixedId(Quest, 'q', 2);
  const baseNum = Number.parseInt(baseId.split('_')[1], 10);
  const width = baseId.split('_')[1].length;

  const promptNormalized = prompt.toLowerCase();
  const isDemoPrompt =
    promptNormalized.includes('login') &&
    promptNormalized.includes('backend') &&
    promptNormalized.includes('frontend') &&
    promptNormalized.includes('qa');

  const templates = isDemoPrompt
    ? [
        {
          title: 'Build Login API',
          description: 'Implement login API with JWT authentication.',
          suggestedRole: 'Backend',
          difficulty: 'Hard',
          monster: { type: 'dragon', name: 'Auth Dragon', maxHp: 100 },
          reward: { exp: 100, gold: 50, item: 'Dragon Trophy' },
          requirements: ['Implement login API', 'Return JWT on valid login', 'Handle invalid password'],
          acceptanceCriteria: ['API works with valid credentials', 'Invalid password is handled', 'Token flow is tested']
        },
        {
          title: 'Build Login Form',
          description: 'Build the frontend login form and wire it to the login API.',
          suggestedRole: 'Frontend',
          difficulty: 'Normal',
          monster: { type: 'slime', name: 'UI Slime', maxHp: 60 },
          reward: { exp: 60, gold: 30, item: 'Slime Sticker' },
          requirements: ['Create login form', 'Call login API', 'Persist token locally'],
          acceptanceCriteria: ['Form validates input', 'Login succeeds with valid creds', 'Error shows on invalid creds']
        },
        {
          title: 'Test Invalid Password & Expired Token',
          description: 'QA the login flow for invalid password and expired/invalid tokens.',
          suggestedRole: 'QA',
          difficulty: 'Easy',
          monster: { type: 'goblin', name: 'Bug Goblin', maxHp: 40 },
          reward: { exp: 40, gold: 20, item: 'Goblin Patch' },
          requirements: ['Test invalid password', 'Test expired token', 'Document expected errors'],
          acceptanceCriteria: ['Invalid password returns readable error', 'Expired token is rejected', 'Edge cases documented']
        }
      ]
    : [
        {
          title: 'New Quest',
          description: prompt.slice(0, 500),
          suggestedRole: 'General',
          difficulty: 'Normal',
          monster: { type: 'beast', name: 'Task Beast', maxHp: 80 },
          reward: { exp: 50, gold: 25, item: '' },
          requirements: [],
          acceptanceCriteria: []
        }
      ];

  const questsToCreate = templates.map((t, idx) => {
    const num = baseNum + idx;
    const id = `q_${String(num).padStart(width, '0')}`;

    return {
      id,
      title: t.title,
      description: t.description,
      assignedTo: null,
      suggestedRole: t.suggestedRole,
      difficulty: t.difficulty,
      status: 'available',
      progress: 0,
      monster: {
        type: t.monster.type,
        name: t.monster.name,
        hp: t.monster.maxHp,
        maxHp: t.monster.maxHp
      },
      reward: {
        exp: t.reward.exp,
        gold: t.reward.gold,
        item: t.reward.item || ''
      },
      requirements: t.requirements || [],
      acceptanceCriteria: t.acceptanceCriteria || [],
      evidence: { summary: '', links: [], time: '' },
      history: [
        {
          action: 'created',
          by: createdBy,
          time: now
        }
      ]
    };
  });

  const created = await Quest.insertMany(questsToCreate);

  return res.status(201).json({
    quests: created,
    success: true,
    data: { quests: created }
  });
});

const getQuestById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const quest = await Quest.findOne({ id });

  if (!quest) {
    return sendQuestSpaceError(res, 404, 'QUEST_NOT_FOUND', 'Quest not found');
  }

  return res.status(200).json({
    quest,
    success: true,
    data: { quest }
  });
});

const acceptQuest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body || {};

  if (!userId) {
    return sendQuestSpaceError(res, 400, 'VALIDATION_ERROR', 'userId is required');
  }

  const user = await User.findOne({ id: userId }).select('-passwordHash');
  if (!user) {
    return sendQuestSpaceError(res, 404, 'USER_NOT_FOUND', 'User not found');
  }

  if (user.role !== 'employee') {
    return sendQuestSpaceError(res, 403, 'FORBIDDEN', 'Only an employee can accept a quest');
  }

  const quest = await Quest.findOne({ id });
  if (!quest) {
    return sendQuestSpaceError(res, 404, 'QUEST_NOT_FOUND', 'Quest not found');
  }

  if (quest.status !== 'available') {
    return sendQuestSpaceError(res, 409, 'QUEST_NOT_AVAILABLE', 'Quest is not available');
  }

  quest.assignedTo = userId;
  quest.status = 'accepted';
  quest.history.push({ action: 'accepted', by: userId, time: new Date().toISOString() });
  await quest.save();

  return res.status(200).json({
    quest,
    success: true,
    data: { quest }
  });
});

const progressQuest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId, delta = 0, submitEvidence = false, evidence = null } = req.body || {};

  if (!userId) {
    return sendQuestSpaceError(res, 400, 'VALIDATION_ERROR', 'userId is required');
  }

  const quest = await Quest.findOne({ id });
  if (!quest) {
    return sendQuestSpaceError(res, 404, 'QUEST_NOT_FOUND', 'Quest not found');
  }

  if (!quest.assignedTo || quest.assignedTo !== userId) {
    return sendQuestSpaceError(res, 403, 'FORBIDDEN', 'Only the assigned employee can progress the quest');
  }

  if (quest.status === 'available') {
    return sendQuestSpaceError(res, 409, 'QUEST_NOT_ACCEPTED', 'Quest must be accepted before progress');
  }

  if (quest.status === 'review_pending' || quest.status === 'completed') {
    return sendQuestSpaceError(res, 409, 'QUEST_LOCKED', 'Quest cannot be progressed in its current status');
  }

  if (quest.status === 'accepted') {
    quest.status = 'in_progress';
  }

  const nextProgress = clamp(Number(quest.progress || 0) + Number(delta || 0), 0, 100);
  quest.progress = nextProgress;
  recomputeMonsterHp(quest);

  if (submitEvidence) {
    quest.evidence = {
      summary: String(evidence?.summary || ''),
      links: Array.isArray(evidence?.links) ? evidence.links.map(String) : [],
      time: new Date().toISOString()
    };
    quest.status = 'review_pending';
    quest.history.push({ action: 'evidence_submitted', by: userId, time: new Date().toISOString() });
  } else {
    quest.history.push({ action: 'progressed', by: userId, time: new Date().toISOString() });
  }

  await quest.save();

  return res.status(200).json({
    quest,
    success: true,
    data: { quest }
  });
});

const approveQuest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { managerId } = req.body || {};

  if (!managerId) {
    return sendQuestSpaceError(res, 400, 'VALIDATION_ERROR', 'managerId is required');
  }

  const manager = await User.findOne({ id: managerId }).select('-passwordHash');
  if (!manager) {
    return sendQuestSpaceError(res, 404, 'USER_NOT_FOUND', 'User not found');
  }

  if (manager.role !== 'manager') {
    return sendQuestSpaceError(res, 403, 'FORBIDDEN', 'Only a manager can approve a quest');
  }

  const quest = await Quest.findOne({ id });
  if (!quest) {
    return sendQuestSpaceError(res, 404, 'QUEST_NOT_FOUND', 'Quest not found');
  }

  if (quest.status !== 'review_pending') {
    return sendQuestSpaceError(res, 409, 'QUEST_NOT_REVIEW_PENDING', 'Quest must be review_pending to approve');
  }

  if (!quest.assignedTo) {
    return sendQuestSpaceError(res, 409, 'QUEST_NOT_ASSIGNED', 'Quest is missing assignedTo');
  }

  const employee = await User.findOne({ id: quest.assignedTo });
  if (!employee) {
    return sendQuestSpaceError(res, 404, 'USER_NOT_FOUND', 'Assigned employee not found');
  }

  quest.status = 'completed';
  quest.progress = 100;
  recomputeMonsterHp(quest);
  quest.history.push({ action: 'approved', by: managerId, time: new Date().toISOString() });

  employee.exp = clamp(Number(employee.exp || 0) + Number(quest.reward?.exp || 0), 0, Number.MAX_SAFE_INTEGER);
  employee.gold = clamp(Number(employee.gold || 0) + Number(quest.reward?.gold || 0), 0, Number.MAX_SAFE_INTEGER);

  const item = String(quest.reward?.item || '').trim();
  if (item) {
    const existing = Array.isArray(employee.homeItems) ? employee.homeItems : [];
    if (!existing.includes(item)) {
      employee.homeItems = [...existing, item];
    }
  }

  await Promise.all([quest.save(), employee.save()]);

  const mappedUser = toQuestSpaceUser(employee);

  return res.status(200).json({
    quest,
    user: mappedUser,
    success: true,
    data: { quest, user: mappedUser }
  });
});

module.exports = {
  listQuests,
  createQuests,
  getQuestById,
  acceptQuest,
  progressQuest,
  approveQuest
};
