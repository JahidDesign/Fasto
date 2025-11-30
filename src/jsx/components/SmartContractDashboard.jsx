// SmartContractDashboard.jsx
// Carlo Rules Engine – Smart Contract Security Analysis & Compliance Certification Client
// + React UI in ONE FILE

import React, { useEffect, useState } from "react";

// ===============================
// API CLIENT (your code)
// ===============================

class SmartContractClient {
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
  async _request(
    path,
    { method = "GET", body, headers = {}, requireAuth = true, query } = {}
  ) {
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
        throw new Error(
          "Access token missing — call setAccessToken() or pass in constructor."
        );
      }
      finalHeaders["Authorization"] = `Bearer ${this.accessToken}`;
    }

    // Only set JSON Content-Type if body is plain object (not FormData)
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

  // ----------------------------------------------------
  // CORE ENDPOINTS
  // ----------------------------------------------------

  /**
   * POST /scan
   * Upload & scan a smart contract file
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

  /**
   * Check if a seal is still valid
   */
  isSealActive(sealData) {
    if (!sealData) return false;
    const status = sealData.status || sealData.data?.status;
    if (!status) return false;
    return status === "Scanned" || status === "Active";
  }
}

// ===============================
// REACT UI COMPONENTS
// ===============================

function IssuePill({ label, count }) {
  if (count == null) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
      <span className="font-medium text-[10px] uppercase text-slate-500">
        {label}
      </span>
      <span className="text-xs font-semibold text-slate-800">{count}</span>
    </span>
  );
}

function ScanCard({ scan, onClick }) {
  const {
    contract_name,
    project_id,
    created_at,
    seal_id,
    scan_result = {},
  } = scan || {};

  const {
    is_compliant,
    compliance_tier,
    risk_score,
    issues = {},
  } = scan_result;

  const createdDate = created_at
    ? new Date(created_at).toLocaleString()
    : "Unknown";

  const totalIssues =
    (issues.critical || 0) +
    (issues.high || 0) +
    (issues.medium || 0) +
    (issues.low || 0);

  return (
    <div
      className="group rounded-2xl border border-slate-200 bg-white/80 shadow-sm hover:shadow-md transition-all cursor-pointer p-4 sm:p-5 flex flex-col gap-3"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide">
            Smart Contract
          </h2>
          <p className="text-lg font-semibold text-slate-900">
            {contract_name || "Unnamed Contract"}
          </p>
          <p className="text-xs text-slate-500">
            Project:{" "}
            <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
              {project_id || "N/A"}
            </span>
          </p>
        </div>

        <div
          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            is_compliant
              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
              : "bg-rose-100 text-rose-800 border border-rose-200"
          }`}
        >
          {is_compliant ? "Compliant" : "Non-Compliant"}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
        <div className="flex flex-col">
          <span className="text-xs text-slate-500">Tier</span>
          <span className="text-sm font-semibold text-slate-900">
            {compliance_tier || "—"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-slate-500">Risk score</span>
          <span className="text-sm font-semibold text-slate-900">
            {risk_score ?? "—"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-slate-500">Total issues</span>
          <span className="text-sm font-semibold text-slate-900">
            {Number.isFinite(totalIssues) ? totalIssues : "—"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-slate-500">Seal ID</span>
          <span className="text-xs font-mono text-slate-700 break-all">
            {seal_id || "—"}
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
        <IssuePill label="Critical" count={issues.critical} />
        <IssuePill label="High" count={issues.high} />
        <IssuePill label="Medium" count={issues.medium} />
        <IssuePill label="Low" count={issues.low} />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Scanned: {createdDate}</span>
        <span className="inline-flex items-center gap-1 text-sky-600 group-hover:text-sky-700">
          View details →
        </span>
      </div>
    </div>
  );
}

function SealCard({ sealData, isActive }) {
  const status = sealData?.status || sealData?.data?.status || "Unknown";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 sm:p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide">
            Carlo Compliance Seal
          </h2>
          <p className="text-lg font-semibold text-slate-900">
            {sealData?.data?.contract_name ||
              sealData?.contract_name ||
              "Smart Contract"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Status:{" "}
            <span className="font-semibold text-slate-800">{status}</span>
          </p>
        </div>

        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isActive
              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
              : "bg-slate-100 text-slate-700 border border-slate-200"
          }`}
        >
          {isActive ? "Active seal" : "Inactive seal"}
        </div>
      </div>

      {sealData?.qr_url && (
        <div className="mt-2 flex items-center gap-3">
          <img
            src={sealData.qr_url}
            alt="Seal QR code"
            className="w-20 h-20 rounded-md border border-slate-200 bg-white"
          />
          <p className="text-xs text-slate-500">
            Scan the QR code to view public certificate.
          </p>
        </div>
      )}

      {sealData?.certificate_url && (
        <div className="mt-2">
          <a
            href={sealData.certificate_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700"
          >
            View certificate PDF ↗
          </a>
        </div>
      )}
    </div>
  );
}

// ===============================
// MAIN REACT VIEW
// ===============================

export default function SmartContractDashboard({ accessToken, projectId }) {
  const [scans, setScans] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null);
  const [sealData, setSealData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sealLoading, setSealLoading] = useState(false);
  const [error, setError] = useState(null);

  const [client] = useState(() => new SmartContractClient({ accessToken }));

  useEffect(() => {
    client.setAccessToken(accessToken);
  }, [accessToken, client]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await client.getScans({ projectId });
        if (!cancelled) {
          setScans(res.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError(err.message || "Failed to load scans");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, projectId]);

  async function handleSelectScan(scan) {
    setSelectedScan(scan);
    setSealData(null);

    if (!scan?.seal_id) return;

    try {
      setSealLoading(true);
      const result = await client.getScanResult(scan.seal_id);
      setSealData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setSealLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-500">
        Loading smart contract scans…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-rose-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Smart Contract Scans
          </h1>
          <p className="text-sm text-slate-500">
            {scans.length} scan{scans.length === 1 ? "" : "s"} found
            {projectId ? ` for project ${projectId}` : ""}.
          </p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
        <div className="space-y-3">
          {scans.length === 0 ? (
            <p className="text-sm text-slate-500">
              No scans yet. Upload a smart contract to see results here.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {scans.map((scan) => (
                <ScanCard
                  key={scan._id || scan.seal_id}
                  scan={scan}
                  onClick={() => handleSelectScan(scan)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Seal details
          </h2>
          {!selectedScan ? (
            <p className="text-xs text-slate-500">
              Select a scan card to view seal details.
            </p>
          ) : sealLoading && !sealData ? (
            <p className="text-xs text-slate-500">
              Loading seal details…
            </p>
          ) : sealData ? (
            <SealCard
              sealData={sealData}
              isActive={client.isSealActive(sealData)}
            />
          ) : (
            <p className="text-xs text-slate-500">
              No seal data available for this scan.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
