// projectApi.js
// Carlo Rules Engine — Project Management & Compliance Tracking Client
// Base URL: https://carlo.algorethics.ai/api/project

export class ProjectClient {
  /**
   * @param {Object} options
   * @param {string} [options.baseUrl]
   * @param {string} [options.accessToken] - Bearer token
   */
  constructor({
    baseUrl = "https://carlo.algorethics.ai/api/project",
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
  async _request(path, { method = "GET", body } = {}) {
    if (!this.accessToken) {
      throw new Error("Access token missing — call setAccessToken()");
    }

    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
    };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
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
      const err = new Error(msg);
      err.status = res.status;
      err.response = data;
      throw err;
    }

    return data;
  }

  // ---------------------------------------------------------
  // CORE ENDPOINTS
  // ---------------------------------------------------------

  /**
   * GET /template
   * Get default project template
   */
  async getTemplate() {
    return this._request("/template", { method: "GET" });
  }

  /**
   * POST /create
   * Create a new project linked to a subscription
   */
  async createProject(payload) {
    return this._request("/create", {
      method: "POST",
      body: payload,
    });
  }

  /**
   * GET /my-projects
   * Get projects owned by the authenticated user
   */
  async getMyProjects() {
    return this._request("/my-projects", { method: "GET" });
  }

  /**
   * GET /{id}
   * Get project by ID (must belong to authenticated user)
   */
  async getProject(id) {
    if (!id) throw new Error("Project ID is required");
    return this._request(`/${encodeURIComponent(id)}`, { method: "GET" });
  }

  /**
   * PUT /{id}
   * Update project (partial updates allowed)
   */
  async updateProject(id, payload) {
    if (!id) throw new Error("Project ID is required");
    return this._request(`/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: payload,
    });
  }

  /**
   * DELETE /{id}
   * Archive project (soft delete)
   */
  async archiveProject(id) {
    if (!id) throw new Error("Project ID is required");
    return this._request(`/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  /**
   * GET /{id}/api-key
   * Retrieve API key for a project
   */
  async getProjectApiKey(id) {
    if (!id) throw new Error("Project ID is required");
    return this._request(`/${encodeURIComponent(id)}/api-key`, {
      method: "GET",
    });
  }

  // ---------------------------------------------------------
  // CLIENT-SIDE HELPER METHODS
  // ---------------------------------------------------------

  /**
   * Find project by exact name (client-side filter)
   */
  async findByName(name) {
    if (!name) return null;
    const res = await this.getMyProjects();
    return (
      res.data.find(
        (p) => (p.project_name || "").toLowerCase() === name.toLowerCase()
      ) || null
    );
  }

  /**
   * Get only "Active" projects
   */
  async getActiveProjects() {
    const res = await this.getMyProjects();
    return res.data.filter((p) => p.status === "Active");
  }

  /**
   * Get only "Draft" projects
   */
  async getDraftProjects() {
    const res = await this.getMyProjects();
    return res.data.filter((p) => p.status === "Draft");
  }

  /**
   * Get projects using AI/ML
   */
  async getAiProjects() {
    const res = await this.getMyProjects();
    return res.data.filter((p) => p.has_ai_ml === true);
  }

  /**
   * Get compliance history for a project (hash chain)
   */
  async getComplianceHistory(id) {
    const project = await this.getProject(id);
    return project.data?.compliance_requests || [];
  }

  /**
   * Verify the hash chain for compliance entries
   * (client-side verification)
   */
  async verifyHashChain(id) {
    const history = await this.getComplianceHistory(id);
    if (history.length === 0) return true;

    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];

      if (curr.previous_hash !== prev.hash_lock) {
        return false;
      }
    }

    return true;
  }
}
