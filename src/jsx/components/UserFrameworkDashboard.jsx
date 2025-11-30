// UserFrameworkDashboard.jsx
// One-file UserFrameworkClient + React UI for managing user frameworks

import React, { useEffect, useMemo, useState } from "react";

// ---------------------------------------
// API CLIENT (your userFrameworkApi.js)
// ---------------------------------------

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

// ---------------------------------------
// React UI components
// ---------------------------------------

const STATUS_COLORS = {
  Draft: "bg-slate-100 text-slate-700 border border-slate-200",
  Active: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  Archived: "bg-amber-100 text-amber-800 border border-amber-200",
};

function FrameworkCard({ framework, onDelete, onAssign, projectId }) {
  const {
    _id,
    id,
    name,
    description,
    version,
    status,
    is_active,
    selected_governance_frameworks,
    custom_rules,
  } = framework || {};

  const effectiveId = _id || id;
  const rulesCount = Array.isArray(custom_rules) ? custom_rules.length : 0;
  const governanceCount = Array.isArray(selected_governance_frameworks)
    ? selected_governance_frameworks.length
    : 0;

  const statusLabel = status || (is_active ? "Active" : "Draft");
  const statusClass =
    STATUS_COLORS[statusLabel] ||
    "bg-slate-100 text-slate-700 border border-slate-200";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide">
            User Framework
          </h2>
          <p className="text-lg font-semibold text-slate-900">
            {name || "Untitled framework"}
          </p>
          <p className="text-xs text-slate-500">
            ID:{" "}
            <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
              {effectiveId || "N/A"}
            </span>
          </p>
          <p className="text-xs text-slate-500">
            Version:{" "}
            <span className="font-medium text-slate-800">
              {version || "1.0"}
            </span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={
              "px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap " +
              statusClass
            }
          >
            {statusLabel}
          </span>
          <span className="text-[11px] text-slate-500">
            {is_active ? "In use" : "Not active"}
          </span>
        </div>
      </div>

      {description && (
        <p className="text-sm text-slate-600 line-clamp-3">{description}</p>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm mt-1">
        <div className="flex flex-col">
          <span className="text-xs text-slate-500">Governance frameworks</span>
          <span className="font-semibold text-slate-900">
            {governanceCount}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-slate-500">Custom rules</span>
          <span className="font-semibold text-slate-900">
            {rulesCount}
          </span>
        </div>
      </div>

      <div className="mt-3 flex justify-between items-center text-xs text-slate-500">
        <span>
          {rulesCount > 0
            ? "Includes custom compliance rules."
            : "No custom rules added yet."}
        </span>
        <div className="flex gap-2">
          {projectId && (
            <button
              onClick={() => onAssign?.(framework)}
              className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-100"
            >
              Assign to project
            </button>
          )}
          <button
            onClick={() => onDelete?.(framework)}
            className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------
// Main dashboard component
// ---------------------------------------

const STATUS_FILTERS = ["All", "Draft", "Active", "Archived"];

export function UserFrameworkDashboard({ accessToken, projectId }) {
  const [client] = useState(() => new UserFrameworkClient({ accessToken }));
  const [frameworks, setFrameworks] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  // Simple create form state
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState("Draft");

  useEffect(() => {
    client.setAccessToken(accessToken);
  }, [accessToken, client]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await client.getFrameworks();
        if (!cancelled) {
          setFrameworks(res.data || []);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(err.message || "Failed to load frameworks");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client]);

  const filteredFrameworks = useMemo(() => {
    if (statusFilter === "All") return frameworks;
    return frameworks.filter((f) => (f.status || "Draft") === statusFilter);
  }, [frameworks, statusFilter]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    try {
      const payload = {
        name: newName.trim(),
        description: newDescription.trim(),
        status: newStatus,
        is_active: newStatus === "Active",
        selected_governance_frameworks: [],
        custom_rules: [],
      };
      const res = await client.createFramework(payload);
      const created = res.data || res.framework || null;
      setFrameworks((prev) =>
        created ? [created, ...prev] : prev
      );
      setNewName("");
      setNewDescription("");
      setNewStatus("Draft");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to create framework");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(framework) {
    const id = framework._id || framework.id;
    if (!id) return;
    if (!window.confirm("Delete this framework permanently?")) return;

    setDeletingId(id);
    try {
      await client.deleteFramework(id);
      setFrameworks((prev) => prev.filter((f) => (f._id || f.id) !== id));
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to delete framework");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAssign(framework) {
    if (!projectId) return;
    const id = framework._id || framework.id;
    if (!id) return;

    setAssigningId(id);
    try {
      await client.assignFrameworkToProject({
        project_id: projectId,
        framework_id: id,
      });
      alert("Framework assigned to project.");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to assign framework");
    } finally {
      setAssigningId(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-500">
        Loading user frameworks…
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
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            User Frameworks
          </h1>
          <p className="text-sm text-slate-500">
            Create and manage custom governance & compliance frameworks.
          </p>
        </div>
      </header>

      {/* Create form */}
      <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">
          New framework
        </h2>
        <form
          onSubmit={handleCreate}
          className="grid gap-3 sm:grid-cols-[2fr_3fr_minmax(0,140px)_minmax(0,120px)]"
        >
          <input
            type="text"
            placeholder="Framework name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
          />
          <input
            type="text"
            placeholder="Short description (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
          />
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
          >
            <option value="Draft">Draft</option>
            <option value="Active">Active</option>
            <option value="Archived">Archived</option>
          </select>
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create framework"}
          </button>
        </form>
      </section>

      {/* Filters */}
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1">
          {STATUS_FILTERS.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setStatusFilter(label)}
              className={
                "rounded-full px-3 py-1 text-xs font-medium " +
                (statusFilter === label
                  ? "bg-white shadow-sm text-slate-900"
                  : "text-slate-600")
              }
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          {filteredFrameworks.length} framework
          {filteredFrameworks.length === 1 ? "" : "s"} shown
          {statusFilter !== "All" ? ` (${statusFilter})` : ""}.
        </p>
      </section>

      {/* Grid */}
      <section>
        {frameworks.length === 0 ? (
          <p className="text-sm text-slate-500">
            No frameworks yet. Create your first custom framework above.
          </p>
        ) : filteredFrameworks.length === 0 ? (
          <p className="text-sm text-slate-500">
            No frameworks match this status filter.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredFrameworks.map((fw) => {
              const id = fw._id || fw.id;
              const isAssigning = assigningId === id;
              const isDeleting = deletingId === id;

              return (
                <div key={id || fw.name}>
                  <FrameworkCard
                    framework={fw}
                    projectId={projectId}
                    onDelete={handleDelete}
                    onAssign={handleAssign}
                  />
                  {(isAssigning || isDeleting) && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      {isAssigning
                        ? "Assigning to project…"
                        : "Deleting framework…"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
