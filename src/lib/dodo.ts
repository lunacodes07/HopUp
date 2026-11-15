import DodoPayments from 'dodopayments';

const apiKey = process.env.DODO_PAYMENTS_API_KEY;

// Cloudflare Workers does not always expose NODE_ENV at runtime. Keep local
// development on Dodo's test API, but default deployed runtimes to live mode.
const environment: "test_mode" | "live_mode" = process.env.DODO_PAYMENTS_ENVIRONMENT === "test_mode" ||
  process.env.NODE_ENV === "development"
  ? "test_mode"
  : "live_mode";

if (!apiKey) {
  console.warn("⚠️ DODO_PAYMENTS_API_KEY is not defined in the environment.");
}

export const dodo = new DodoPayments({
  bearerToken: apiKey || "dummy_key",
  environment,
});
