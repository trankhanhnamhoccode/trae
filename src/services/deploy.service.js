const Project = require('../models/Project');
const logService = require('./log.service');

const slugify = (value) => {
  return String(value || 'project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'project';
};

const simulateDeploy = async (projectId) => {
  const project = await Project.findById(projectId);

  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  if (project.status === 'deployed') {
    return project;
  }

  if (project.status !== 'ready') {
    const error = new Error('Project must be ready before deployment simulation');
    error.statusCode = 400;
    throw error;
  }

  await logService.createLog(projectId, 'info', 'Starting deploy simulation...');

  const liveUrl = `https://devflow-demo.app/${slugify(project.title)}-${project._id.toString().slice(-6)}`;

  project.status = 'deployed';
  project.liveUrl = liveUrl;
  await project.save();

  logService.emitProjectEvent(projectId, 'status', {
    status: project.status,
    project
  });

  await logService.createLog(projectId, 'success', `Deploy simulation complete: ${liveUrl}`);

  return project;
};

module.exports = {
  simulateDeploy
};
