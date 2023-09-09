const express = require('express');
const bookingController = require('./../controller/bookingController');
const viewController = require('./../controller/viewController');
const authController = require('./../controller/authController');

const router = express.Router();

module.exports = router;

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewController.getOverview
);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
router.get('/login', authController.isLoggedIn, viewController.getLoginForm);
router.get('/signup', authController.isLoggedIn, viewController.getSignupForm);
router.get('/me', authController.protect, viewController.getAccount);
router.get('/my-tours', authController.protect, viewController.getMyTours);


// router.get('/', (req, res) => {
//   res.status(200).render('base', {
//     title: 'Exciting tours for adventures people',
//     user: 'Rushi',
//   });
// });
