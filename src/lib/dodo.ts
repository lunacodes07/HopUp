import DodoPayments from 'dodopayments';

const apiKey = process.env.DODO_PAYMENTS_API_KEY;

if (!apiKey) {
  console.warn("⚠️ DODO_PAYMENTS_API_KEY is not defined in the environment.");
}

export const dodo = new DodoPayments({
  bearerToken: apiKey || "dummy_key",
  // The SDK automatically maps environment to their API URL, 
  // we just use the default which infers from the token, 
  // or default to 'test_env'.
  environment: process.env.NODE_ENV === "production" ? "live_mode" : "test_mode"
});
