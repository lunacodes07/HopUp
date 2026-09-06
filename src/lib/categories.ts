export const PRODUCT_CATEGORIES = [
  { value: "DevTools", label: "Developer Tools" },
  { value: "AI / Builders", label: "AI / Builders" },
  { value: "AI Agents", label: "AI Agents" },
  { value: "Marketing", label: "Marketing" },
  { value: "SEO", label: "SEO" },
  { value: "Design", label: "Design" },
  { value: "Crypto", label: "Crypto" },
  { value: "Jobs / Career", label: "Jobs / Career" },
  { value: "Games and Entertainment", label: "Games and Entertainment" },
  { value: "Person / Profiles", label: "Person / Profiles" },
  { value: "Health and Fitness", label: "Health and Fitness" },
  { value: "Other", label: "Other" },
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]["value"];
export const DEFAULT_CATEGORY: ProductCategory = PRODUCT_CATEGORIES[0].value;

export const BOARD_FILTERS = ["All", ...PRODUCT_CATEGORIES.map((c) => c.value)] as const;

export function isProductCategory(value: unknown): value is string {
  return typeof value === "string" && PRODUCT_CATEGORIES.some((c) => c.value === value);
}
