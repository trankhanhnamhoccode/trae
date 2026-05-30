const EventEmitter = require('events');
const BuildLog = require('../models/BuildLog');

const eventBus = new EventEmitter();
eventBus.setMaxListeners(1000);

const getProjectEventName = (projectId) => `project:${projectId.toString()}`;

const emitProjectEvent = (projectId, type, data) => {
  eventBus.emit(getProjectEventName(projectId), {
    type,
    data: {
      projectId: projectId.toString(),
      ...data
    }
  });
};

const createLog = async (projectId, level, message) => {
  const log = await BuildLog.create({
    projectId,
    level,
    message
  });

  emitProjectEvent(projectId, 'log', {
    log
  });

  return log;
};

const getLogsByProjectId = async (projectId) => {
  return BuildLog.find({ projectId }).sort({ createdAt: 1 });
};

const subscribeProjectEvents = (projectId, res, initialData = {}) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (eventName, data) => {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send('connected', {
    projectId: projectId.toString(),
    message: 'Connected to project event stream',
    ...initialData
  });

  const listener = (payload) => {
    send(payload.type, payload.data);
  };

  const heartbeat = setInterval(() => {
    send('heartbeat', {
      projectId: projectId.toString(),
      timestamp: new Date().toISOString()
    });
  }, 25000);

  eventBus.on(getProjectEventName(projectId), listener);

  res.on('close', () => {
    clearInterval(heartbeat);
    eventBus.off(getProjectEventName(projectId), listener);
    res.end();
  });
};

module.exports = {
  createLog,
  getLogsByProjectId,
  emitProjectEvent,
  subscribeProjectEvents
};
