import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import swal from "sweetalert";
import { connect, useDispatch } from "react-redux";

import {
  loadingToggleAction,
  signupAction,
} from "../../store/actions/AuthActions";

// images
import logo2 from "../../assets/images/logo-full-white.png";
import login from "../../assets/images/reg-bg.jpg";

const ACCENT = "#f21b6a";
const TEXT_LIGHT = "#ffffff";

function Register(props) {
  let year = new Date().getFullYear();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [preferredChannel, setPreferredChannel] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");


  const [showPassword, setShowPassword] = useState(false);

  const errorsTemplate = {
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    phoneNumber: "",
  };

  const [errors, setErrors] = useState(errorsTemplate);

  // password strength state
  const [passwordStrength, setPasswordStrength] = useState({
    label: "",
    score: 0,
    valid: false,
    rules: {
      length: false,
      upper: false,
      number: false,
      special: false,
    },
  });

  const dispatch = useDispatch();
  const nav = useNavigate();

  // --------- helper validation functions ---------
  function validateUsername(val) {
    const value = val.trim();
    if (!value) return "Username is required";
    if (value.length < 3) return "Username must be at least 3 characters";
    return "";
  }

  function validateEmail(val) {
    const value = val.trim();
    if (!value) return "Email is required";
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(value)) return "Enter a valid email address";
    return "";
  }

  function evaluatePassword(pw) {
    const length = pw.length >= 8;
    const upper = /[A-Z]/.test(pw);
    const number = /[0-9]/.test(pw);
    const special = /[^A-Za-z0-9]/.test(pw);

    const rules = { length, upper, number, special };
    const passedCount =
      (length ? 1 : 0) +
      (upper ? 1 : 0) +
      (number ? 1 : 0) +
      (special ? 1 : 0);

    let label = "";
    let score = 0;

    if (!pw) {
      label = "";
      score = 0;
    } else if (passedCount <= 1) {
      label = "Weak";
      score = 25;
    } else if (passedCount === 2) {
      label = "Fair";
      score = 50;
    } else if (passedCount === 3) {
      label = "Good";
      score = 75;
    } else if (passedCount === 4) {
      label = "Strong";
      score = 100;
    }

    return {
      label,
      score,
      valid: length && upper && number && special,
      rules,
    };
  }

  // --------- field change handlers with inline validation ---------
  function handleUsernameChange(e) {
    const value = e.target.value;
    setUsername(value);
    setErrors((prev) => ({
      ...prev,
      username: validateUsername(value),
    }));
  }

  function handleEmailChange(e) {
    const value = e.target.value;
    setEmail(value);
    setErrors((prev) => ({
      ...prev,
      email: validateEmail(value),
    }));
  }

  function handlePasswordChange(e) {
    const pw = e.target.value;
    setPassword(pw);
    setPasswordStrength(evaluatePassword(pw));
  }

  // --------- submit ---------
  function onSignUp(e) {
    e.preventDefault();

    let error = false;
    const errorObj = { ...errorsTemplate };

    if (!firstName.trim()) {
      errorObj.firstName = "First name is required";
      error = true;
    }

    if (!lastName.trim()) {
      errorObj.lastName = "Last name is required";
      error = true;
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
      errorObj.username = usernameError;
      error = true;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      errorObj.email = emailError;
      error = true;
    }

    if (!password.trim()) {
      errorObj.password = "Password is required";
      error = true;
    } else if (!passwordStrength.valid) {
      errorObj.password =
        "Password must be at least 8 characters and include an uppercase letter, a number, and a special character.";
      error = true;
    }

    // phone: optional, but if present must be 10–15 digits
    if (phoneNumber && !/^\d{10,15}$/.test(phoneNumber)) {
      errorObj.phoneNumber = "Phone number must be 10–15 digits";
      error = true;
    }

    setErrors(errorObj);

    if (error) {
      const firstError =
        errorObj.firstName ||
        errorObj.lastName ||
        errorObj.username ||
        errorObj.email ||
        errorObj.password ||
        errorObj.phoneNumber;
      if (firstError) swal("Oops", firstError, "error");
      return;
    }

    const payload = {
      user_info: {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone_number: phoneNumber || undefined,
      },
      account_setup: {
        username: username,
        password: password,
        preferred_communication_channel: preferredChannel || undefined,
      },
    };

    dispatch(loadingToggleAction(true));
    dispatch(signupAction(payload, nav));
  }

  // pick progress bar color based on strength
  const strengthClass =
    passwordStrength.score === 0
      ? ""
      : passwordStrength.score <= 25
      ? "bg-danger"
      : passwordStrength.score <= 50
      ? "bg-warning"
      : passwordStrength.score <= 75
      ? "bg-info"
      : "bg-success";

  // common styles
  const inputStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    color: TEXT_LIGHT,
    borderRadius: "999px",
    padding: "0.6rem 1rem",
    border: "none",
    outline: "none",
  };

  const labelStyle = {
    color: TEXT_LIGHT,
    fontSize: "0.8rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    opacity: 0.85,
  };

  const smallTextStyle = { color: "#d4c8ff" };

  // section-style wrapper (no card)
  const sectionWrapperStyle = {
    maxWidth: "540px",
    margin: "0 auto",
    padding: "2.5rem 0",
    borderTop: `2px solid ${ACCENT}`,
  };

  const buttonStyle = {
    backgroundImage: "linear-gradient(135deg, #ff4b8b, #f21b6a)",
    border: "none",
    color: "#ffffff",
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    borderRadius: "999px",
    padding: "0.75rem 1rem",
    boxShadow: "0 10px 25px rgba(242, 27, 106, 0.45)",
  };

  return (
    <div className="login-wrapper">
      {/* LEFT SIDE */}
      <div
        className="login-aside-left"
        style={{ backgroundImage: "url(" + login + ")" }}
      >
        <Link to="/" className="login-logo">
          <img src={logo2} alt="" />
        </Link>
        <div className="login-description">
          <h2 className="text-white mb-4">Check the Status</h2>
          <p className="fs-12">
            It is a long established fact that a reader will be distracted by
            the readable content of a page when looking at its layout. The point
            of using Lorem Ipsum is that it has a more-or-less normal
            distribution of letters,
          </p>
          <ul className="social-icons mt-4">
            <li>
              <Link to={"#"}>
                <i className="fab fa-facebook-f"></i>
              </Link>
            </li>
            <li>
              <Link to={"#"}>
                <i className="fab fa-twitter"></i>
              </Link>
            </li>
            <li>
              <Link to={"#"}>
                <i className="fab fa-linkedin-in"></i>
              </Link>
            </li>
          </ul>
          <div className="mt-5">
            <Link to={"#"} className="text-white me-4">
              Privacy Policy
            </Link>
            <Link to={"#"} className="text-white me-4">
              Contact
            </Link>
            <Link to={"#"} className="text-white">
              © {year} DexignZone
            </Link>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div
        className="login-aside-right"
        style={{
          background:
            "radial-gradient(circle at top, #301047 0, #090313 55%, #05010a 100%)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-md-11 col-lg-9">
              <div style={sectionWrapperStyle}>
                <div className="text-start mb-4">
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.25rem 0.8rem",
                      borderRadius: "999px",
                      fontSize: "0.7rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      backgroundColor: "rgba(242, 27, 106, 0.18)",
                      color: ACCENT,
                      marginBottom: "0.75rem",
                    }}
                  >
                    Get started
                  </span>
                  <h2
                    className="mb-2"
                    style={{ color: "#ffffff", fontWeight: 800 }}
                  >
                    Create your account
                  </h2>
                  <p className="mb-0" style={smallTextStyle}>
                    Join the platform in a few quick steps.
                  </p>
                </div>

                {/* ERROR MESSAGE */}
                {props.errorMessage && (
                  <div
                    className="alert py-2 mb-3"
                    style={{
                      backgroundColor: "#ff4b70",
                      color: "#fff",
                      border: "none",
                      borderRadius: "0.75rem",
                    }}
                  >
                    {typeof props.errorMessage === "string"
                      ? props.errorMessage
                      : props.errorMessage.message ||
                        props.errorMessage.error ||
                        JSON.stringify(props.errorMessage)}
                  </div>
                )}

                {/* SUCCESS MESSAGE */}
                {props.successMessage && (
                  <div
                    className="alert py-2 mb-3"
                    style={{
                      backgroundColor: "#2ecc71",
                      color: "#fff",
                      border: "none",
                      borderRadius: "0.75rem",
                    }}
                  >
                    {typeof props.successMessage === "string"
                      ? props.successMessage
                      : props.successMessage.message ||
                        props.successMessage.info ||
                        JSON.stringify(props.successMessage)}
                  </div>
                )}

                <form onSubmit={onSignUp}>
                  {/* First / Last Name */}
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label className="mb-1" style={labelStyle}>
                          First Name
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          style={inputStyle}
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="John"
                        />
                        {errors.firstName && (
                          <div className="text-danger small mt-1">
                            {errors.firstName}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label className="mb-1" style={labelStyle}>
                          Last Name
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          style={inputStyle}
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Doe"
                        />
                        {errors.lastName && (
                          <div className="text-danger small mt-1">
                            {errors.lastName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="form-group mb-3">
                    <label className="mb-1" style={labelStyle}>
                      Username
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      style={inputStyle}
                      value={username}
                      onChange={handleUsernameChange}
                      placeholder="johndoe123"
                    />
                    {errors.username && (
                      <div className="text-danger small mt-1">
                        {errors.username}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="form-group mb-3">
                    <label className="mb-1" style={labelStyle}>
                      Email
                    </label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      style={inputStyle}
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="you@example.com"
                    />
                    {errors.email && (
                      <div className="text-danger small mt-1">
                        {errors.email}
                      </div>
                    )}
                  </div>

                  {/* Phone + Preferred channel */}
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label className="mb-1" style={labelStyle}>
                          Phone Number{" "}
                          <span style={{ opacity: 0.6 }}>(optional)</span>
                        </label>
                        <input
                          type="tel"
                          className="form-control form-control-lg"
                          style={inputStyle}
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="10–15 digits"
                        />
                        {errors.phoneNumber && (
                          <div className="text-danger small mt-1">
                            {errors.phoneNumber}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label className="mb-1" style={labelStyle}>
                          Preferred Communication
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          style={inputStyle}
                          value={preferredChannel}
                          onChange={(e) =>
                            setPreferredChannel(e.target.value)
                          }
                          placeholder="Email, SMS, WhatsApp..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password + eye icon */}
                  <div className="form-group mb-2">
                    <label className="mb-1" style={labelStyle}>
                      Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control form-control-lg"
                        style={inputStyle}
                        value={password}
                        onChange={handlePasswordChange}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-light"
                        onClick={() => setShowPassword((prev) => !prev)}
                        style={{
                          borderRadius: "999px",
                          marginLeft: "0.5rem",
                        }}
                      >
                        <i
                          className={
                            showPassword ? "fa fa-eye-slash" : "fa fa-eye"
                          }
                        />
                      </button>
                    </div>
                    {errors.password && (
                      <div className="text-danger small mt-1">
                        {errors.password}
                      </div>
                    )}
                  </div>

                  {/* Password strength meter */}
                  {password && (
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <small style={smallTextStyle}>
                          Password strength:{" "}
                          <strong>{passwordStrength.label}</strong>
                        </small>
                        <small style={smallTextStyle}>
                          {passwordStrength.score}%
                        </small>
                      </div>
                      <div
                        className="progress"
                        style={{
                          height: "6px",
                          backgroundColor: "rgba(255,255,255,0.08)",
                          borderRadius: "999px",
                        }}
                      >
                        <div
                          className={`progress-bar ${strengthClass}`}
                          role="progressbar"
                          style={{
                            width: `${passwordStrength.score}%`,
                            borderRadius: "999px",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Rules checklist */}
                  <div className="mb-3">
                    <small className="d-block mb-1" style={smallTextStyle}>
                      Your password must include:
                    </small>
                    <ul
                      className="list-unstyled mb-0 ps-3"
                      style={smallTextStyle}
                    >
                      <li
                        className={
                          passwordStrength.rules.length ? "text-success" : ""
                        }
                      >
                        {passwordStrength.rules.length ? "✓" : "•"} At least 8
                        characters
                      </li>
                      <li
                        className={
                          passwordStrength.rules.upper ? "text-success" : ""
                        }
                      >
                        {passwordStrength.rules.upper ? "✓" : "•"} 1 uppercase
                        letter
                      </li>
                      <li
                        className={
                          passwordStrength.rules.number ? "text-success" : ""
                        }
                      >
                        {passwordStrength.rules.number ? "✓" : "•"} 1 number
                      </li>
                      <li
                        className={
                          passwordStrength.rules.special ? "text-success" : ""
                        }
                      >
                        {passwordStrength.rules.special ? "✓" : "•"} 1 special
                        character
                      </li>
                    </ul>
                  </div>

                  <div className="text-start mt-4">
                    <button
                      type="submit"
                      className="btn btn-block w-100"
                      style={buttonStyle}
                    >
                      Create account
                    </button>
                  </div>
                </form>

                <div className="new-account mt-4 text-start">
                  <p className="mb-0" style={smallTextStyle}>
                    Already have an account?{" "}
                    <Link
                      className="text-primary"
                      to="/login"
                      style={{ color: ACCENT, fontWeight: 600 }}
                    >
                      Login
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const mapStateToProps = (state) => {
  return {
    errorMessage: state.auth.errorMessage,
    successMessage: state.auth.successMessage,
    showLoading: state.auth.showLoading,
  };
};

export default connect(mapStateToProps)(Register);
