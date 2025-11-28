// governanceApi.js
// Fully working client for Carlo Rules Engine Governance API
// Base URL: https://carlo.algorethics.ai/api/governance

export class GovernanceClient {
  /**
   * @param {Object} options
   * @param {string} [options.baseUrl] - API base URL
   * @param {string} [options.accessToken] - JWT token
   */
  constructor({
    baseUrl = "https://carlo.algorethics.ai/api/governance",
    accessToken,
  } = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.accessToken = accessToken || null;
  }

  /**
   * Set or update the JWT token
   */
  setAccessToken(token) {
    this.accessToken = token;
  }

  /**
   * Internal request helper
   */
  async _request(path, { method = "GET", body, query } = {}) {
    if (!this.accessToken) {
      throw new Error("Access token missing. Call setAccessToken().");
    }

    // Build query params
    let url = `${this.baseUrl}${path}`;
    if (query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value);
        }
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }

    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
    };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Invalid JSON response (HTTP ${res.status})`);
    }

    if (!res.ok || data?.success === false) {
      const msg = data?.message || `HTTP ${res.status}`;
      const error = new Error(msg);
      error.status = res.status;
      error.response = data;
      throw error;
    }

    return data;
  }

  // ------------------------------------------------------
  // CORE API METHODS
  // ------------------------------------------------------

  /**
   * Get all governance frameworks with optional filters:
   *  - status ("Active" | "Draft" | "Deprecated")
   *  - category ("AI Ethics", "Data Privacy", ...)
   *  - region ("EU", "USA", etc.)
   */
  async getFrameworks(filters = {}) {
    return this._request("/", {
      method: "GET",
      query: filters,
    });
  }

  /**
   * Get framework by ID
   */
  async getFramework(id) {
    if (!id) throw new Error("Framework ID is required");
    return this._request(`/${encodeURIComponent(id)}`, { method: "GET" });
  }

  /**
   * Create new governance framework (ADMIN ONLY)
   */
  async createFramework(payload) {
    return this._request("/", {
      method: "POST",
      body: payload,
    });
  }

  /**
   * Update framework (ADMIN ONLY)
   */
  async updateFramework(id, payload) {
    if (!id) throw new Error("Framework ID is required");
    return this._request(`/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: payload,
    });
  }

  /**
   * Delete framework (ADMIN ONLY)
   */
  async deleteFramework(id) {
    if (!id) throw new Error("Framework ID is required");
    return this._request(`/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  // ------------------------------------------------------
  // CLIENT-SIDE UTILITY METHODS
  // ------------------------------------------------------

  /** Find framework by exact name */
  async findByName(name) {
    if (!name) return null;
    const res = await this.getFrameworks();
    return (
      res.data.find(
        (item) => item.name?.toLowerCase() === name.toLowerCase()
      ) || null
    );
  }

  /** Get all active frameworks */
  async getActiveFrameworks() {
    const res = await this.getFrameworks({ status: "Active" });
    return res.data;
  }

  /** Filter frameworks by region */
  async getFrameworksByRegion(region) {
    const res = await this.getFrameworks({ region });
    return res.data;
  }

  /** Filter frameworks by category */
  async getFrameworksByCategory(category) {
    const res = await this.getFrameworks({ category });
    return res.data;
  }

  /** Helper: does a framework include this region? */
  appliesToRegion(framework, region) {
    return Array.isArray(framework?.applicable_regions)
      ? framework.applicable_regions.includes(region)
      : false;
  }

  /** Helper: does a framework contain a category? */
  hasCategory(framework, category) {
    return Array.isArray(framework?.categories)
      ? framework.categories.includes(category)
      : false;
  }
}
