export type Role = 'admin' | 'owner';

export interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  role: Role;
  created_at: string;
}

export interface Building {
  id: string;
  name: string;
  created_at: string;
}

export interface Property {
  id: string;
  building_id: string;
  name: string;
  status: 'active' | 'archived';
  planned_income: number;
  building?: Building;
}

export interface PropertyShare {
  id: string;
  property_id: string;
  owner_id: string;
  share_percent: number;
  valid_from: string;
  valid_to?: string;
  owner?: Profile;
  property?: Property;
}

export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface Income {
  id: string;
  property_id: string;
  amount: number;
  income_date: string;
  comment?: string;
  is_deleted: boolean;
  property?: Property;
}

export interface Expense {
  id: string;
  property_id?: string;
  building_id?: string;
  category_id: string;
  amount: number;
  expense_date: string;
  comment?: string;
  is_deleted: boolean;
  category?: ExpenseCategory;
  property?: Property;
  building?: Building;
}

export interface DividendCalculation {
  id: string;
  period_year: number;
  period_month: number;
  property_id: string;
  owner_id: string;
  net_profit: number;
  share_percent: number;
  dividend_amount: number;
  is_paid: boolean;
  paid_at?: string;
  property?: Property;
  owner?: Profile;
}
