import axios from '../../Config/api/api';
import jwt_decode from 'jwt-decode';
import AsyncStorage from '@react-native-community/async-storage';
import { SET_CURRENT_USER, GET_ERRORS, CLEAR_ERRORS } from './types';
// Register User
export const registerUser = userData => dispatch => {
  axios
    .post('/user/register', userData)
    .then(res =>
      dispatch({
        type: GET_ERRORS,
        payload: {
          message: res.data,
          visible: true,
          success:true
        }
      })
    )
    .catch(err =>
      dispatch({
        type: GET_ERRORS,
        payload: {
          message: err.response.data,
          visible: true,
          success:false
        }
      })
    );
};

export const loginUser = userData => dispatch => {
  axios
    .post('/users/mobile/signin', userData)
    .then(res => {
      const { token } = res.data;
      AsyncStorage.setItem('token', token);
      console.log(token);
      const decoded = jwt_decode(token);
      dispatch(clearErrors());
      dispatch(setCurrentUser(decoded));
    })
    .catch(err =>
      dispatch({
        type: GET_ERRORS,
        payload: {
          message: err.response.data,
          visible: true
        }
      })
    );
};

// Set logged in user
export const setCurrentUser = decoded => {
  return {
    type: SET_CURRENT_USER,
    payload: decoded
  };
};

// Log user out
export const logoutUser = () => dispatch => {

    AsyncStorage.removeItem('token');
    dispatch(setCurrentUser({}));

};

// Clear errors
export const clearErrors = () => {
  return {
    type: CLEAR_ERRORS
  };
};
