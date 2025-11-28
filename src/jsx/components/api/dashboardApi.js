// dashboardApi.js
// Carlo Rules Engine – AI Compliance Analysis & Dashboard Analytics Client
// Base URL: https://carlo.algorethics.ai/api/dashboard
//
// Endpoints covered:
//   POST /analyze
//   GET  /compliance/{project_id}/verify-chain
//   GET  /compliance/{project_id}
//   GET  /compliance/{project_id}/{request_id}
//   GET  /stats
//   GET  /stats/{project_id}

export class DashboardClient {
  /**
   * @param {Object} options
   * @param {string} [options.baseUrl]
   * @param {string} [options.accessToken] - JWT for user stats (GET /stats)
   * @param {string} [options.defaultApiKey] - optional default project API key for project-level endpoints
   */
  constructor({
    baseUrl = "https://carlo.algorethics.ai/api/dashboard",
    accessToken,
    defaultApiKey,
  } = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.accessToken = accessToken || null;
    this.defaultApiKey = defaultApiKey || null;
  }

  // ------------------ Auth setters ------------------

  setAccessToken(token) {
    this.accessToken = token;
  }

  setDefaultApiKey(apiKey) {
    this.defaultApiKey = apiKey;
  }

  // ------------------ Core request helper ------------------

  /**
   * Generic request helper.
   *
   * options:
   *   method      - HTTP method
   *   body        - JS object (will be JSON.stringified) or null
   *   headers     - additional headers
   *   authType    - "jwt" | "apiKey" | "none"
   *   apiKey      - override API key for x-api-key when authType = "apiKey"
   *   query       - query params object
   */
  async _request(path, {
    method = "GET",
    body,
    headers = {},
    authType = "none",
    apiKey,
    query,
  } = {}) {
    // Build URL with query params
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

    const finalHeaders = { ...headers };

    if (authType === "jwt") {
      if (!this.accessToken) {
        throw new Error("JWT access token missing. Call setAccessToken().");
      }
      finalHeaders["Authorization"] = `Bearer ${this.accessToken}`;
    }

    if (authType === "apiKey") {
      const keyToUse = apiKey || this.defaultApiKey;
      if (!keyToUse) {
        throw new Error("Project API key missing. Pass apiKey or setDefaultApiKey().");
      }
      finalHeaders["x-api-key"] = keyToUse;
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
  // 1) POST /analyze  (uses api_key in body, no header auth)
  // -------------------------------------------------

  /**
   * Analyze AI request/response for compliance.
   *
   * @param {Object} params
   * @param {string} params.request_text
   * @param {string} params.response_text
   * @param {string} params.project_id
   * @param {string} params.api_key          - project API key (required)
   * @param {number} [params.validation_threshold] - 0–1 (optional, default handled server side)
   */
  async analyze({
    request_text,
    response_text,
    project_id,
    api_key,
    validation_threshold,
  }) {
    if (!request_text) throw new Error("request_text is required");
    if (!response_text) throw new Error("response_text is required");
    if (!project_id) throw new Error("project_id is required");
    if (!api_key) throw new Error("api_key is required");

    const body = {
      request_text,
      response_text,
      project_id,
      api_key,
    };

    if (validation_threshold !== undefined) {
      body.validation_threshold = validation_threshold;
    }

    return this._request("/analyze", {
      method: "POST",
      body,
      authType: "none", // API key is in body, not header
    });
  }

  // -------------------------------------------------
  // 2) GET /compliance/{project_id}/verify-chain  (x-api-key)
  // -------------------------------------------------

  /**
   * Verify hash chain for a project.
   *
   * @param {string} projectId
   * @param {string} [apiKey] - project API key (optional if defaultApiKey set)
   */
  async verifyComplianceChain(projectId, apiKey) {
    if (!projectId) throw new Error("projectId is required");

    return this._request(`/compliance/${encodeURIComponent(projectId)}/verify-chain`, {
      method: "GET",
      authType: "apiKey",
      apiKey,
    });
  }

  // -------------------------------------------------
  // 3) GET /compliance/{project_id}  (x-api-key, paginated)
  // -------------------------------------------------

  /**
   * Get paginated compliance history for a project.
   *
   * @param {Object} params
   * @param {string} params.projectId
   * @param {string} [params.apiKey]
   * @param {number} [params.limit=10]
   * @param {number} [params.skip=0]
   */
  async getComplianceHistory({
    projectId,
    apiKey,
    limit = 10,
    skip = 0,
  }) {
    if (!projectId) throw new Error("projectId is required");

    return this._request(`/compliance/${encodeURIComponent(projectId)}`, {
      method: "GET",
      authType: "apiKey",
      apiKey,
      query: { limit, skip },
    });
  }

  // -------------------------------------------------
  // 4) GET /compliance/{project_id}/{request_id}  (x-api-key)
  // -------------------------------------------------

  /**
   * Get detailed compliance entry.
   *
   * @param {Object} params
   * @param {string} params.projectId
   * @param {string} params.requestId
   * @param {string} [params.apiKey]
   */
  async getComplianceDetail({
    projectId,
    requestId,
    apiKey,
  }) {
    if (!projectId) throw new Error("projectId is required");
    if (!requestId) throw new Error("requestId is required");

    return this._request(
      `/compliance/${encodeURIComponent(projectId)}/${encodeURIComponent(requestId)}`,
      {
        method: "GET",
        authType: "apiKey",
        apiKey,
      }
    );
  }

  // -------------------------------------------------
  // 5) GET /stats  (JWT user-level dashboard stats)
  // -------------------------------------------------

  /**
   * Get stats across all projects for authenticated user.
   *
   * Requires JWT (Authorization: Bearer {token})
   */
  async getUserStats() {
    return this._request("/stats", {
      method: "GET",
      authType: "jwt",
    });
  }

  // -------------------------------------------------
  // 6) GET /stats/{project_id}  (x-api-key, project-level)
  // -------------------------------------------------

  /**
   * Get detailed stats for a specific project.
   *
   * @param {Object} params
   * @param {string} params.projectId
   * @param {string} [params.apiKey]
   */
  async getProjectStats({
    projectId,
    apiKey,
  }) {
    if (!projectId) throw new Error("projectId is required");

    return this._request(`/stats/${encodeURIComponent(projectId)}`, {
      method: "GET",
      authType: "apiKey",
      apiKey,
    });
  }

  // -------------------------------------------------
  // Client-side helpers
  // -------------------------------------------------

  /**
   * Convenience: get full compliance history array only.
   */
  async listAllComplianceEntries({ projectId, apiKey, limit = 50, skip = 0 }) {
    const res = await this.getComplianceHistory({ projectId, apiKey, limit, skip });
    return res.data || [];
  }

  /**
   * Verify hash chain client-side using history entries.
   * (Independent of server-side /verify-chain endpoint.)
   *
   * @param {Array} entries - compliance entries with hash_lock & previous_hash
   * @returns {boolean}
   */
  verifyChainLocally(entries) {
    if (!Array.isArray(entries) || entries.length === 0) return true;

    for (let i = 1; i < entries.length; i++) {
      const prev = entries[i - 1];
      const curr = entries[i];
      if (curr.previous_hash !== prev.hash_lock) {
        return false;
      }
    }

    return true;
  }

  /**
   * Helper: compute simple compliance summary from a list of entries.
   *
   * @param {Array} entries
   * @returns {{ total:number, compliant:number, nonCompliant:number, avgScore:number }}
   */
  summarizeCompliance(entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
      return { total: 0, compliant: 0, nonCompliant: 0, avgScore: 0 };
    }

    let total = entries.length;
    let compliant = 0;
    let scoreSum = 0;

    for (const e of entries) {
      if (e.is_compliant) compliant++;
      if (typeof e.compliance_score === "number") {
        scoreSum += e.compliance_score;
      }
    }

    const nonCompliant = total - compliant;
    const avgScore = scoreSum / Math.max(total, 1);

    return { total, compliant, nonCompliant, avgScore };
  }
}
