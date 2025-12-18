
export type RaffleEntry = {
  slot: number;
  buyer_name: string;
  phone: string;
  status: "reserved" | "paid";
  reserved_at: string;
  paid_at: string | null;
};
