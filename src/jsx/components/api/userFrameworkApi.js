// userFrameworkApi.js
// Carlo Rules Engine – User Framework Management & Custom Compliance Rules Client
// Base URL: https://carlo.algorethics.ai/api/user-frameworks
//
// Endpoints covered:
//   GET    /                     -> get user frameworks (optional status filter)
//   POST   /                     -> create user framework
//   GET    /{id}                 -> get framework by ID
//   PUT    /{id}                 -> update framework
//   DELETE /{id}                 -> delete framework
//   POST   /assign               -> assign framework to project

export class UserFrameworkClient {
  /**
   * @param {Object} options
   * @param {string} [options.baseUrl]
   * @param {string} [options.accessToken] - JWT (required for all endpoints)
   */
  constructor({
    baseUrl = "https://carlo.algorethics.ai/api/user-frameworks",
    accessToken,
  } = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.accessToken = accessToken || null;
  }

  /**
   * Set / update JWT token
   */
  setAccessToken(token) {
    this.accessToken = token;
  }

  /**
   * Internal request helper
   */
  async _request(path, { method = "GET", body, query } = {}) {
    if (!this.accessToken) {
      throw new Error("Access token missing — call setAccessToken().");
    }

    // Build URL with query params if any
    let url = `${this.baseUrl}${path}`;
    if (query && Object.keys(query).length > 0) {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
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
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Invalid JSON response (HTTP ${res.status})`);
    }

    if (!res.ok || data?.success === false) {
      const msg = data?.message || `HTTP ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      err.response = data;
      throw err;
    }

    return data;
  }

  // -------------------------------------------------
  // CORE API METHODS
  // -------------------------------------------------

  /**
   * GET /api/user-frameworks
   * Get all user frameworks with optional status filter ("Draft" | "Active" | "Archived").
   *
   * @param {Object} [options]
   * @param {"Draft"|"Active"|"Archived"} [options.status]
   */
  async getFrameworks({ status } = {}) {
    return this._request("/", {
      method: "GET",
      query: status ? { status } : undefined,
    });
  }

  /**
   * POST /api/user-frameworks
   * Create a new user framework.
   *
   * @param {Object} payload
   * @param {string} payload.name
   * @param {string} payload.description
   * @param {string} [payload.version] - default "1.0"
   * @param {string[]} payload.selected_governance_frameworks
   * @param {Array} [payload.custom_rules]
   * @param {boolean} [payload.is_active]
   * @param {"Draft"|"Active"|"Archived"} [payload.status]
   */
  async createFramework(payload) {
    return this._request("/", {
      method: "POST",
      body: payload,
    });
  }

  /**
   * GET /api/user-frameworks/{id}
   * Get a specific user framework by ID.
   *
   * @param {string} id
   */
  async getFramework(id) {
    if (!id) throw new Error("Framework ID is required");
    return this._request(`/${encodeURIComponent(id)}`, {
      method: "GET",
    });
  }

  /**
   * PUT /api/user-frameworks/{id}
   * Update an existing user framework (partial updates supported).
   *
   * @param {string} id
   * @param {Object} payload
   */
  async updateFramework(id, payload) {
    if (!id) throw new Error("Framework ID is required");
    return this._request(`/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: payload,
    });
  }

  /**
   * DELETE /api/user-frameworks/{id}
   * Delete a user framework (permanent).
   *
   * @param {string} id
   */
  async deleteFramework(id) {
    if (!id) throw new Error("Framework ID is required");
    return this._request(`/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  /**
   * POST /api/user-frameworks/assign
   * Assign a user framework to a project.
   *
   * @param {Object} params
   * @param {string} params.project_id
   * @param {string} params.framework_id
   */
  async assignFrameworkToProject({ project_id, framework_id }) {
    if (!project_id) throw new Error("project_id is required");
    if (!framework_id) throw new Error("framework_id is required");

    return this._request("/assign", {
      method: "POST",
      body: { project_id, framework_id },
    });
  }

  // -------------------------------------------------
  // CLIENT-SIDE HELPER METHODS
  // -------------------------------------------------

  /**
   * Get only Active frameworks.
   */
  async getActiveFrameworks() {
    const res = await this.getFrameworks({ status: "Active" });
    return res.data || [];
  }

  /**
   * Get only Draft frameworks.
   */
  async getDraftFrameworks() {
    const res = await this.getFrameworks({ status: "Draft" });
    return res.data || [];
  }

  /**
   * Get only Archived frameworks.
   */
  async getArchivedFrameworks() {
    const res = await this.getFrameworks({ status: "Archived" });
    return res.data || [];
  }

  /**
   * Find a framework by exact name (case-insensitive) among all frameworks.
   */
  async findByName(name) {
    if (!name) return null;
    const res = await this.getFrameworks();
    return (
      (res.data || []).find(
        (f) => (f.name || "").toLowerCase() === name.toLowerCase()
      ) || null
    );
  }

  /**
   * Get all custom rules from all frameworks (flattened).
   */
  async getAllCustomRules() {
    const res = await this.getFrameworks();
    const frameworks = res.data || [];
    const rules = [];
    for (const fw of frameworks) {
      if (Array.isArray(fw.custom_rules)) {
        for (const r of fw.custom_rules) {
          rules.push({ framework_id: fw.id, framework_name: fw.name, ...r });
        }
      }
    }
    return rules;
  }

  /**
   * Filter custom rules by severity ("Low"|"Medium"|"High"|"Critical").
   */
  async getCustomRulesBySeverity(severity) {
    const all = await this.getAllCustomRules();
    return all.filter((r) => r.severity === severity);
  }
}
