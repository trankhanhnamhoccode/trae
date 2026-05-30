const Project = require('../models/Project');
const ProjectFile = require('../models/ProjectFile');
const buildService = require('../services/build.service');
const logService = require('../services/log.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const startBuild = asyncHandler(async (req, res) => {
  const project = await buildService.startBuild(req.params.projectId);

  return sendSuccess(res, 202, 'Build started', {
    projectId: project._id,
    status: project.status
  });
});

const getLogs = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId);

  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  const logs = await logService.getLogsByProjectId(req.params.projectId);

  return sendSuccess(res, 200, '', {
    logs
  });
});

const getFiles = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId);

  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  const files = await ProjectFile.find({ projectId: req.params.projectId }).sort({ path: 1 });

  return sendSuccess(res, 200, '', {
    files
  });
});

const getStatus = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId).select('status liveUrl previewUrl errorMessage updatedAt');

  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  return sendSuccess(res, 200, '', {
    projectId: project._id,
    status: project.status,
    previewUrl: project.previewUrl,
    liveUrl: project.liveUrl,
    errorMessage: project.errorMessage,
    updatedAt: project.updatedAt
  });
});

const streamEvents = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId).select('status liveUrl previewUrl errorMessage');

  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  logService.subscribeProjectEvents(req.params.projectId, res, {
    status: project.status,
    previewUrl: project.previewUrl,
    liveUrl: project.liveUrl,
    errorMessage: project.errorMessage
  });
});

module.exports = {
  startBuild,
  getLogs,
  getFiles,
  getStatus,
  streamEvents
};
