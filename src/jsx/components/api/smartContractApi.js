// smartContractApi.js
// Carlo Rules Engine – Smart Contract Security Analysis & Compliance Certification Client
// Base URL: https://carlo.algorethics.ai/api/smart-contract
//
// Endpoints:
//   POST /scan                   -> upload & scan contract (auth, multipart/form-data)
//   GET  /result/{seal_id}       -> get detailed scan result (auth)
//   GET  /scans                  -> list scans for user (auth, optional project_id filter)
//   GET  /{seal_id}              -> display seal + QR + certificate (requires seal-key header, no auth)
//   GET  /public/{seal_id}       -> public seal details (no auth)

export class SmartContractClient {
  /**
   * @param {Object} options
   * @param {string} [options.baseUrl]
   * @param {string} [options.accessToken] - JWT for authenticated endpoints
   */
  constructor({
    baseUrl = "https://carlo.algorethics.ai/api/smart-contract",
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
   * - If body is FormData, we don't set Content-Type (browser/Fetch will)
   * - For public endpoints, pass { requireAuth: false }
   * - For special headers (e.g. seal-key), pass headers
   */
  async _request(path, { method = "GET", body, headers = {}, requireAuth = true, query } = {}) {
    // Build URL with query params if any
    let url = `${this.baseUrl}${path}`;
    if (query && Object.keys(query).length > 0) {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value);
        }
      });
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }

    const finalHeaders = { ...headers };

    if (requireAuth) {
      if (!this.accessToken) {
        throw new Error("Access token missing — call setAccessToken() or pass in constructor.");
      }
      finalHeaders["Authorization"] = `Bearer ${this.accessToken}`;
    }

    // Only set JSON Content-Type if body is plain object (not FormData)
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    if (body && !isFormData && !finalHeaders["Content-Type"]) {
      finalHeaders["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
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

  // ----------------------------------------------------
  // CORE ENDPOINTS
  // ----------------------------------------------------

  /**
   * POST /scan
   * Upload & scan a smart contract file
   *
   * @param {Object} options
   * @param {File|Blob} options.contractFile - .sol or .txt (browser) OR any form-data-compatible object
   * @param {string} options.contractName
   * @param {string} options.projectId - MongoDB ObjectId of associated project
   * @param {string} [options.contractDescription]
   *
   * In browser:
   *   contractFile is a File (from <input type="file" />)
   *
   * In Node:
   *   You must pass a FormData-compatible object or polyfill FormData/fetch.
   */
  async scanContract({
    contractFile,
    contractName,
    projectId,
    contractDescription,
  }) {
    if (!contractFile) throw new Error("contractFile is required");
    if (!contractName) throw new Error("contractName is required");
    if (!projectId) throw new Error("projectId is required");

    const form = new FormData();
    form.append("contract_file", contractFile);
    form.append("contract_name", contractName);
    form.append("project_id", projectId);
    if (contractDescription) {
      form.append("contract_description", contractDescription);
    }

    return this._request("/scan", {
      method: "POST",
      body: form,
      requireAuth: true,
    });
  }

  /**
   * GET /result/{seal_id}
   * Get detailed scan result (authenticated)
   *
   * @param {string} sealId
   */
  async getScanResult(sealId) {
    if (!sealId) throw new Error("sealId is required");
    return this._request(`/result/${encodeURIComponent(sealId)}`, {
      method: "GET",
      requireAuth: true,
    });
  }

  /**
   * GET /scans
   * Get all scans for the authenticated user
   *
   * @param {Object} [options]
   * @param {string} [options.projectId] - Optional filter
   */
  async getScans({ projectId } = {}) {
    return this._request("/scans", {
      method: "GET",
      requireAuth: true,
      query: {
        project_id: projectId,
      },
    });
  }

  /**
   * GET /{seal_id}
   * Display seal with QR & certificate (requires seal-key header)
   *
   * No JWT auth in docs – just seal-key in header, so requireAuth = false.
   *
   * @param {string} sealId
   * @param {string} sealKey
   */
  async getSeal(sealId, sealKey) {
    if (!sealId) throw new Error("sealId is required");
    if (!sealKey) throw new Error("sealKey is required");

    return this._request(`/${encodeURIComponent(sealId)}`, {
      method: "GET",
      requireAuth: false,
      headers: {
        "seal-key": sealKey,
      },
    });
  }

  /**
   * GET /public/{seal_id}
   * Get public seal details (no auth)
   *
   * @param {string} sealId
   */
  async getPublicSeal(sealId) {
    if (!sealId) throw new Error("sealId is required");

    return this._request(`/public/${encodeURIComponent(sealId)}`, {
      method: "GET",
      requireAuth: false,
    });
  }

  // ----------------------------------------------------
  // CLIENT-SIDE UTILITIES / HELPERS
  // ----------------------------------------------------

  /**
   * Convenience: get scans for a specific project only
   */
  async getProjectScans(projectId) {
    if (!projectId) throw new Error("projectId is required");
    const res = await this.getScans({ projectId });
    return res.data || [];
  }

  /**
   * Convenience: filter user scans by compliance tier
   *
   * @param {"Basic"|"Standard"|"Premium"|"Pinnacle"} tier
   */
  async getScansByTier(tier) {
    const res = await this.getScans();
    return (res.data || []).filter(
      (s) => s.scan_result?.compliance_tier === tier
    );
  }

  /**
   * Convenience: filter scans that are currently compliant
   */
  async getCompliantScans() {
    const res = await this.getScans();
    return (res.data || []).filter(
      (s) => s.scan_result?.is_compliant === true
    );
  }

  /**
   * Convenience: check if a seal is still valid
   *
   * @param {Object} sealData - data from getScanResult / getSeal / getPublicSeal
   * @returns {boolean}
   */
  isSealActive(sealData) {
    if (!sealData) return false;
    const status = sealData.status || sealData.data?.status;
    if (!status) return false;

    // Treat Scanned/Active as valid (based on docs)
    return status === "Scanned" || status === "Active";
  }
}
