// ComplianceDashboard.jsx
// One-file DashboardClient + React UI for Carlo Rules Engine dashboard
//
// Props for main component:
//   <ComplianceDashboard
//      accessToken="JWT_FOR_USER_STATS"
//      projectId="PROJECT_ID"
//      apiKey="PROJECT_API_KEY"
//   />

import React, { useEffect, useState } from "react";

// -------------------------------------
// DashboardClient (your dashboardApi.js)
// -------------------------------------

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

  // -------------------------------------------------
  // 1) POST /analyze  (uses api_key in body, no header auth)
  // -------------------------------------------------

  /**
   * Analyze AI request/response for compliance.
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
   */
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

  // -------------------------------------------------
  // 3) GET /compliance/{project_id}  (x-api-key, paginated)
  // -------------------------------------------------

  /**
   * Get paginated compliance history for a project.
   */
  async getComplianceHistory({ projectId, apiKey, limit = 10, skip = 0 }) {
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
   */
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

  // -------------------------------------------------
  // 5) GET /stats  (JWT user-level dashboard stats)
  // -------------------------------------------------

  /**
   * Get stats across all projects for authenticated user.
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
   */
  async getProjectStats({ projectId, apiKey }) {
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
  async listAllComplianceEntries({
    projectId,
    apiKey,
    limit = 50,
    skip = 0,
  }) {
    const res = await this.getComplianceHistory({
      projectId,
      apiKey,
      limit,
      skip,
    });
    return res.data || [];
  }

  /**
   * Verify hash chain client-side using history entries.
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

// -------------------------------------
// React UI Components
// -------------------------------------

function StatBadge({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 flex flex-col gap-1">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-lg font-semibold text-slate-900">
        {value ?? "—"}
      </span>
      {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
    </div>
  );
}

function ProjectStatsCard({ stats }) {
  const total = stats?.total_requests ?? stats?.total ?? "—";
  const compliant =
    stats?.compliant_requests ?? stats?.compliant ?? stats?.compliant_count;
  const nonCompliant =
    stats?.non_compliant_requests ??
    stats?.nonCompliant ??
    stats?.non_compliant_count;
  const avgScore =
    typeof stats?.avg_compliance_score === "number"
      ? stats.avg_compliance_score
      : typeof stats?.avgScore === "number"
      ? stats.avgScore
      : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-800">
          Project compliance overview
        </h2>
        <span className="rounded-full bg-sky-50 text-sky-700 border border-sky-100 px-3 py-1 text-[11px] font-medium">
          Project-level
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatBadge label="Total analyzed interactions" value={total} />
        <StatBadge
          label="Compliant"
          value={compliant}
          hint={
            total && compliant != null
              ? `${Math.round((compliant / total) * 100)}%`
              : undefined
          }
        />
        <StatBadge
          label="Non-compliant"
          value={nonCompliant}
          hint={
            total && nonCompliant != null
              ? `${Math.round((nonCompliant / total) * 100)}%`
              : undefined
          }
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatBadge
          label="Average compliance score"
          value={avgScore != null ? avgScore.toFixed(2) : "—"}
          hint="Scale depends on project configuration"
        />
        {typeof stats?.last_24h_count === "number" && (
          <StatBadge
            label="Last 24h"
            value={stats.last_24h_count}
            hint="Requests analyzed in the last 24 hours"
          />
        )}
        {typeof stats?.last_7d_count === "number" && (
          <StatBadge
            label="Last 7 days"
            value={stats.last_7d_count}
            hint="Requests analyzed in the last week"
          />
        )}
      </div>
    </div>
  );
}

function UserStatsCard({ stats }) {
  const totalProjects = stats?.total_projects ?? stats?.projects_count ?? "—";
  const totalRequests =
    stats?.total_requests ?? stats?.requests_count ?? stats?.total ?? "—";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-800">
          Account-wide activity
        </h2>
        <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 text-[11px] font-medium">
          User-level
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatBadge
          label="Projects connected"
          value={totalProjects}
          hint="Projects using Carlo Rules Engine"
        />
        <StatBadge
          label="Total requests analyzed"
          value={totalRequests}
          hint="Across all projects"
        />
      </div>
    </div>
  );
}

function ComplianceEntryCard({ entry }) {
  const {
    request_id,
    request_text,
    response_text,
    is_compliant,
    compliance_score,
    created_at,
    violation_reasons,
  } = entry || {};

  const created = created_at
    ? new Date(created_at).toLocaleString()
    : "Unknown time";

  const badgeClass = is_compliant
    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
    : "bg-rose-100 text-rose-800 border border-rose-200";

  const shortRequest =
    request_text && request_text.length > 120
      ? request_text.slice(0, 120) + "…"
      : request_text;

  const shortResponse =
    response_text && response_text.length > 160
      ? response_text.slice(0, 160) + "…"
      : response_text;

  const violationsArray =
    Array.isArray(violation_reasons) && violation_reasons.length
      ? violation_reasons
      : [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-900">
            Compliance check
          </h3>
          <p className="text-[11px] text-slate-500">
            ID:{" "}
            <span className="font-mono bg-slate-50 px-1 py-0.5 rounded">
              {request_id || entry?._id || "N/A"}
            </span>
          </p>
          <p className="text-[11px] text-slate-500">At: {created}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={
              "px-2.5 py-1 rounded-full text-xs font-medium " + badgeClass
            }
          >
            {is_compliant ? "Compliant" : "Non-compliant"}
          </span>
          {typeof compliance_score === "number" && (
            <span className="text-[11px] text-slate-600">
              Score:{" "}
              <span className="font-semibold">
                {compliance_score.toFixed(2)}
              </span>
            </span>
          )}
        </div>
      </div>

      {shortRequest && (
        <div className="text-xs space-y-1">
          <p className="font-semibold text-slate-700">Request</p>
          <p className="text-slate-600 bg-slate-50 rounded-xl px-3 py-2">
            {shortRequest}
          </p>
        </div>
      )}

      {shortResponse && (
        <div className="text-xs space-y-1">
          <p className="font-semibold text-slate-700">Response</p>
          <p className="text-slate-600 bg-slate-50 rounded-xl px-3 py-2">
            {shortResponse}
          </p>
        </div>
      )}

      {violationsArray.length > 0 && (
        <div className="text-xs space-y-1">
          <p className="font-semibold text-rose-700">Violations</p>
          <ul className="list-disc list-inside text-rose-700/90 bg-rose-50 rounded-xl px-3 py-2">
            {violationsArray.map((v, idx) => (
              <li key={idx}>{v}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// -------------------------------------
// Main React Dashboard Component
// -------------------------------------

export function ComplianceDashboard({ accessToken, projectId, apiKey }) {
  const [client] = useState(
    () => new DashboardClient({ accessToken, defaultApiKey: apiKey })
  );

  const [userStats, setUserStats] = useState(null);
  const [projectStats, setProjectStats] = useState(null);
  const [entries, setEntries] = useState([]);
  const [chainValid, setChainValid] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Keep tokens / api key in sync
  useEffect(() => {
    client.setAccessToken(accessToken);
    client.setDefaultApiKey(apiKey);
  }, [accessToken, apiKey, client]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const tasks = [];

        if (accessToken) {
          tasks.push(
            client
              .getUserStats()
              .then((res) => !cancelled && setUserStats(res.data || res))
              .catch((err) => {
                console.warn("Failed to load user stats:", err);
              })
          );
        }

        if (projectId && apiKey) {
          tasks.push(
            client
              .getProjectStats({ projectId, apiKey })
              .then(
                (res) => !cancelled && setProjectStats(res.data || res)
              )
              .catch((err) => {
                console.warn("Failed to load project stats:", err);
              })
          );

          tasks.push(
            client
              .getComplianceHistory({
                projectId,
                apiKey,
                limit: 10,
                skip: 0,
              })
              .then((res) => {
                if (cancelled) return;
                const data = res.data || [];
                setEntries(data);
                setSkip(data.length);
                setHasMore(
                  typeof res.total === "number"
                    ? data.length < res.total
                    : data.length >= 10
                );
              })
              .catch((err) => {
                console.warn("Failed to load compliance history:", err);
              })
          );

          tasks.push(
            client
              .verifyComplianceChain(projectId, apiKey)
              .then((res) => {
                if (cancelled) return;
                const ok =
                  res.valid === true ||
                  res.data?.valid === true ||
                  res.chain_valid === true;
                setChainValid(ok);
              })
              .catch((err) => {
                console.warn("Failed to verify chain:", err);
                if (!cancelled) setChainValid(null);
              })
          );
        }

        await Promise.all(tasks);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError(err.message || "Failed to load dashboard data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, accessToken, projectId, apiKey]);

  async function loadMore() {
    if (!projectId || !apiKey || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const res = await client.getComplianceHistory({
        projectId,
        apiKey,
        limit: 10,
        skip,
      });
      const data = res.data || [];
      setEntries((prev) => [...prev, ...data]);
      setSkip((prev) => prev + data.length);
      setHasMore(
        typeof res.total === "number"
          ? skip + data.length < res.total
          : data.length >= 10
      );
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to load more entries");
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-500">
        Loading compliance dashboard…
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

  const chainBadge =
    chainValid == null
      ? {
          label: "Chain verification unavailable",
          className:
            "bg-slate-100 text-slate-700 border border-slate-200",
        }
      : chainValid
      ? {
          label: "Hash chain valid",
          className:
            "bg-emerald-100 text-emerald-800 border border-emerald-200",
        }
      : {
          label: "Hash chain INVALID",
          className:
            "bg-rose-100 text-rose-800 border border-rose-200",
        };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-slate-900">
            AI Compliance Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Monitor Carlo Rules Engine compliance checks for your AI
            project.
          </p>
        </div>
        {projectId && (
          <div className="flex flex-col items-end gap-1">
            <p className="text-xs text-slate-500">
              Project ID:{" "}
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">
                {projectId}
              </span>
            </p>
            <span
              className={
                "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium " +
                chainBadge.className
              }
            >
              {chainBadge.label}
            </span>
          </div>
        )}
      </header>

      {/* Stats row */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
        <div>
          {projectStats ? (
            <ProjectStatsCard stats={projectStats} />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 sm:p-5 text-sm text-slate-500">
              No project stats available. Make sure you passed{" "}
              <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">
                projectId
              </code>{" "}
              and{" "}
              <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">
                apiKey
              </code>
              , and that the project has activity.
            </div>
          )}
        </div>
        <div>
          {userStats ? (
            <UserStatsCard stats={userStats} />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-4 sm:p-5 text-sm text-slate-500">
              User-level stats not loaded. Provide a valid{" "}
              <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">
                accessToken
              </code>{" "}
              to see account-wide analytics.
            </div>
          )}
        </div>
      </section>

      {/* Compliance history */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-800">
            Recent compliance checks
          </h2>
          <p className="text-xs text-slate-500">
            {entries.length} entr
            {entries.length === 1 ? "y" : "ies"} loaded
          </p>
        </div>

        {(!projectId || !apiKey) && (
          <p className="text-xs text-slate-500">
            Provide both{" "}
            <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">
              projectId
            </code>{" "}
            and{" "}
            <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">
              apiKey
            </code>{" "}
            to view compliance history.
          </p>
        )}

        {projectId && apiKey && entries.length === 0 ? (
          <p className="text-sm text-slate-500">
            No compliance history found yet for this project.
          </p>
        ) : null}

        {projectId && apiKey && entries.length > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {entries.map((entry) => (
                <ComplianceEntryCard
                  key={entry.request_id || entry._id}
                  entry={entry}
                />
              ))}
            </div>

            <div className="flex justify-center mt-3">
              {hasMore ? (
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {loadingMore ? "Loading more…" : "Load more entries"}
                </button>
              ) : (
                <p className="text-[11px] text-slate-500">
                  All entries loaded.
                </p>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
