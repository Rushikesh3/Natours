const Stripe = require('stripe');
// const stripe = require('stripe')(process.env.STRIPE_SECRETE_KEY);
const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const APIFeatures = require(`./../utils/apiFeatures`);
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
// const { use } = require('../Routes/bookingRoutes');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const stripe = Stripe(process.env.STRIPE_SECRETE_KEY);
  /// 1) Get Currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  //   console.log(tour);

  // 2) Ceate checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/`,
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'INR',
          unit_amount: tour.price * 100 * 25,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
      },
    ],
    mode: 'payment',
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();
  //   console.log('😊😊😊😊');
  //   console.log(tour, user, price);
  //   console.log(req.originalUrl.split('?')[0]);

  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});
