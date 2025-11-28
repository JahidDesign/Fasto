// subscriptionApi.js
// One-file client & webhook helpers for Carlo Rules Engine Subscription API (LIVE DOMAIN)

// -------------------------
// Client for user-side API
// -------------------------

export class SubscriptionClient {
  /**
   * @param {Object} options
   * @param {string} [options.baseUrl] - Base URL for subscription API
   * @param {string} [options.accessToken] - Bearer token for auth
   */
  constructor({
    baseUrl = "https://carlo.algorethics.ai/api/subscription",
    accessToken,
  } = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, ""); // Trim trailing slash
    this.accessToken = accessToken || null;
  }

  /**
   * Update the access token at runtime.
   */
  setAccessToken(token) {
    this.accessToken = token;
  }

  // Internal helper
  async _request(path, { method = "GET", body } = {}) {
    if (!this.accessToken) {
      throw new Error("Access token not set. Call setAccessToken() or pass in constructor.");
    }

    const headers = {
      "Authorization": `Bearer ${this.accessToken}`,
    };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

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
   * Create Stripe checkout session
   * POST /api/subscription/checkout
   */
  async createCheckout(payload) {
    return this._request("/checkout", {
      method: "POST",
      body: payload,
    });
  }

  /**
   * Update payment method
   * POST /api/subscription/payment-method
   */
  async updatePaymentMethod(payload) {
    return this._request("/payment-method", {
      method: "POST",
      body: payload,
    });
  }

  /**
   * Get all subscriptions
   * GET /api/subscription
   */
  async getSubscriptions() {
    return this._request("/", { method: "GET" });
  }

  /**
   * Get subscription by ID
   * GET /api/subscription/{id}
   */
  async getSubscription(id) {
    if (!id) throw new Error("Subscription ID is required");
    return this._request(`/${encodeURIComponent(id)}`, { method: "GET" });
  }

  /**
   * Cancel subscription
   * DELETE /api/subscription/{id}
   */
  async cancelSubscription(id) {
    if (!id) throw new Error("Subscription ID is required");
    return this._request(`/${encodeURIComponent(id)}`, { method: "DELETE" });
  }
}

// ---------------------------------------------------
// Stripe Webhook Handler Helper (Express backend)
// ---------------------------------------------------

export function createStripeWebhookHandler({ stripeSecretKey, webhookSecret }) {
  const Stripe = require("stripe");
  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

  return async function stripeWebhookHandler(req, res) {
    const sig = req.headers["stripe-signature"];
    if (!sig) {
      return res.status(400).json({
        success: false,
        message: "Missing Stripe signature",
      });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).json({
        success: false,
        message: "Webhook signature verification failed",
      });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed":
          // TODO: Enable subscription, save stripe_subscription_id
          break;
        case "invoice.payment_succeeded":
          // TODO: Add payment history entry
          break;
        case "invoice.payment_failed":
          // TODO: Add failed payment entry, maybe deactivate after retries
          break;
        case "customer.subscription.updated":
          // TODO: Sync subscription status/period
          break;
        case "customer.subscription.deleted":
          // TODO: Mark as canceled
          break;
        default:
          break;
      }

      return res.json({ received: true });
    } catch (err) {
      console.error("Error processing webhook:", err);
      return res.status(500).json({
        success: false,
        message: "Error processing webhook",
        error: err.message,
      });
    }
  };
}
