// SubscriptionDashboard.jsx
// One-file Subscription API client + React UI + Stripe webhook helper

import React, { useEffect, useState } from "react";

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
      throw new Error(
        "Access token not set. Call setAccessToken() or pass in constructor."
      );
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

// -------------------------
// React UI components
// -------------------------

function SubscriptionCard({ sub, onCancel, cancelling }) {
  const {
    _id,
    plan_name,
    status,
    current_period_start,
    current_period_end,
    stripe_subscription_id,
    price,
    currency,
    interval,
  } = sub || {};

  const start = current_period_start
    ? new Date(current_period_start).toLocaleDateString()
    : "—";
  const end = current_period_end
    ? new Date(current_period_end).toLocaleDateString()
    : "—";

  const isActive = status === "active" || status === "trialing";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide">
            Subscription
          </h2>
          <p className="text-lg font-semibold text-slate-900">
            {plan_name || "Unknown plan"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            ID:{" "}
            <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
              {_id || "N/A"}
            </span>
          </p>
          {stripe_subscription_id && (
            <p className="text-[11px] text-slate-500 mt-0.5">
              Stripe:{" "}
              <span className="font-mono bg-slate-50 px-1 py-0.5 rounded">
                {stripe_subscription_id}
              </span>
            </p>
          )}
        </div>

        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            isActive
              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
              : "bg-slate-100 text-slate-700 border border-slate-200"
          }`}
        >
          {status || "unknown"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
        <div className="flex flex-col">
          <span className="text-xs text-slate-500">Price</span>
          <span className="font-semibold text-slate-900">
            {price != null
              ? `${price} ${currency || "USD"}/${interval || "month"}`
              : "—"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-slate-500">Current period</span>
          <span className="font-semibold text-slate-900">
            {start} → {end}
          </span>
        </div>
      </div>

      <div className="mt-3 flex justify-between items-center text-xs text-slate-500">
        <span>
          {isActive
            ? "Your subscription will stay active until the end of the current period."
            : "This subscription is not active."}
        </span>
        {isActive && (
          <button
            onClick={() => onCancel?.(sub)}
            disabled={cancelling}
            className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
          >
            {cancelling ? "Cancelling…" : "Cancel"}
          </button>
        )}
      </div>
    </div>
  );
}

export function SubscriptionsDashboard({ accessToken }) {
  const [client] = useState(() => new SubscriptionClient({ accessToken }));
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    client.setAccessToken(accessToken);
  }, [accessToken, client]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await client.getSubscriptions();
        if (!cancelled) {
          setSubs(res.data || []);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(err.message || "Failed to load subscriptions");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client]);

  async function handleCancel(sub) {
    if (!sub?._id) return;
    setCancelId(sub._id);
    try {
      await client.cancelSubscription(sub._id);
      // Optimistically remove or update status
      setSubs((prev) =>
        prev.map((s) =>
          s._id === sub._id ? { ...s, status: "canceled" } : s
        )
      );
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to cancel subscription");
    } finally {
      setCancelId(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-500">
        Loading subscriptions…
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
    <div className="p-6 space-y-5">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Subscriptions
          </h1>
          <p className="text-sm text-slate-500">
            {subs.length} subscription{subs.length === 1 ? "" : "s"} found.
          </p>
        </div>
      </header>

      {subs.length === 0 ? (
        <p className="text-sm text-slate-500">
          You don&apos;t have any subscriptions yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subs.map((sub) => (
            <SubscriptionCard
              key={sub._id}
              sub={sub}
              onCancel={handleCancel}
              cancelling={cancelId === sub._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Default export so `import SubscriptionDashboard from ...` works
export default SubscriptionsDashboard;

// ---------------------------------------------------
// Stripe Webhook Handler Helper (Express backend)
// (Backend-only: don’t call this from the browser)
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
