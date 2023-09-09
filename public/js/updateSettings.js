import axios from 'axios';
import { showAlert } from './alert';

export const updateSettings = async (data, type) => {
  try {
    const urll = type === 'password' ? 'updatePassword' : 'updateMe';
    const res = await axios({
      method: 'PATCH',
      url: `api/v1/users/${urll}`,
      data,
      //   data: {
      //     name,
      //     email,
      //   },
    });
    let status;
    if (urll === 'updatePassword') {
      status = res.data.status;
    }
    if (urll === 'updateMe') {
      status = res.data.data.status;
    }

    if (status === 'success') {
      showAlert('success', `${type.toUpperCase()} Updated successfully`, 4);
    }
  } catch (err) {
    showAlert('error', err.response.data.message, 4);
  }
};
