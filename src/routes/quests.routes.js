const express = require('express');
const questsController = require('../controllers/quests.controller');

const router = express.Router();

router.get('/', questsController.listQuests);
router.post('/', questsController.createQuests);
router.get('/:id', questsController.getQuestById);
router.post('/:id/accept', questsController.acceptQuest);
router.post('/:id/progress', questsController.progressQuest);
router.post('/:id/approve', questsController.approveQuest);

module.exports = router;
