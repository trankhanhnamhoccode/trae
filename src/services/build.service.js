const Project = require('../models/Project');
const ProjectFile = require('../models/ProjectFile');
const BuildLog = require('../models/BuildLog');
const aiService = require('./ai.service');
const logService = require('./log.service');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const setProjectStatus = async (projectId, status, extraFields = {}) => {
  const project = await Project.findByIdAndUpdate(
    projectId,
    {
      status,
      ...extraFields
    },
    { new: true }
  );

  if (project) {
    logService.emitProjectEvent(projectId, 'status', {
      status: project.status,
      project
    });
  }

  return project;
};

const runBuildPipeline = async (projectId) => {
  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new Error('Project not found during build pipeline');
    }

    await logService.createLog(projectId, 'info', 'Analyzing prompt...');
    await sleep(700);

    await logService.createLog(projectId, 'info', 'Creating generation plan...');
    const aiResult = await aiService.generateProject(project);

    await Project.findByIdAndUpdate(projectId, {
      plan: aiResult.plan,
      previewDescription: aiResult.previewDescription,
      previewUrl: `/preview/${projectId}`,
      errorMessage: ''
    });

    await logService.createLog(projectId, 'success', 'Plan generated successfully.');
    await setProjectStatus(projectId, 'building');
    await logService.createLog(projectId, 'info', 'Generating project files...');

    for (const file of aiResult.files) {
      await sleep(350);
      await ProjectFile.create({
        projectId,
        path: file.path,
        language: file.language,
        content: file.content
      });
      await logService.createLog(projectId, 'success', `Generated file: ${file.path}`);
    }

    await sleep(500);
    await setProjectStatus(projectId, 'ready');
    await logService.createLog(projectId, 'success', 'Build completed. Project is ready for preview.');
  } catch (error) {
    await setProjectStatus(projectId, 'failed', {
      errorMessage: error.message
    });
    await logService.createLog(projectId, 'error', `Build failed: ${error.message}`);
  }
};

const startBuild = async (projectId) => {
  const project = await Project.findById(projectId);

  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  if (['planning', 'building'].includes(project.status)) {
    const error = new Error('Build is already running for this project');
    error.statusCode = 409;
    throw error;
  }

  await ProjectFile.deleteMany({ projectId });
  await BuildLog.deleteMany({ projectId });

  const updatedProject = await setProjectStatus(projectId, 'planning', {
    plan: [],
    previewDescription: '',
    previewUrl: '',
    liveUrl: '',
    errorMessage: ''
  });

  await logService.createLog(projectId, 'info', 'Build started. Status changed to planning.');

  // Run the build after the HTTP response can return immediately.
  setImmediate(() => {
    runBuildPipeline(projectId).catch((error) => {
      console.error('Unexpected build pipeline error:', error);
    });
  });

  return updatedProject;
};

module.exports = {
  startBuild,
  runBuildPipeline
};
