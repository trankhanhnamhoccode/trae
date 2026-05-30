const Project = require('../models/Project');
const BuildLog = require('../models/BuildLog');
const ProjectFile = require('../models/ProjectFile');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const createProject = asyncHandler(async (req, res) => {
  const { title, prompt, appType, modelType } = req.body;

  if (!title || !prompt) {
    const error = new Error('title and prompt are required');
    error.statusCode = 400;
    throw error;
  }

  const project = await Project.create({
    title,
    prompt,
    appType: appType || 'web-app',
    modelType: modelType || 'balanced',
    status: 'pending'
  });

  return sendSuccess(res, 201, 'Project created successfully', {
    project
  });
});

const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find().sort({ createdAt: -1 });

  return sendSuccess(res, 200, '', {
    projects
  });
});

const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId);

  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  return sendSuccess(res, 200, '', {
    project
  });
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId);

  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  await Promise.all([
    BuildLog.deleteMany({ projectId: project._id }),
    ProjectFile.deleteMany({ projectId: project._id }),
    project.deleteOne()
  ]);

  return sendSuccess(res, 200, 'Project deleted successfully', {
    projectId: req.params.projectId
  });
});

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  deleteProject
};
