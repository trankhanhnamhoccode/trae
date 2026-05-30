const express = require('express');
const projectController = require('../controllers/project.controller');

const router = express.Router();

router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:projectId', projectController.getProjectById);
router.delete('/:projectId', projectController.deleteProject);

module.exports = router;
