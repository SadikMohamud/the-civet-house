export type Role = "customer" | "staff" | "owner";

export interface Profile {
  id: string;
  phone: string | null;
  email: string | null;
  display_name: string | null;
  role: Role;
  card_code: string;
  created_at: string;
}

export interface LoyaltySettings {
  id: string;
  stamps_required: number;
  reward_description: string;
  active: boolean;
  location_id: string | null;
  updated_at: string;
}

export interface CardStatus {
  customer_id: string;
  card_code: string;
  phone: string | null;
  email: string | null;
  display_name: string | null;
  stamps_on_card: number;
  lifetime_stamps: number;
  rewards_redeemed: number;
  last_stamp_at: string | null;
}
