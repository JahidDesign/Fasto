// ProjectDashboard.jsx
// FULL SELF-CONTAINED FILE
// Includes: API client + hook + UI + filtering + cards

import { useEffect, useMemo, useState } from "react";

/* ---------------------------------------------------------
   1. PROJECT API CLIENT (embedded)
--------------------------------------------------------- */

class ProjectClient {
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
    if (body !== undefined) headers["Content-Type"] = "application/json";

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

  getMyProjects() {
    return this._request("/my-projects", { method: "GET" });
  }

  getProject(id) {
    return this._request(`/${id}`, { method: "GET" });
  }

  getComplianceHistory(id) {
    return this.getProject(id).then((p) => p.data?.compliance_requests || []);
  }
}

const projectClient = new ProjectClient(); // singleton

/* ---------------------------------------------------------
   2. HOOK: Load projects
--------------------------------------------------------- */

function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        const res = await projectClient.getMyProjects();
        if (!cancelled) setProjects(res.data || []);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => (cancelled = true);
  }, []);

  return { projects, loading, error };
}

/* ---------------------------------------------------------
   3. UI COMPONENTS (Cards, Stats, Filters)
--------------------------------------------------------- */

const STATUS_OPTIONS = ["All", "Active", "Draft", "Archived"];

export default function ProjectDashboard({ token }) {
  // Set JWT when component mounts
  useEffect(() => {
    if (token) projectClient.setAccessToken(token);
  }, [token]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [aiOnly, setAiOnly] = useState(false);

  const { projects, loading, error } = useProjects();

  const filtered = useMemo(() => {
    return projects
      .filter((p) => {
        if (statusFilter !== "All" && p.status !== statusFilter) return false;
        if (aiOnly && !p.has_ai_ml) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          (p.project_name || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const order = { Active: 0, Draft: 1, Archived: 2 };
        return (order[a.status] ?? 99) - (order[b.status] ?? 99);
      });
  }, [projects, search, statusFilter, aiOnly]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 bg-slate-950">
        Loading projects…
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400 bg-slate-950">
        Error: {error.message}
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-6 space-y-6">
      {/* Page Header */}
      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-semibold">
          Projects & Compliance
        </h1>
        <p className="text-sm text-slate-400">
          Track AI/data projects, compliance risk, and audit history.
        </p>
      </header>

      {/* KPI Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total Projects" value={projects.length} />
        <Stat
          label="Active"
          value={projects.filter((p) => p.status === "Active").length}
        />
        <Stat label="AI / ML" value={projects.filter((p) => p.has_ai_ml).length} />
        <Stat
          label="Draft"
          value={projects.filter((p) => p.status === "Draft").length}
        />
      </section>

      {/* Filters */}
      <section className="rounded-2xl bg-slate-950/70 border border-slate-800 px-4 py-3 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          {/* Search */}
          <div className="flex-1 relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3 py-2 text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500 outline-none"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
              🔍
            </span>
          </div>

          {/* Status buttons */}
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-full text-xs border transition 
                  ${
                    statusFilter === status
                      ? "bg-sky-500 text-white border-sky-500"
                      : "bg-slate-900 text-slate-300 border-slate-700 hover:border-sky-500/70"
                  }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* AI-only toggle */}
          <button
            onClick={() => setAiOnly((v) => !v)}
            className={`md:ml-auto px-3 py-1.5 rounded-full text-xs border flex items-center gap-2 transition
              ${
                aiOnly
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/70"
                  : "bg-slate-900 text-slate-300 border-slate-700 hover:border-emerald-400/70"
              }`}
          >
            AI / ML Only {aiOnly ? "●" : "○"}
          </button>
        </div>
      </section>

      {/* Project Cards */}
      <section className="grid md:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <ProjectCard key={p._id || p.id} project={p} />
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-sm text-slate-400">
            No matching projects.
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------------------------------------------------------
   4. Reusable Components
--------------------------------------------------------- */

function Stat({ label, value }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="text-2xl md:text-3xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function ProjectCard({ project }) {
  const {
    project_name,
    description,
    status,
    has_ai_ml,
    industry,
    region,
    created_at,
    owner_name,
    compliance_score,
    risk_level,
    last_scan_at,
  } = project;

  const statusStyle =
    status === "Active"
      ? "border-emerald-500/70 text-emerald-400"
      : status === "Draft"
      ? "border-amber-500/70 text-amber-400"
      : "border-slate-500/70 text-slate-300";

  return (
    <article className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 hover:border-sky-500/70 transition shadow-md">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold">{project_name}</h2>
          <div className="text-xs text-slate-400">
            {industry || "General"} • {region || "Global"}
          </div>
        </div>

        <span className={`px-2 py-0.5 rounded-full border text-[10px] uppercase ${statusStyle}`}>
          {status}
        </span>
      </header>

      {/* AI tag */}
      {has_ai_ml && (
        <span className="text-[10px] uppercase tracking-wide bg-sky-500/10 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/40 w-fit">
          AI / ML
        </span>
      )}

      {/* Description */}
      <p className="text-sm text-slate-300 line-clamp-3">
        {description || "No project description."}
      </p>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <Metric label="Compliance score">
          {typeof compliance_score === "number" ? `${compliance_score}%` : "—"}
        </Metric>
        <Metric label="Risk">{risk_level || "—"}</Metric>
        <Metric label="Last scan">
          {last_scan_at ? new Date(last_scan_at).toLocaleDateString() : "—"}
        </Metric>
      </div>

      {/* Footer */}
      <footer className="mt-auto text-[11px] text-slate-400 flex justify-between">
        <span>Owner: {owner_name || "You"}</span>
        <span>{created_at ? new Date(created_at).toLocaleDateString() : ""}</span>
      </footer>
    </article>
  );
}

function Metric({ label, children }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
      <div className="text-[10px] uppercase text-slate-500">{label}</div>
      <div className="text-xs text-slate-100">{children}</div>
    </div>
  );
}
