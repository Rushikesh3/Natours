const path = require('path');
const express = require('express');
const morgan = require('morgan');
const ratelimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
// const pug = require('pug');
const cookieParser = require('cookie-parser');

const appError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// serving static files
app.use(express.static(path.join(__dirname, 'public')));

//DEVELOPMENT LOGIN
if (process.env.NODE_ENV === 'development') {
  console.log('In Development');
  app.use(morgan('dev'));
}
//GLOBAL MIDLLEWARE

//SET SECURITY HHTP HEADER
app.use(helmet());

//limit request from same API
const limiter = ratelimit({
  max: 100,
  windowMS: 60 * 60 * 1000,
  message: 'Too many request from this IP, Please try again in an hour! ',
});

app.use('/api', limiter);

//BODY PARSER ,READING DATA FROM BODY INTO REQ.BODY
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(cors());

//DATA Sanitization against NOSQL query injection
app.use(mongoSanitize());

//DATA Sanitization against XSS
app.use(xss());
//Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// serving static files
app.use(express.static(`${__dirname}/public`));

//TEST MIDDLEWARE
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  // console.log('req.cookies');
  next();
});

//ROUTES

app.use('/', viewRouter);
app.use('/api/v1/tours/', tourRouter);
app.use('/api/v1/users/', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  // const err = new Error(`Cant find ${req.originalUrl} on this server`);
  // err.statusCode = 404;
  // err.status =  'fail';
  next(new appError(`Cant find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
