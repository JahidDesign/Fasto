// src/hooks/usePricing.js
import { useEffect, useState } from "react";
import { pricingClient } from "../lib/pricingClient";

export function usePricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await pricingClient.getAllPricing(); // <- REAL API CALL
        if (!cancelled) {
          setPlans(res.data || []);
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // derive categories from data
  const categories = Array.from(
    new Set(plans.map((p) => p.product_category).filter(Boolean))
  );

  return { plans, categories, loading, error };
}
