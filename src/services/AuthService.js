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
 *
 * Tries to produce a human-readable string even when `errors`
 * is an array of objects or a field->messages map.
 */
export function formatError(errorResponse) {
  if (!errorResponse) {
    swal("Oops", "Something went wrong. Please try again.", "error");
    return "Something went wrong. Please try again.";
  }

  console.log("API error response:", errorResponse); // helpful while debugging

  const { message, errors } = errorResponse;

  let prettyErrors = "";

  // --- 1) errors is an array (e.g. [{ field, message }, ...] or ["msg1", "msg2"] ) ---
  if (Array.isArray(errors) && errors.length > 0) {
    prettyErrors = errors
      .map((err) => {
        if (typeof err === "string") return err;

        // common patterns: { message }, { msg }, { field, message }, etc.
        if (err.message) return err.message;
        if (err.msg) return err.msg;
        if (err.field && err.error) return `${err.field}: ${err.error}`;
        if (err.field && err.message) return `${err.field}: ${err.message}`;

        // fallback
        return JSON.stringify(err);
      })
      .join("\n");
  }

  // --- 2) errors is an object (e.g. { email: ["Email taken"], username: ["Too short"] } ) ---
  if (!prettyErrors && errors && typeof errors === "object") {
    prettyErrors = Object.entries(errors)
      .map(([field, value]) => {
        if (Array.isArray(value)) return `${field}: ${value.join(", ")}`;
        if (typeof value === "string") return `${field}: ${value}`;
        return `${field}: ${JSON.stringify(value)}`;
      })
      .join("\n");
  }

  if (prettyErrors) {
    swal("Validation error", prettyErrors, "error");
    return prettyErrors;
  }

  // --- 3) fall back to message-based logic (login / simple errors) ---
  if (message === "Invalid credentials") {
    swal("Oops", "Invalid username or password", "error");
    return message;
  }

  if (message === "Validation error") {
    swal("Validation error", "Please check the form and try again.", "error");
    return message;
  }

  if (message === "Server error during login") {
    swal("Oops", message, "error");
    return message;
  }

  // Register-specific messages like:
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
