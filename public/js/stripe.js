import axios from 'axios';
import { showAlert } from './alert';
const stripe = Stripe(
  'pk_test_51N2lEGSEI5rPsxWQEzBElxSgDj7EUuGBL2AJbXyX8KMhDuZUe2Qk1O5699zuJEoZrttQud7lbQojH6eZOOTlI1Oq003m60IdOf'
);

export const bookTour = async (tourId) => {
  try {
    // 1) get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    console.log('session');
    console.log(session);
    console.log('session');
    //   2) Create checkout from+charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
