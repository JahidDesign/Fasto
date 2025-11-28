import React, { useState, useEffect } from "react";
import { connect, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  loadingToggleAction,
  loginAction,
} from "../../store/actions/AuthActions";
import Swal from "sweetalert2";

// image
import logo2 from "../../assets/images/logo-full-white.png";
import login from "../../assets/images/login-bg.jpg";

function Login(props) {
  let year = new Date().getFullYear();

  const [username, setUsername] = useState("demoUser");
  const [password, setPassword] = useState("123456");
  const [errors, setErrors] = useState({ username: "", password: "" });

  const dispatch = useDispatch();
  const nav = useNavigate();

  function onLogin(e) {
    e.preventDefault();
    let error = false;
    const errorObj = { username: "", password: "" };

    if (!username.trim()) {
      errorObj.username = "Username is required";
      error = true;
    }
    if (!password.trim()) {
      errorObj.password = "Password is required";
      error = true;
    }

    setErrors(errorObj);

    if (error) return;

    dispatch(loadingToggleAction(true));
    dispatch(loginAction(username, password, nav)); // if your action still needs nav
  }

  // ✅ Show SweetAlert + navigate when login success
  useEffect(() => {
    if (props.successMessage) {
      Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: props.successMessage,
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        // dashboard e nebe
        nav("/dashboard");
      });
    }
  }, [props.successMessage, nav]);

  return (
    <div className="login-wrapper">
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

      <div className="login-aside-right">
        <div className="row m-0 justify-content-center h-100 align-items-center">
          <div className="col-xl-6 col-xxl-8">
            <div className="authincation-content">
              <div className="row no-gutters">
                <div className="col-xl-12">
                  <div className="auth-form">
                    <div className="mb-3">
                      <h2 className="text-primary">Welcome to Fasto</h2>
                    </div>
                    <h4 className="mb-4">
                      Sign in by entering information below
                    </h4>

                    {props.errorMessage && (
                      <div className="text-danger">{props.errorMessage}</div>
                    )}

                    {/* successMessage will now trigger SweetAlert instead */}

                    <form onSubmit={onLogin}>
                      <div className="form-group">
                        <label className="mb-2">
                          <strong>Username</strong>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                        />
                        {errors.username && (
                          <div className="text-danger fs-12">
                            {errors.username}
                          </div>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="mb-2">
                          <strong>Password</strong>
                        </label>
                        <input
                          type="password"
                          className="form-control"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        {errors.password && (
                          <div className="text-danger fs-12">
                            {errors.password}
                          </div>
                        )}
                      </div>

                      <div className="form-row d-flex justify-content-between mt-4 mb-2">
                        <div className="form-group">
                          <div className="form-check custom-checkbox ms-1">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id="basic_checkbox_1"
                            />
                            <label
                              className="form-check-label"
                              htmlFor="basic_checkbox_1"
                            >
                              Remember my preference
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="text-center">
                        <button
                          type="submit"
                          className="btn btn-primary btn-block"
                        >
                          Sign In
                        </button>
                      </div>
                    </form>

                    <div className="new-account mt-3">
                      <p>
                        Don't have an account?{" "}
                        <Link className="text-primary" to="/register">
                          Sign up
                        </Link>
                      </p>
                    </div>
                  </div>
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

export default connect(mapStateToProps)(Login);
