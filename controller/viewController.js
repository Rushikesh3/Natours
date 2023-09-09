const Tour = require('./../models/tourModel');
// const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Booking=require('./../models/bookingModel')

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();

  // 2) Bulid template
  // 3) Render that template from using tour data from 1)
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

///////////////////////////TOUR DETAIL PAGE
exports.getTour = catchAsync(async (req, res, next) => {
  // 1) get data for requested tour(including reviews and tour guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }

  // 2) Build template
  // 3) render page using data from 1)

  res.status(200).render('tour', {
    title: req.params.slug,
    tour,
  });
});

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'your account',
  });
};

exports.getLoginForm = (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  //1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  //Find tours with the returned  IDs
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });
  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

exports.getSignupForm = (req, res, next) => {
  res.status(200).render('signup', {
    title: 'Create your account',
  });
};
