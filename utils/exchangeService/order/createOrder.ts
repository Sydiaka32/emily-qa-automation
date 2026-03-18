import {
  generateFutureDate,
  generatePrice,
  generateQuantity,
} from "../../../data/generators";

export function createOrder(
  orderType: "LIMIT" | "MARKET" | "SPOT_OUTRIGHT" | "DYNAMIC_LIMIT",
  constraint: "GTC" | "IOC" | "FOK" | "GFD",
  direction: "ASK" | "BID",
) {
  const baseOrder = {
    constraint,
    left_currency: "SAR",
    right_currency: "BRL",
    quantity: generateQuantity(),
    direction,
    order_type: orderType,
    price: 0,
  };

  switch (orderType) {
    case "LIMIT":
      return { ...baseOrder, price: generatePrice() };

    case "SPOT_OUTRIGHT":
      return { ...baseOrder, expire_at: generateFutureDate() };

    case "MARKET":
    case "DYNAMIC_LIMIT":
    default:
      return baseOrder;
  }
}
