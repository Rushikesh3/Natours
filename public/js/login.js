import axios from 'axios';
import { showAlert } from './alert';

// const User = require("../../models/userModel");

export const login = async (email, password) => {
  console.log(email, password);
  try {
    const res = await axios({
      method: 'POST',
      url: 'api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    // console.log(res);
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully', 4);
      console.log();
      window.setTimeout(() => {
        location.assign('/');
      }, 700);
    }
  } catch (err) {
    showAlert('error', err.response.data.message, 4);
    // console.log(err.response.data);
  }
};

export const logout = async () => {
  console.log('1 logout');
  try {
    // console.log('2 logout');
    const res = await axios({
      method: 'GET',  
      url: 'api/v1/users/logout',
    });

    if ((res.data.success = 'success')) {
      location.reload(true);
    }
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'Error loggging out! Try again.');
  }
};
