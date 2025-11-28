// pricingApi.js
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
  // Convenience helpers (client-side versions of the "static methods"
  // mentioned in your docs, built on top of getAllPricing()).
  // ------------------------------------------------------------------

  /**
   * Get all pricing plans in a specific category
   *
   * @param {"ai_compliance"|"blockchain_compliance"|"web3_hybrid"} category
   * @returns {Promise<Array>}
   */
  async getPricingByCategory(category) {
    const res = await this.getAllPricing();
    return res.data.filter(p => p.product_category === category);
  }

  /**
   * Get a pricing plan by tier name (e.g. "pro_ai", "starter_ledger")
   *
   * @param {string} tier
   * @returns {Promise<Object|null>}
   */
  async getPricingByTier(tier) {
    const res = await this.getAllPricing();
    return res.data.find(p => p.tier === tier) || null;
  }

  /**
   * Get all available product categories present in the pricing data
   *
   * @returns {Promise<Array<string>>}
   */
  async getAllCategories() {
    const res = await this.getAllPricing();
    const set = new Set(res.data.map(p => p.product_category));
    return Array.from(set);
  }

  /**
   * Get a feature comparison table for all plans,
   * optionally filtered by category.
   *
   * @param {"ai_compliance"|"blockchain_compliance"|"web3_hybrid"|undefined} category
   * @returns {Promise<Array<Object>>}
   *
   * Each object looks like:
   * {
   *   tier,
   *   product_category,
   *   price,
   *   projects_supported,
   *   regions_supported,
   *   dedicated_support,
   *   real_time_monitoring,
   *   compliance_dashboard,
   *   audit_logs,
   *   custom_policy_rules,
   *   feedback_loops,
   *   on_premises_deployment,
   *   custom_features,
   *   api_calls_limit,
   *   scans_limit,
   *   combined_calls_scans_limit,
   *   features
   * }
   */
  async getFeatureComparison(category) {
    const res = await this.getAllPricing();
    const items = category
      ? res.data.filter(p => p.product_category === category)
      : res.data;

    return items.map(p => ({
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
   *
   * @param {Object} pricing
   * @returns {{ type: "ai"|"blockchain"|"web3_hybrid"|"unknown", limitField: string|null, limitValue: number|undefined }}
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
   *
   * @param {Object} pricing
   * @param {string} feature
   * @returns {boolean}
   */
  supportsFeature(pricing, feature) {
    if (!pricing || !Array.isArray(pricing.features)) return false;
    return pricing.features.includes(feature);
  }
}
