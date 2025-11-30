// PricingPageWithApi.jsx
//
// Self-contained pricing page + API client:
//
// - React component: PricingPage (default export)
// - Hook: usePricing
// - Client: PricingClient
// - Singleton: pricingClient
//
// NOTE: Assumes `fetch` is available (browser / modern runtime).

import React, { useState, useEffect } from "react";

/* ------------------------------------------------------------------
 * pricingApi.js — PricingClient
 * ------------------------------------------------------------------ */

// Client + helpers for Carlo Rules Engine Pricing API (LIVE DOMAIN)
//
// Base URL: https://carlo.algorethics.ai/api/pricing
//
// Endpoints:
//   GET /api/pricing        -> get all pricing
//   GET /api/pricing/{id}   -> get pricing by ID

export class PricingClient {
  /**
   * @param {Object} options
   * @param {string} [options.baseUrl] - Base URL for pricing API
   */
  constructor({ baseUrl = "https://carlo.algorethics.ai/api/pricing" } = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, ""); // trim trailing slash
  }

  // Internal helper
  async _request(path, { method = "GET" } = {}) {
    const res = await fetch(`${this.baseUrl}${path}`, { method });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Failed to parse JSON response (${res.status})`);
    }

    if (!res.ok || data?.success === false) {
      const msg = data?.message || `Request failed with status ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      err.response = data;
      throw err;
    }

    return data;
  }

  /**
   * Get all pricing options
   * GET /api/pricing
   *
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  async getAllPricing() {
    return this._request("/", { method: "GET" });
  }

  /**
   * Get pricing by MongoDB ObjectId
   * GET /api/pricing/{id}
   *
   * @param {string} id - Pricing document ID
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  async getPricingById(id) {
    if (!id) throw new Error("Pricing ID is required");
    return this._request(`/${encodeURIComponent(id)}`, { method: "GET" });
  }

  // ------------------------------------------------------------------
  // Convenience helpers
  // ------------------------------------------------------------------

  /**
   * Get all pricing plans in a specific category
   *
   * @param {"ai_compliance"|"blockchain_compliance"|"web3_hybrid"} category
   * @returns {Promise<Array>}
   */
  async getPricingByCategory(category) {
    const res = await this.getAllPricing();
    return res.data.filter((p) => p.product_category === category);
  }

  /**
   * Get a pricing plan by tier name (e.g. "pro_ai", "starter_ledger")
   *
   * @param {string} tier
   * @returns {Promise<Object|null>}
   */
  async getPricingByTier(tier) {
    const res = await this.getAllPricing();
    return res.data.find((p) => p.tier === tier) || null;
  }

  /**
   * Get all available product categories present in the pricing data
   *
   * @returns {Promise<Array<string>>}
   */
  async getAllCategories() {
    const res = await this.getAllPricing();
    const set = new Set(res.data.map((p) => p.product_category));
    return Array.from(set);
  }

  /**
   * Get a feature comparison table for all plans,
   * optionally filtered by category.
   */
  async getFeatureComparison(category) {
    const res = await this.getAllPricing();
    const items = category
      ? res.data.filter((p) => p.product_category === category)
      : res.data;

    return items.map((p) => ({
      tier: p.tier,
      product_category: p.product_category,
      price: p.price,
      projects_supported: p.projects_supported,
      regions_supported: p.regions_supported,
      dedicated_support: p.dedicated_support,
      real_time_monitoring: p.real_time_monitoring,
      compliance_dashboard: p.compliance_dashboard,
      audit_logs: p.audit_logs,
      custom_policy_rules: p.custom_policy_rules,
      feedback_loops: p.feedback_loops,
      on_premises_deployment: p.on_premises_deployment,
      custom_features: p.custom_features,
      api_calls_limit: p.api_calls_limit,
      scans_limit: p.scans_limit,
      combined_calls_scans_limit: p.combined_calls_scans_limit,
      features: p.features || [],
    }));
  }

  /**
   * Given a pricing item from the API, return its usage limits
   * in a normalized way.
   */
  getUsageLimits(pricing) {
    if (!pricing || !pricing.product_category) {
      return { type: "unknown", limitField: null, limitValue: undefined };
    }

    switch (pricing.product_category) {
      case "ai_compliance":
        return {
          type: "ai",
          limitField: "api_calls_limit",
          limitValue: pricing.api_calls_limit,
        };
      case "blockchain_compliance":
        return {
          type: "blockchain",
          limitField: "scans_limit",
          limitValue: pricing.scans_limit,
        };
      case "web3_hybrid":
        return {
          type: "web3_hybrid",
          limitField: "combined_calls_scans_limit",
          limitValue: pricing.combined_calls_scans_limit,
        };
      default:
        return { type: "unknown", limitField: null, limitValue: undefined };
    }
  }

  /**
   * Check if a pricing tier supports a specific feature name
   * (string must be present in the `features` array).
   */
  supportsFeature(pricing, feature) {
    if (!pricing || !Array.isArray(pricing.features)) return false;
    return pricing.features.includes(feature);
  }
}

// Singleton instance for the page / hooks
export const pricingClient = new PricingClient();

/* ------------------------------------------------------------------
 * usePricing hook (inlined)
 * ------------------------------------------------------------------ */

function usePricing() {
  const [plans, setPlans] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await pricingClient.getAllPricing();
        const data = res.data || [];
        if (cancelled) return;

        setPlans(data);

        const cats = Array.from(
          new Set(
            data
              .map((p) => p.product_category)
              .filter((v) => v && typeof v === "string")
          )
        );
        setCategories(cats);
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { plans, categories, loading, error };
}

/* ------------------------------------------------------------------
 * PricingPage.jsx — main component
 * ------------------------------------------------------------------ */

const CATEGORY_LABELS = {
  ai_compliance: "AI Compliance",
  blockchain_compliance: "Blockchain Compliance",
  web3_hybrid: "Web3 Hybrid",
};

export default function PricingPage() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [featureFilter, setFeatureFilter] = useState(false); // example toggle

  const { plans, categories, loading, error } = usePricing();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Loading pricing…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-red-400">
        Error: {error.message}
      </div>
    );
  }

  let filteredPlans =
    categoryFilter === "all"
      ? plans
      : plans.filter((p) => p.product_category === categoryFilter);

  if (featureFilter) {
    filteredPlans = filteredPlans.filter((p) =>
      pricingClient.supportsFeature(p, "real_time_monitoring")
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Pricing & Plans
        </h1>
        <p className="text-sm text-slate-400">
          Compare Carlo Rules Engine plans across AI, blockchain, and Web3
          compliance.
        </p>
      </header>

      {/* Filters row */}
      <section className="flex flex-wrap gap-3 items-center">
        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          <CategoryPill
            label="All Products"
            active={categoryFilter === "all"}
            onClick={() => setCategoryFilter("all")}
          />
          {categories.map((cat) => (
            <CategoryPill
              key={cat}
              label={CATEGORY_LABELS[cat] || cat}
              active={categoryFilter === cat}
              onClick={() => setCategoryFilter(cat)}
            />
          ))}
        </div>

        {/* Feature toggle */}
        <button
          type="button"
          onClick={() => setFeatureFilter((v) => !v)}
          className={`ml-auto px-3 py-1.5 rounded-full text-xs border transition ${
            featureFilter
              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/70"
              : "bg-slate-900 text-slate-300 border-slate-700 hover:border-emerald-400/70"
          }`}
        >
          {featureFilter ? "Showing" : "Filter:"} Real-time monitoring
        </button>
      </section>

      {/* Cards */}
      <section className="grid md:grid-cols-3 gap-4">
        {filteredPlans.map((plan) => (
          <PricingCard key={plan._id || plan.id || plan.tier} plan={plan} />
        ))}

        {filteredPlans.length === 0 && (
          <div className="col-span-full text-sm text-slate-400">
            No plans match the selected filters.
          </div>
        )}
      </section>
    </div>
  );
}

function CategoryPill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition
        ${
          active
            ? "bg-sky-500 text-white border-sky-500"
            : "bg-slate-900 text-slate-300 border-slate-700 hover:border-sky-500/70 hover:text-sky-100"
        }`}
    >
      {label}
    </button>
  );
}

function PricingCard({ plan }) {
  const usage = pricingClient.getUsageLimits(plan);

  const prettyCategory =
    CATEGORY_LABELS[plan.product_category] || plan.product_category;

  const priceLabel =
    typeof plan.price === "number" ? `$${plan.price}` : plan.price;

  return (
    <article className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:border-sky-500/60 hover:shadow-sky-900/40 transition">
      {/* Header */}
      <header className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            {prettyCategory}
          </div>
          <h2 className="text-lg font-semibold capitalize">
            {plan.tier?.replace(/_/g, " ") || "Plan"}
          </h2>
        </div>
        <div className="text-right">
          <div className="text-xl font-semibold">{priceLabel}</div>
          <div className="text-xs text-slate-400">per month</div>
        </div>
      </header>

      {/* Usage */}
      <div className="text-xs text-slate-300 bg-slate-800/80 rounded-xl px-3 py-2">
        {usage.limitField && usage.limitValue
          ? `Includes up to ${usage.limitValue.toLocaleString()} ${
              usage.limitField === "api_calls_limit"
                ? "API calls"
                : usage.limitField === "scans_limit"
                ? "chain scans"
                : "combined calls & scans"
            }`
          : "Usage limits depend on your workload."}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
        <StatRow label="Projects">
          {plan.projects_supported ?? "Up to team needs"}
        </StatRow>
        <StatRow label="Regions">
          {plan.regions_supported ?? "Global coverage"}
        </StatRow>
        <StatRow label="Dedicated support">
          {plan.dedicated_support ? "Yes" : "Standard"}
        </StatRow>
        <StatRow label="Dashboard">
          {plan.compliance_dashboard ? "Included" : "Limited"}
        </StatRow>
      </div>

      {/* Features */}
      <ul className="mt-1 space-y-1.5 text-xs text-slate-200">
        {(plan.features || []).slice(0, 6).map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="mt-[2px] text-xs">✔</span>
            <span>{feature}</span>
          </li>
        ))}
        {plan.custom_features && (
          <li className="flex items-start gap-2 text-sky-300">
            <span className="mt-[2px] text-xs">★</span>
            <span>{plan.custom_features}</span>
          </li>
        )}
      </ul>

      {/* CTA */}
      <div className="mt-auto pt-3">
        <button className="w-full text-sm font-medium rounded-xl py-2.5 bg-sky-500 hover:bg-sky-400 text-white transition">
          Get started
        </button>
      </div>
    </article>
  );
}

function StatRow({ label, children }) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 px-3 py-2 flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <span className="text-xs text-slate-100">{children}</span>
    </div>
  );
}
