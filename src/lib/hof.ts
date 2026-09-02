export const HOF_CLAIM_BUMP = 10;

export function hallOfFameClaimPrice(price: number) {
  return price + HOF_CLAIM_BUMP;
}
