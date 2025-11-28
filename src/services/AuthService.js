import axios from "axios";
import swal from "sweetalert";
import {
  loginConfirmedAction,
  Logout,
} from "../store/actions/AuthActions";

const API_BASE_URL = "https://carlo.algorethics.ai/api/auth";

/**
 * SIGNUP
 * payload shape:
 * {
 *   user_info: {
 *     first_name,
 *     last_name,
 *     email,
 *     phone_number?
 *   },
 *   account_setup: {
 *     username,
 *     password,
 *     preferred_communication_channel?
 *   }
 * }
 */
export function signUp(payload) {
  return axios.post(`${API_BASE_URL}/register`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * LOGIN
 * POST /api/auth/login
 * {
 *   "username": "string (min 3 chars)",
 *   "password": "string"
 * }
 */
export function login(username, password) {
  const postData = { username, password };

  return axios.post(`${API_BASE_URL}/login`, postData, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Handle both register & login error formats.
 */
export function formatError(errorResponse) {
  if (!errorResponse) {
    swal("Oops", "Something went wrong. Please try again.", "error");
    return "Something went wrong. Please try again.";
  }

  const { message, errors } = errorResponse;

  // Array of validation errors
  if (Array.isArray(errors) && errors.length > 0) {
    const joined = errors.join(", ");
    swal("Validation error", joined, "error");
    return joined;
  }

  if (message === "Invalid credentials") {
    swal("Oops", "Invalid username or password", "error");
    return message;
  }

  if (message === "Validation error") {
    swal("Oops", "Validation error", "error");
    return message;
  }

  if (message === "Server error during login") {
    swal("Oops", message, "error");
    return message;
  }

  // Also covers register messages like:
  // "Username already exists", "Email already registered",
  // "Server error during registration", etc.
  swal("Oops", message || "Something went wrong", "error");
  return message || "Something went wrong";
}

/**
 * Save token + expiration in localStorage.
 *
 * Expected shape:
 * {
 *   message,
 *   accessToken,
 *   refreshToken,
 *   profile_completed,
 *   id,
 *   username,
 *   expiresIn? (seconds, optional; default 900)
 * }
 */
export function saveTokenInLocalStorage(tokenDetails) {
  const expiresInSeconds = tokenDetails.expiresIn || 900; // 15 minutes fallback

  const expireDate = new Date(
    new Date().getTime() + expiresInSeconds * 1000
  );

  const dataToStore = {
    ...tokenDetails,
    expiresIn: expiresInSeconds,
    expireDate,
  };

  localStorage.setItem("userDetails", JSON.stringify(dataToStore));
}

/**
 * Run logout timer
 */
export function runLogoutTimer(dispatch, timer, navigate) {
  setTimeout(() => {
    dispatch(Logout(navigate));
  }, timer);
}

/**
 * Auto login if token still valid
 */
export function checkAutoLogin(dispatch, navigate) {
  const tokenDetailsString = localStorage.getItem("userDetails");

  if (!tokenDetailsString) {
    dispatch(Logout(navigate));
    return;
  }

  const tokenDetails = JSON.parse(tokenDetailsString);
  const expireDate = new Date(tokenDetails.expireDate);
  const todaysDate = new Date();

  if (todaysDate > expireDate) {
    dispatch(Logout(navigate));
    return;
  }

  dispatch(loginConfirmedAction(tokenDetails));

  const timer = expireDate.getTime() - todaysDate.getTime();
  runLogoutTimer(dispatch, timer, navigate);
}

/**
 * Simple login check
 */
export function isLogin() {
  const tokenDetailsString = localStorage.getItem("userDetails");
  return !!tokenDetailsString;
}
