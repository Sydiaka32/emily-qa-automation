import { OrderDirection } from "../../consts/exchange/orderDirection";
import { OrderStatuses } from "../../consts/exchange/orderStatuses";
import { OrderType } from "../../consts/exchange/orderType";
import { OrderConstraint } from "../../consts/exchange/orderConstraint";

export interface OrderResponse {
  ouid: string;
  status: OrderStatuses;
  executed_quantity: number;
  quantity: number;
  type: OrderType;
  direction: OrderDirection;
  constraint: OrderConstraint;
  price?: number;
  expire_at?: string;
}
