const { sendError } = require('../utils/apiResponse');

const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || res.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = null;

  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((item) => item.message);
  }

  if (err.code === 11000) {
    statusCode = 409;
    const duplicatedField = Object.keys(err.keyValue || {}).join(', ');
    message = duplicatedField ? `${duplicatedField} already exists` : 'Duplicate value already exists';
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  return sendError(res, statusCode, message, errors);
};

module.exports = errorMiddleware;
