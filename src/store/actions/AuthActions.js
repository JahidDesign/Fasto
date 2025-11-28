import {
  formatError,
  login,
  runLogoutTimer,
  saveTokenInLocalStorage,
  signUp,
} from "../../services/AuthService";

export const SIGNUP_CONFIRMED_ACTION = "[signup action] confirmed signup";
export const SIGNUP_FAILED_ACTION = "[signup action] failed signup";
export const LOGIN_CONFIRMED_ACTION = "[login action] confirmed login";
export const LOGIN_FAILED_ACTION = "[login action] failed login";
export const LOADING_TOGGLE_ACTION = "[Loading action] toggle loading";
export const LOGOUT_ACTION = "[Logout action] logout action";
export const NAVTOGGLE = "NAVTOGGLE";

/**
 * SIGNUP
 * payload:
 * {
 *   user_info: {...},
 *   account_setup: {...}
 * }
 */
export function signupAction(payload, navigate) {
  return (dispatch) => {
    // turn loading ON
    dispatch(loadingToggleAction(true));

    signUp(payload)
      .then((response) => {
        // save tokens & user info
        saveTokenInLocalStorage(response.data);

        const expiresInSeconds = response.data.expiresIn || 900; // 15 min default
        runLogoutTimer(dispatch, expiresInSeconds * 1000, navigate);

        // redux state update
        dispatch(confirmedSignupAction(response.data));

        // go to dashboard
        navigate("/dashboard");
      })
      .catch((error) => {
        console.error("Signup error:", error?.response || error);
        const errorMessage = formatError(error?.response?.data);
        dispatch(signupFailedAction(errorMessage));
      })
      .finally(() => {
        // turn loading OFF
        dispatch(loadingToggleAction(false));
      });
  };
}

export function Logout(navigate) {
  localStorage.removeItem("userDetails");
  navigate("/login");

  return {
    type: LOGOUT_ACTION,
  };
}

/**
 * LOGIN
 * calls POST /api/auth/login
 * body: { username, password }
 */
export function loginAction(username, password, navigate) {
  return (dispatch) => {
    // turn loading ON
    dispatch(loadingToggleAction(true));

    login(username, password)
      .then((response) => {
        // save tokens & user info
        saveTokenInLocalStorage(response.data);

        const expiresInSeconds = response.data.expiresIn || 900; // 15 min default
        runLogoutTimer(dispatch, expiresInSeconds * 1000, navigate);

        // redux state update
        dispatch(loginConfirmedAction(response.data));

        // go to dashboard
        navigate("/dashboard");
      })
      .catch((error) => {
        console.error("Login error:", error?.response || error);
        const errorMessage = formatError(error?.response?.data);
        dispatch(loginFailedAction(errorMessage));
      })
      .finally(() => {
        // turn loading OFF
        dispatch(loadingToggleAction(false));
      });
  };
}

export function loginFailedAction(data) {
  return {
    type: LOGIN_FAILED_ACTION,
    payload: data,
  };
}

export function loginConfirmedAction(data) {
  return {
    type: LOGIN_CONFIRMED_ACTION,
    payload: data,
  };
}

export function confirmedSignupAction(payload) {
  return {
    type: SIGNUP_CONFIRMED_ACTION,
    payload,
  };
}

export function signupFailedAction(message) {
  return {
    type: SIGNUP_FAILED_ACTION,
    payload: message,
  };
}

export function loadingToggleAction(status) {
  return {
    type: LOADING_TOGGLE_ACTION,
    payload: status,
  };
}

export const navtoggle = () => {
  return {
    type: NAVTOGGLE,
  };
};
  