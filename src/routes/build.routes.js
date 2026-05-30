const express = require('express');
const buildController = require('../controllers/build.controller');

const router = express.Router();

router.post('/:projectId/start-build', buildController.startBuild);
router.get('/:projectId/logs', buildController.getLogs);
router.get('/:projectId/files', buildController.getFiles);
router.get('/:projectId/status', buildController.getStatus);
router.get('/:projectId/events', buildController.streamEvents);

module.exports = router;
