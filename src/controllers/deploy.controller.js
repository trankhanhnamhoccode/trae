const deployService = require('../services/deploy.service');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

const deployProject = asyncHandler(async (req, res) => {
  const project = await deployService.simulateDeploy(req.params.projectId);

  return sendSuccess(res, 200, 'Project deployed successfully', {
    status: project.status,
    liveUrl: project.liveUrl
  });
});

module.exports = {
  deployProject
};
