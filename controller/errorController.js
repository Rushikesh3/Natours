const appError = require('./../utils/appError');

const handelCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new appError(message, 400);
};
const handelJWTError = () =>
  new appError('Invalid token pleas login again', 401);
const handelTExpiredError = () =>
  new appError('Your token hasbenn expire, please login again', 401);
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);
  const message = `Dupilicate field value:${value} Please use another value`;
  return new appError(message, 400);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid Input Data.${errors.join('. ')}`;
  return new appError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  ///API
  if (req.originalUrl.startsWith('/api')) {
    console.log(err);
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }
  ///// RENDER WEBSITE
  else {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  /// API
  if (req.originalUrl.startsWith('/api')) {
    // console.log(err);
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // console.error('ERROR 📛', err);
    return res.status(err.statusCode).json({
      status: 'error',
      message: 'some thimg went wrong',
    });
  }

  //RENDERED WEBSITE

  // if (err.isOperational) {
  //   return res.status(err.statusCode).render('error', {
  //     title: 'Something went wrong',
  //     msg: err.message,
  //   });
  // }
  // console.error('ERROR 📛', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: 'Please try again later',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV == 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV == 'production') {
    let error = { ...err };
    if (error.statusCode === 500) {
      error = handelCastErrorDB(err);
    }
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handelJWTError();
    if (error.name === 'TokenExpiredError') error = handelTExpiredError();

    sendErrorProd(error, req, res);
  }
};
