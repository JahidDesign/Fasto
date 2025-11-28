// authApi.js
// Carlo Rules Engine – Authentication & User Management Client
// Base URL: https://carlo.algorethics.ai/api/auth
//
// Endpoints covered:
//   POST /register         -> register user
//   POST /login            -> login user
//   POST /check-auth       -> check username/password validity
//   POST /refresh-token    -> refresh access token
//   POST /complete-profile -> complete profile (auth required)
//   PUT  /profile          -> update profile (auth required)
//   GET  /profile          -> get profile (auth required)
//   GET  /verify           -> verify current JWT (auth required)

export class AuthClient {
  /**
   * @param {Object} options
   * @param {string} [options.baseUrl]
   * @param {string} [options.accessToken]  - current JWT access token
   * @param {string} [options.refreshToken] - current refresh token
   */
  constructor({
    baseUrl = "https://carlo.algorethics.ai/api/auth",
    accessToken,
    refreshToken,
  } = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.accessToken = accessToken || null;
    this.refreshToken = refreshToken || null;
  }

  // ------------------ Token management ------------------

  setAccessToken(token) {
    this.accessToken = token;
  }

  setRefreshToken(token) {
    this.refreshToken = token;
  }

  setTokens({ accessToken, refreshToken }) {
    if (accessToken) this.accessToken = accessToken;
    if (refreshToken) this.refreshToken = refreshToken;
  }

  isAuthenticated() {
    return Boolean(this.accessToken);
  }

  // ------------------ Internal helpers ------------------

  _buildUrl(path) {
    return `${this.baseUrl}${path}`;
  }

  async _request(path, { method = "GET", body, headers = {}, auth = false } = {}) {
    const url = this._buildUrl(path);

    const finalHeaders = { ...headers };

    if (auth) {
      if (!this.accessToken) {
        throw new Error("Access token missing — call setAccessToken() first.");
      }
      finalHeaders["Authorization"] = `Bearer ${this.accessToken}`;
    }

    if (body !== undefined && !finalHeaders["Content-Type"]) {
      finalHeaders["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Invalid JSON response (HTTP ${res.status})`);
    }

    if (!res.ok) {
      const msg = data?.message || `HTTP ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      err.response = data;
      throw err;
    }

    return data;
  }

  // -------------------------------------------------------
  // 1) POST /register
  // -------------------------------------------------------

  /**
   * Register a new user.
   *
   * @param {Object} params
   * @param {Object} params.user_info
   * @param {string} params.user_info.first_name
   * @param {string} params.user_info.last_name
   * @param {string} params.user_info.email
   * @param {string} [params.user_info.phone_number]
   * @param {Object} params.account_setup
   * @param {string} params.account_setup.username
   * @param {string} params.account_setup.password
   * @param {string} [params.account_setup.preferred_communication_channel]
   *
   * @returns {Promise<Object>} raw server response
   *
   * Note: You may call setTokens() yourself with returned tokens.
   */
  async register({ user_info, account_setup }) {
    if (!user_info) throw new Error("user_info is required");
    if (!account_setup) throw new Error("account_setup is required");

    const payload = { user_info, account_setup };

    const res = await this._request("/register", {
      method: "POST",
      body: payload,
    });

    // Optional: auto-store tokens
    if (res.accessToken || res.refreshToken) {
      this.setTokens({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
    }

    return res;
  }

  // -------------------------------------------------------
  // 2) POST /login
  // -------------------------------------------------------

  /**
   * Login with username/password.
   *
   * @param {Object} params
   * @param {string} params.username
   * @param {string} params.password
   */
  async login({ username, password }) {
    if (!username) throw new Error("username is required");
    if (!password) throw new Error("password is required");

    const res = await this._request("/login", {
      method: "POST",
      body: { username, password },
    });

    // Auto-store tokens
    if (res.accessToken || res.refreshToken) {
      this.setTokens({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
    }

    return res;
  }

  // -------------------------------------------------------
  // 3) POST /check-auth
  // -------------------------------------------------------

  /**
   * Check credentials without issuing tokens.
   *
   * @param {Object} params
   * @param {string} params.username
   * @param {string} params.password
   */
  async checkAuth({ username, password }) {
    if (!username) throw new Error("username is required");
    if (!password) throw new Error("password is required");

    return this._request("/check-auth", {
      method: "POST",
      body: { username, password },
    });
  }

  // -------------------------------------------------------
  // 4) POST /refresh-token
  // -------------------------------------------------------

  /**
   * Refresh tokens using refreshToken (argument or stored).
   *
   * @param {string} [refreshTokenOverride]
   */
  async refreshTokenCall(refreshTokenOverride) {
    const token = refreshTokenOverride || this.refreshToken;
    if (!token) throw new Error("refreshToken is required");

    const res = await this._request("/refresh-token", {
      method: "POST",
      body: { refreshToken: token },
    });

    // Auto-update tokens
    if (res.accessToken || res.refreshToken) {
      this.setTokens({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
    }

    return res;
  }

  // -------------------------------------------------------
  // 5) POST /complete-profile
  // -------------------------------------------------------

  /**
   * Complete profile after registration.
   *
   * @param {Object} payload
   *  - company_info
   *  - project_details
   *  - subscription_details
   *  - additional_features
   *  - developer_preferences
   */
  async completeProfile(payload) {
    if (!payload || typeof payload !== "object") {
      throw new Error("payload object is required");
    }

    return this._request("/complete-profile", {
      method: "POST",
      body: payload,
      auth: true,
    });
  }

  // -------------------------------------------------------
  // 6) PUT /profile
  // -------------------------------------------------------

  /**
   * Update profile (partial updates allowed).
   *
   * @param {Object} payload
   */
  async updateProfile(payload) {
    if (!payload || typeof payload !== "object") {
      throw new Error("payload object is required");
    }

    return this._request("/profile", {
      method: "PUT",
      body: payload,
      auth: true,
    });
  }

  // -------------------------------------------------------
  // 7) GET /profile
  // -------------------------------------------------------

  /**
   * Get current user's profile.
   */
  async getProfile() {
    return this._request("/profile", {
      method: "GET",
      auth: true,
    });
  }

  // -------------------------------------------------------
  // 8) GET /verify
  // -------------------------------------------------------

  /**
   * Verify current JWT (returns { valid, user, message }).
   */
  async verifyToken() {
    return this._request("/verify", {
      method: "GET",
      auth: true,
    });
  }
}
