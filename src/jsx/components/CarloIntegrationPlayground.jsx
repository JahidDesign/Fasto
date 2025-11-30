// CarloAllInOne.jsx
//
// One-file bundle containing:
//  - AuthClient
//  - GovernanceClient
//  - ProjectClient
//  - SmartContractClient
//  - UserFrameworkClient
//  - DashboardClient
//  - React component: CarloIntegrationPlayground (default export)
//  - Node example (commented at bottom)
//
// NOTE: Demo/dev only. Do NOT hardcode real credentials in production.

import React, { useState } from "react";

/* ------------------------------------------------------------------
 * authApi.js  — AuthClient
 * ------------------------------------------------------------------ */

// Carlo Rules Engine – Authentication & User Management Client
// Base URL: https://carlo.algorethics.ai/api/auth
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

  async _request(
    path,
    { method = "GET", body, headers = {}, auth = false } = {}
  ) {
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

  // 1) POST /register
  async register({ user_info, account_setup }) {
    if (!user_info) throw new Error("user_info is required");
    if (!account_setup) throw new Error("account_setup is required");

    const payload = { user_info, account_setup };

    const res = await this._request("/register", {
      method: "POST",
      body: payload,
    });

    if (res.accessToken || res.refreshToken) {
      this.setTokens({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
    }

    return res;
  }

  // 2) POST /login
  async login({ username, password }) {
    if (!username) throw new Error("username is required");
    if (!password) throw new Error("password is required");

    const res = await this._request("/login", {
      method: "POST",
      body: { username, password },
    });

    if (res.accessToken || res.refreshToken) {
      this.setTokens({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
    }

    return res;
  }

  // 3) POST /check-auth
  async checkAuth({ username, password }) {
    if (!username) throw new Error("username is required");
    if (!password) throw new Error("password is required");

    return this._request("/check-auth", {
      method: "POST",
      body: { username, password },
    });
  }

  // 4) POST /refresh-token
  async refreshTokenCall(refreshTokenOverride) {
    const token = refreshTokenOverride || this.refreshToken;
    if (!token) throw new Error("refreshToken is required");

    const res = await this._request("/refresh-token", {
      method: "POST",
      body: { refreshToken: token },
    });

    if (res.accessToken || res.refreshToken) {
      this.setTokens({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
    }

    return res;
  }

  // 5) POST /complete-profile
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

  // 6) PUT /profile
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

  // 7) GET /profile
  async getProfile() {
    return this._request("/profile", {
      method: "GET",
      auth: true,
    });
  }

  // 8) GET /verify
  async verifyToken() {
    return this._request("/verify", {
      method: "GET",
      auth: true,
    });
  }
}

/* ------------------------------------------------------------------
 * governanceApi.js — GovernanceClient
 * ------------------------------------------------------------------ */

// Fully working client for Carlo Rules Engine Governance API
// Base URL: https://carlo.algorethics.ai/api/governance
export class GovernanceClient {
  constructor({
    baseUrl = "https://carlo.algorethics.ai/api/governance",
    accessToken,
  } = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.accessToken = accessToken || null;
  }

  setAccessToken(token) {
    this.accessToken = token;
  }

  async _request(path, { method = "GET", body, query } = {}) {
    if (!this.accessToken) {
      throw new Error("Access token missing. Call setAccessToken().");
    }

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

  async getFrameworks(filters = {}) {
    return this._request("/", {
      method: "GET",
      query: filters,
    });
  }

  async getFramework(id) {
    if (!id) throw new Error("Framework ID is required");
    return this._request(`/${encodeURIComponent(id)}`, { method: "GET" });
  }

  async createFramework(payload) {
    return this._request("/", {
      method: "POST",
      body: payload,
    });
  }

  async updateFramework(id, payload) {
    if (!id) throw new Error("Framework ID is required");
    return this._request(`/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: payload,
    });
  }

  async deleteFramework(id) {
    if (!id) throw new Error("Framework ID is required");
    return this._request(`/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  async findByName(name) {
    if (!name) return null;
    const res = await this.getFrameworks();
    return (
      res.data.find(
        (item) => item.name?.toLowerCase() === name.toLowerCase()
      ) || null
    );
  }

  async getActiveFrameworks() {
    const res = await this.getFrameworks({ status: "Active" });
    return res.data;
  }

  async getFrameworksByRegion(region) {
    const res = await this.getFrameworks({ region });
    return res.data;
  }

  async getFrameworksByCategory(category) {
    const res = await this.getFrameworks({ category });
    return res.data;
  }

  appliesToRegion(framework, region) {
    return Array.isArray(framework?.applicable_regions)
      ? framework.applicable_regions.includes(region)
      : false;
  }

  hasCategory(framework, category) {
    return Array.isArray(framework?.categories)
      ? framework.categories.includes(category)
      : false;
  }
}

/* ------------------------------------------------------------------
 * projectApi.js — ProjectClient
 * ------------------------------------------------------------------ */

// Base URL: https://carlo.algorethics.ai/api/project
export class ProjectClient {
  constructor({
    baseUrl = "https://carlo.algorethics.ai/api/project",
    accessToken,
  } = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.accessToken = accessToken || null;
  }

  setAccessToken(token) {
    this.accessToken = token;
  }

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

  async getTemplate() {
    return this._request("/template", { method: "GET" });
  }

  async createProject(payload) {
    return this._request("/create", {
      method: "POST",
      body: payload,
    });
  }

  async getMyProjects() {
    return this._request("/my-projects", { method: "GET" });
  }

  async getProject(id) {
    if (!id) throw new Error("Project ID is required");
    return this._request(`/${encodeURIComponent(id)}`, { method: "GET" });
  }

  async updateProject(id, payload) {
    if (!id) throw new Error("Project ID is required");
    return this._request(`/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: payload,
    });
  }

  async archiveProject(id) {
    if (!id) throw new Error("Project ID is required");
    return this._request(`/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  async getProjectApiKey(id) {
    if (!id) throw new Error("Project ID is required");
    return this._request(`/${encodeURIComponent(id)}/api-key`, {
      method: "GET",
    });
  }

  async findByName(name) {
    if (!name) return null;
    const res = await this.getMyProjects();
    return (
      res.data.find(
        (p) => (p.project_name || "").toLowerCase() === name.toLowerCase()
      ) || null
    );
  }

  async getActiveProjects() {
    const res = await this.getMyProjects();
    return res.data.filter((p) => p.status === "Active");
  }

  async getDraftProjects() {
    const res = await this.getMyProjects();
    return res.data.filter((p) => p.status === "Draft");
  }

  async getAiProjects() {
    const res = await this.getMyProjects();
    return res.data.filter((p) => p.has_ai_ml === true);
  }

  async getComplianceHistory(id) {
    const project = await this.getProject(id);
    return project.data?.compliance_requests || [];
  }

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

/* ------------------------------------------------------------------
 * smartContractApi.js — SmartContractClient
 * ------------------------------------------------------------------ */

// Base URL: https://carlo.algorethics.ai/api/smart-contract
export class SmartContractClient {
  constructor({
    baseUrl = "https://carlo.algorethics.ai/api/smart-contract",
    accessToken,
  } = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.accessToken = accessToken || null;
  }

  setAccessToken(token) {
    this.accessToken = token;
  }

  async _request(
    path,
    { method = "GET", body, headers = {}, requireAuth = true, query } = {}
  ) {
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
        throw new Error(
          "Access token missing — call setAccessToken() or pass in constructor."
        );
      }
      finalHeaders["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const isFormData =
      typeof FormData !== "undefined" && body instanceof FormData;
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

  async getScanResult(sealId) {
    if (!sealId) throw new Error("sealId is required");
    return this._request(`/result/${encodeURIComponent(sealId)}`, {
      method: "GET",
      requireAuth: true,
    });
  }

  async getScans({ projectId } = {}) {
    return this._request("/scans", {
      method: "GET",
      requireAuth: true,
      query: { project_id: projectId },
    });
  }

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

  async getPublicSeal(sealId) {
    if (!sealId) throw new Error("sealId is required");

    return this._request(`/public/${encodeURIComponent(sealId)}`, {
      method: "GET",
      requireAuth: false,
    });
  }

  async getProjectScans(projectId) {
    if (!projectId) throw new Error("projectId is required");
    const res = await this.getScans({ projectId });
    return res.data || [];
  }

  async getScansByTier(tier) {
    const res = await this.getScans();
    return (res.data || []).filter(
      (s) => s.scan_result?.compliance_tier === tier
    );
  }

  async getCompliantScans() {
    const res = await this.getScans();
    return (res.data || []).filter(
      (s) => s.scan_result?.is_compliant === true
    );
  }

  isSealActive(sealData) {
    if (!sealData) return false;
    const status = sealData.status || sealData.data?.status;
    if (!status) return false;
    return status === "Scanned" || status === "Active";
  }
}

/* ------------------------------------------------------------------
 * userFrameworkApi.js — UserFrameworkClient
 * ------------------------------------------------------------------ */

// Base URL: https://carlo.algorethics.ai/api/user-frameworks
export class UserFrameworkClient {
  constructor({
    baseUrl = "https://carlo.algorethics.ai/api/user-frameworks",
    accessToken,
  } = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.accessToken = accessToken || null;
  }

  setAccessToken(token) {
    this.accessToken = token;
  }

  async _request(path, { method = "GET", body, query } = {}) {
    if (!this.accessToken) {
      throw new Error("Access token missing — call setAccessToken().");
    }

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

  async getFrameworks({ status } = {}) {
    return this._request("/", {
      method: "GET",
      query: status ? { status } : undefined,
    });
  }

  async createFramework(payload) {
    return this._request("/", {
      method: "POST",
      body: payload,
    });
  }

  async getFramework(id) {
    if (!id) throw new Error("Framework ID is required");
    return this._request(`/${encodeURIComponent(id)}`, {
      method: "GET",
    });
  }

  async updateFramework(id, payload) {
    if (!id) throw new Error("Framework ID is required");
    return this._request(`/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: payload,
    });
  }

  async deleteFramework(id) {
    if (!id) throw new Error("Framework ID is required");
    return this._request(`/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  async assignFrameworkToProject({ project_id, framework_id }) {
    if (!project_id) throw new Error("project_id is required");
    if (!framework_id) throw new Error("framework_id is required");

    return this._request("/assign", {
      method: "POST",
      body: { project_id, framework_id },
    });
  }

  async getActiveFrameworks() {
    const res = await this.getFrameworks({ status: "Active" });
    return res.data || [];
  }

  async getDraftFrameworks() {
    const res = await this.getFrameworks({ status: "Draft" });
    return res.data || [];
  }

  async getArchivedFrameworks() {
    const res = await this.getFrameworks({ status: "Archived" });
    return res.data || [];
  }

  async findByName(name) {
    if (!name) return null;
    const res = await this.getFrameworks();
    return (
      (res.data || []).find(
        (f) => (f.name || "").toLowerCase() === name.toLowerCase()
      ) || null
    );
  }

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

  async getCustomRulesBySeverity(severity) {
    const all = await this.getAllCustomRules();
    return all.filter((r) => r.severity === severity);
  }
}

/* ------------------------------------------------------------------
 * dashboardApi.js — DashboardClient
 * ------------------------------------------------------------------ */

// Base URL: https://carlo.algorethics.ai/api/dashboard
export class DashboardClient {
  constructor({
    baseUrl = "https://carlo.algorethics.ai/api/dashboard",
    accessToken,
    defaultApiKey,
  } = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.accessToken = accessToken || null;
    this.defaultApiKey = defaultApiKey || null;
  }

  setAccessToken(token) {
    this.accessToken = token;
  }

  setDefaultApiKey(apiKey) {
    this.defaultApiKey = apiKey;
  }

  async _request(
    path,
    {
      method = "GET",
      body,
      headers = {},
      authType = "none",
      apiKey,
      query,
    } = {}
  ) {
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
        throw new Error(
          "Project API key missing. Pass apiKey or setDefaultApiKey()."
        );
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
      authType: "none",
    });
  }

  async verifyComplianceChain(projectId, apiKey) {
    if (!projectId) throw new Error("projectId is required");

    return this._request(
      `/compliance/${encodeURIComponent(projectId)}/verify-chain`,
      {
        method: "GET",
        authType: "apiKey",
        apiKey,
      }
    );
  }

  async getComplianceHistory({ projectId, apiKey, limit = 10, skip = 0 }) {
    if (!projectId) throw new Error("projectId is required");

    return this._request(`/compliance/${encodeURIComponent(projectId)}`, {
      method: "GET",
      authType: "apiKey",
      apiKey,
      query: { limit, skip },
    });
  }

  async getComplianceDetail({ projectId, requestId, apiKey }) {
    if (!projectId) throw new Error("projectId is required");
    if (!requestId) throw new Error("requestId is required");

    return this._request(
      `/compliance/${encodeURIComponent(projectId)}/${encodeURIComponent(
        requestId
      )}`,
      {
        method: "GET",
        authType: "apiKey",
        apiKey,
      }
    );
  }

  async getUserStats() {
    return this._request("/stats", {
      method: "GET",
      authType: "jwt",
    });
  }

  async getProjectStats({ projectId, apiKey }) {
    if (!projectId) throw new Error("projectId is required");

    return this._request(`/stats/${encodeURIComponent(projectId)}`, {
      method: "GET",
      authType: "apiKey",
      apiKey,
    });
  }

  async listAllComplianceEntries({ projectId, apiKey, limit = 50, skip = 0 }) {
    const res = await this.getComplianceHistory({
      projectId,
      apiKey,
      limit,
      skip,
    });
    return res.data || [];
  }

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

/* ------------------------------------------------------------------
 * React UI: CarloIntegrationPlayground
 * ------------------------------------------------------------------ */

export default function CarloIntegrationPlayground() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);
  const [error, setError] = useState(null);

  function log(line) {
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${line}`,
    ]);
  }

  async function runFlow() {
    setRunning(true);
    setError(null);
    setLogs([]);
    setResultSummary(null);

    try {
      // 1) AUTH
      log("Logging in…");
      const auth = new AuthClient();
      const loginRes = await auth.login({ username, password });
      log(`Logged in as ${loginRes.username || "unknown user"}`);

      const accessToken = auth.accessToken;

      // 2) Init clients
      const governance = new GovernanceClient({ accessToken });
      const project = new ProjectClient({ accessToken });
      const userFramework = new UserFrameworkClient({ accessToken });
      const dashboard = new DashboardClient({ accessToken });
      const smartContract = new SmartContractClient({ accessToken }); // not used in this flow but ready

      // 3) Governance frameworks
      log("Fetching governance frameworks…");
      const govRes = await governance.getFrameworks();
      const govCount = govRes.count ?? (govRes.data?.length || 0);
      log(`Found ${govCount} governance frameworks.`);
      const firstGov = govRes.data?.[0];
      if (!firstGov) {
        log(
          "Warning: No governance frameworks found. Demo will use a fallback id."
        );
      }

      // 4) Project template + create project
      if (!subscriptionId) {
        throw new Error(
          "You must provide a subscription ID to create a project."
        );
      }

      log("Fetching project template…");
      const templateRes = await project.getTemplate();
      const template = templateRes.data || {};

      log("Creating project…");
      const createProjectRes = await project.createProject({
        subscription_id: subscriptionId,
        project_name: "My Carlo Demo Project (Playground)",
        project_description:
          "Demo project created via React integration playground.",
        industry_domain: template.industry_domain || "AI & Machine Learning",
        technology_stack: {
          backend: ["Node.js"],
          frontend: ["Next.js"],
          database: ["MongoDB"],
          ai_models: ["OpenAI GPT"],
          apis: ["Carlo Rules Engine"],
        },
        programming_languages: ["JavaScript", "TypeScript"],
        infrastructure: {
          deployment_type: template.infrastructure?.deployment_type || "Cloud",
          cloud_provider: ["AWS"],
          containerization: ["Docker"],
        },
        apis_integrations: ["Carlo Rules Engine"],
        data_sources: {
          structure_type: ["Structured"],
          access_type: ["Private"],
          processing_type: ["Real-time"],
        },
        data_storage_location:
          template.data_storage_location || "Cloud-based",
        data_sensitivity:
          template.data_sensitivity || ["Non-sensitive Data"],
        data_encryption: {
          enabled: template.data_encryption?.enabled ?? true,
          type: "AES-256",
        },
        access_control: ["RBAC"],
        audit_logging: template.audit_logging ?? true,
        user_consent_mechanism:
          template.user_consent_mechanism ?? true,
        compliance_standards: ["EU AI Act", "GDPR"],
        bias_risk_factors: {
          identified: template.bias_risk_factors?.identified ?? false,
        },
        fairness_transparency_practices:
          template.fairness_transparency_practices ?? true,
        has_ai_ml: true,
        ai_model_type: ["Supervised"],
        training_data_source: ["Internal"],
        model_monitoring: true,
        bias_detection: true,
        automated_decision_making: false,
        webhooks_notifications:
          template.webhooks_notifications ?? false,
        custom_rules: template.custom_rules ?? false,
        third_party_plugins:
          template.third_party_plugins ?? false,
        compliance_consultation:
          template.compliance_consultation ?? false,
        status: "Active",
      });

      const createdProject = createProjectRes.data;
      const projectId = createdProject.id;
      log(`Created project: ${projectId}`);

      // 5) Project API key
      log("Fetching project API key…");
      const apiKeyRes = await project.getProjectApiKey(projectId);
      const projectApiKey = apiKeyRes.data.api_key;
      log(`Project API key obtained (hidden).`);

      // 6) Create & assign user framework
      log("Creating custom user framework…");

      const govIds =
        govRes.data
          ?.slice(0, 2)
          .map((g) => g.id || g._id)
          .filter(Boolean) || [];

      const createdFrameworkRes = await userFramework.createFramework({
        name: "Demo Corporate AI Ethics Framework",
        description:
          "Demo framework combining official governance with internal AI policies.",
        version: "1.0",
        selected_governance_frameworks:
          govIds.length > 0 ? govIds : ["64a7f8d2c8e9b12345678901"], // fallback example
        custom_rules: [
          {
            rule_name: "Bias Testing Required",
            rule_description:
              "All AI models must undergo bias testing before deployment.",
            keywords: ["bias", "fairness", "testing"],
            severity: "Critical",
            compliance_category: "AI Ethics",
          },
        ],
        is_active: true,
        status: "Active",
      });

      const frameworkId = createdFrameworkRes.data.id;
      log(`Created user framework: ${frameworkId}`);

      log("Assigning framework to project…");
      await userFramework.assignFrameworkToProject({
        project_id: projectId,
        framework_id: frameworkId,
      });
      log("Framework assigned to project.");

      // 7) Run dashboard analyze
      log("Running AI compliance analysis for a sample prompt…");
      const dashboardAnalysisRes = await dashboard.analyze({
        request_text: "Can you help me write a recommendation letter?",
        response_text:
          "I'd be happy to help you write a recommendation letter. Please provide some details about the person...",
        project_id: projectId,
        api_key: projectApiKey,
        validation_threshold: 0.8,
      });

      log("Compliance analysis completed.");

      // 8) Project stats + hash chain verify
      log("Fetching project stats…");
      const projectStats = await dashboard.getProjectStats({
        projectId,
        apiKey: projectApiKey,
      });

      log("Verifying compliance hash chain on server…");
      const chainVerify = await dashboard.verifyComplianceChain(
        projectId,
        projectApiKey
      );

      log("Hash chain verification result received.");

      setResultSummary({
        projectId,
        frameworkId,
        analysis: {
          score: dashboardAnalysisRes.compliance_score,
          is_compliant: dashboardAnalysisRes.is_compliant,
          issues: dashboardAnalysisRes.compliance_issues,
          recommendations: dashboardAnalysisRes.recommendations,
        },
        projectStats: {
          total_requests:
            projectStats.data.total_compliance_requests ??
            projectStats.data.total_requests,
          avg_score:
            projectStats.data.average_compliance_score ??
            projectStats.data.avg_compliance_score,
          compliant_pct:
            projectStats.data.compliant_requests_percentage ??
            projectStats.data.compliant_pct,
          risk_score: projectStats.data.risk_score,
        },
        chain_verified:
          chainVerify.chain_verified ??
          chainVerify.chain_valid ??
          chainVerify.valid,
      });

      log("Integration flow completed.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Integration flow failed");
      log(`Error: ${err.message || String(err)}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">
          Carlo Rules Engine – Integration Playground
        </h1>
        <p className="text-sm text-slate-500">
          Runs (roughly) the same steps as{" "}
          <code>carloIntegrationExample.js</code> but from a React UI. Use ONLY
          in a secure dev environment.
        </p>
      </header>

      {/* Credentials & subscription form */}
      <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">
          1. Credentials & subscription
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            type="text"
            placeholder="Carlo username / email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
          />
          <input
            type="password"
            placeholder="Carlo password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
          />
          <input
            type="text"
            placeholder="Existing subscription ID"
            value={subscriptionId}
            onChange={(e) => setSubscriptionId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">
            Warning: This will create a real project + framework in your Carlo
            account. Use test data.
          </p>
          <button
            type="button"
            disabled={
              running ||
              !username.trim() ||
              !password.trim() ||
              !subscriptionId.trim()
            }
            onClick={runFlow}
            className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {running ? "Running integration…" : "Run integration flow"}
          </button>
        </div>
      </section>

      {/* Result summary */}
      {resultSummary && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5 space-y-2">
          <h2 className="text-sm font-semibold text-emerald-800">
            Integration summary
          </h2>
          <p className="text-xs text-emerald-900">
            Project ID:{" "}
            <span className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded">
              {resultSummary.projectId}
            </span>
          </p>
          <p className="text-xs text-emerald-900">
            Framework ID:{" "}
            <span className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded">
              {resultSummary.frameworkId}
            </span>
          </p>
          <div className="grid gap-3 sm:grid-cols-3 text-xs mt-1">
            <div>
              <p className="font-semibold text-emerald-900">
                Compliance analysis
              </p>
              <p>Score: {resultSummary.analysis.score}</p>
              <p>
                Status:{" "}
                {resultSummary.analysis.is_compliant
                  ? "Compliant"
                  : "Non-compliant"}
              </p>
            </div>
            <div>
              <p className="font-semibold text-emerald-900">Project stats</p>
              <p>Total requests: {resultSummary.projectStats.total_requests}</p>
              <p>Avg score: {resultSummary.projectStats.avg_score}</p>
              <p>
                Compliant %:{" "}
                {resultSummary.projectStats.compliant_pct ?? "N/A"}
              </p>
            </div>
            <div>
              <p className="font-semibold text-emerald-900">Hash chain</p>
              <p>
                Chain verified:{" "}
                {String(resultSummary.chain_verified ?? "unknown")}
              </p>
              <p>Risk score: {resultSummary.projectStats.risk_score}</p>
            </div>
          </div>
        </section>
      )}

      {/* Error */}
      {error && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-800">
          Error: {error}
        </section>
      )}

      {/* Log output */}
      <section className="rounded-2xl border border-slate-200 bg-black text-[11px] text-slate-100 p-3 font-mono h-56 overflow-auto">
        {logs.length === 0 ? (
          <span className="text-slate-500">
            Logs will appear here when you run the integration.
          </span>
        ) : (
          logs.map((line, idx) => <div key={idx}>{line}</div>)
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------
 * OPTIONAL: Node carloIntegrationExample.js (reference only)
 * (Commented out so this file still works as a React module.)
 * ------------------------------------------------------------------

import {
  AuthClient,
  GovernanceClient,
  ProjectClient,
  SmartContractClient,
  DashboardClient,
  UserFrameworkClient,
} from "./CarloAllInOne.js";

async function main() {
  // Same logic as your original carloIntegrationExample.js
  // (copy from earlier version if you want to actually run it in Node)
}

if (import.meta &&
    import.meta.url &&
    process?.argv[1] === new URL(import.meta.url).pathname) {
  main().catch((err) => {
    console.error("Error in integration example:", err);
    process.exit(1);
  });
}

*/

