const express = require('express');
const router = express.Router();
const bookingController = require('./../controller/bookingController');
const authController = require('./../controller/authController');

// router
//   .route('checkout-session/:tourId')
//   .get(authController.protect, bookingController.getCheckoutSession);

router.get(
  '/checkout-session/:tourId',
  authController.protect,
  bookingController.getCheckoutSession
);

module.exports = router;
