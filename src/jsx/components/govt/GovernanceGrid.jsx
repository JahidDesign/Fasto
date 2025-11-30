// GovernanceModule.jsx
// One-file GovernanceClient + useFrameworks hook + GovernanceGrid UI

import React, { useState, useEffect } from "react";

//
// ----------------------
// GovernanceClient (API)
// ----------------------
//

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
   *  - q (search query)
   */
  async getFrameworks(filters = {}) {
    return this._request("/", {
      method: "GET",
      query: filters,
    });
  }

  /** Get framework by ID */
  async getFramework(id) {
    if (!id) throw new Error("Framework ID is required");
    return this._request(`/${encodeURIComponent(id)}`, { method: "GET" });
  }

  /** Create new governance framework (ADMIN ONLY) */
  async createFramework(payload) {
    return this._request("/", {
      method: "POST",
      body: payload,
    });
  }

  /** Update framework (ADMIN ONLY) */
  async updateFramework(id, payload) {
    if (!id) throw new Error("Framework ID is required");
    return this._request(`/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: payload,
    });
  }

  /** Delete framework (ADMIN ONLY) */
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

//
// ----------------------
// useFrameworks hook
// ----------------------
//

export function useFrameworks({
  accessToken,
  region,
  category,
  status,
  q,
} = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchFrameworks() {
      if (!accessToken) {
        setError(new Error("Access token missing."));
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const client = new GovernanceClient({ accessToken });
        const res = await client.getFrameworks({
          region,
          category,
          status,
          q,
        });
        if (!cancelled) {
          setData(res.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setData([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchFrameworks();

    return () => {
      cancelled = true;
    };
  }, [accessToken, region, category, status, q]);

  return { data, loading, error };
}

//
// ----------------------
// GovernanceGrid UI
// ----------------------
//

export default function GovernanceGrid({ accessToken }) {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const {
    data: frameworks = [],
    loading,
    error,
  } = useFrameworks({
    accessToken,
    region: region || undefined,
    category: category || undefined,
    status: status || undefined,
    q: search || undefined,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading frameworks…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400">
        Error: {error.message}
      </div>
    );
  }

  const totalPolicies = frameworks.length;
  const categoriesCount = new Set(
    frameworks.flatMap((f) => f.categories || [])
  ).size;
  const regionsCount = new Set(
    frameworks.flatMap((f) => f.applicable_regions || [])
  ).size;
  const industriesCount = new Set(
    frameworks.flatMap((f) => f.industries || [])
  ).size;

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-6 space-y-6">
      {/* Page header */}
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Governance Frameworks
        </h1>
        <p className="text-sm text-slate-400">
          Browse global AI, data, cyber & healthcare regulations.
        </p>
      </header>

      {/* KPI cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total Policies" value={totalPolicies} />
        <Stat label="Categories" value={categoriesCount} />
        <Stat label="Regions" value={regionsCount} />
        <Stat label="Industries" value={industriesCount} />
      </section>

      {/* Search + Filters bar */}
      <section className="flex flex-col gap-3 rounded-2xl bg-slate-950/70 border border-slate-800 px-4 py-3">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          {/* Search */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search policies…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
              🔍
            </span>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 md:justify-end">
            <FilterSelect value={region} onChange={setRegion} label="Region">
              <option value="">All Regions</option>
              <option value="EU">Europe</option>
              <option value="USA">USA</option>
              <option value="APAC">APAC</option>
            </FilterSelect>

            <FilterSelect
              value={category}
              onChange={setCategory}
              label="Category"
            >
              <option value="">All Categories</option>
              <option value="AI Regulation">AI Regulation</option>
              <option value="Data Privacy">Data Privacy</option>
              <option value="Cybersecurity">Cybersecurity</option>
            </FilterSelect>

            <FilterSelect value={status} onChange={setStatus} label="Status">
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Deprecated">Deprecated</option>
            </FilterSelect>
          </div>
        </div>
      </section>

      {/* Framework cards */}
      <section className="grid md:grid-cols-3 gap-4">
        {frameworks.map((fw) => (
          <article
            key={fw.id || fw._id}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-sm hover:border-sky-500/60 hover:shadow-sky-900/40 transition"
          >
            <header className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-[0.16em] text-sky-400">
                  {fw.region_name || fw.region || "Global"}
                </div>
                <h2 className="font-semibold text-sm md:text-base leading-snug">
                  {fw.name}
                </h2>
              </div>
              <span className="text-xs text-slate-400 bg-slate-800 rounded-full px-2 py-0.5">
                {fw.year || fw.effective_date?.slice(0, 4) || "—"}
              </span>
            </header>

            <p className="text-xs md:text-sm text-slate-300 line-clamp-3">
              {fw.description}
            </p>

            <div className="flex flex-wrap gap-2 mt-1">
              {(fw.categories || []).slice(0, 3).map((cat) => (
                <span
                  key={cat}
                  className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-slate-800 text-slate-200"
                >
                  {cat}
                </span>
              ))}
            </div>

            <footer className="mt-auto pt-2 text-[11px] text-slate-400 flex justify-between items-center">
              <span>Authority: {fw.authority || "Unknown"}</span>
              {fw.status && (
                <span
                  className={`px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wide ${
                    fw.status === "Active"
                      ? "border-emerald-500/70 text-emerald-400"
                      : fw.status === "Draft"
                      ? "border-amber-500/70 text-amber-400"
                      : "border-slate-500/70 text-slate-300"
                  }`}
                >
                  {fw.status}
                </span>
              )}
            </footer>
          </article>
        ))}
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3 shadow-sm">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="text-2xl md:text-3xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <label className="inline-flex items-center gap-2 text-xs text-slate-400">
      <span className="hidden md:inline">{label}</span>
      <select
        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </label>
  );
}
