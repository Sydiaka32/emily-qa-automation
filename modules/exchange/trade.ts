import { TradeStatus } from "../../consts/exchange/tradeStatus";
import { OrderDirection } from "../../consts/exchange/orderDirection";

export interface Trade {
  id: number;
  tuid: string;
  symbol: string;
  status: TradeStatus;
  ouid: string;
  price: number;
  quantity: number;
  quote_quantity: number;
  trade_date: string;
  created_at: string;
  is_maker: boolean;
  order_direction: OrderDirection;
}
