// Stripe product/price mapping for STYLE subscriptions
export const STRIPE_PLANS = {
  pro: {
    product_id: "prod_U7isszXMRTPvtS",
    price_id: "price_1T9TQd41D02mRfzYgHHcRiGT",
    name: "Pro",
    price: 9.99,
  },
  business: {
    product_id: "prod_U7itAri4Y7pzMa",
    price_id: "price_1T9TRp41D02mRfzY69BXnDPC",
    name: "Business",
    price: 19.99,
  },
  premium: {
    product_id: "prod_U7iufWlxR8l95q",
    price_id: "price_1T9TSJ41D02mRfzYINsU52RA",
    name: "Premium",
    price: 29.99,
  },
} as const;

export type StripePlanKey = keyof typeof STRIPE_PLANS;

export function getPlanByProductId(productId: string): StripePlanKey | null {
  for (const [key, plan] of Object.entries(STRIPE_PLANS)) {
    if (plan.product_id === productId) return key as StripePlanKey;
  }
  return null;
}

export function getPlanByPriceId(priceId: string): StripePlanKey | null {
  for (const [key, plan] of Object.entries(STRIPE_PLANS)) {
    if (plan.price_id === priceId) return key as StripePlanKey;
  }
  return null;
}
