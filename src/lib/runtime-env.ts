/**
 * Cloudflare Workers does not guarantee that NODE_ENV is available at request
 * time. Treat every non-development runtime as production-safe by default.
 */
export const isLocalDevelopment = process.env.NODE_ENV === "development";
export const isProductionRuntime = !isLocalDevelopment;
