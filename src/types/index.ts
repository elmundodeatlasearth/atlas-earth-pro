export type UserRole = 'admin' | 'user' | 'trial';
export type UserStatus = 'active' | 'trial' | 'expired' | 'blocked';
export type SubscriptionType = 'monthly' | 'lifetime';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';
export type PaymentProvider = 'paypal' | 'klar';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  language: string;
  status: UserStatus;
  created_at: string;
}

export interface AtlasData {
  id: string;
  user_id: string;
  parcels: number;
  daily_income: number;
  monthly_income: number;
  goal_daily: number;
  goal_date: string | null;
}

export interface CalculationResult {
  daily: number;
  monthly: number;
  yearly: number;
}

export interface UserData {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
  badges: number;
}

// Scenario Comparison Types
export interface Scenario {
  id: string;
  name: string;
  parcels: {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
  };
  badges: number;
  boostHours: number;
}

export interface ScenarioComparisonResult {
  scenario1: Scenario;
  scenario2: Scenario;
  difference: {
    daily: number;
    monthly: number;
    yearly: number;
    percentage: number;
  };
}

// Progress Tracking Types
export interface ProgressSnapshot {
  id: string;
  timestamp: number;
  date: string;
  parcels: {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
  };
  badges: number;
  dailyIncome: number;
  monthlyIncome: number;
  notes?: string;
}

export interface ProgressHistory {
  snapshots: ProgressSnapshot[];
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  name: string;
  achievedDate: string;
  parcels: number;
  badges: number;
}

// Time to Goal Types
export interface TimeToGoalInput {
  currentAmount: number;
  goalAmount: number;
  dailyIncome: number;
}

export interface TimeToGoalResult {
  days: number;
  weeks: number;
  months: number;
  years: number;
  formattedTime: string;
  projectedDate: string;
}

// Data Export/Import Types
export interface ExportData {
  version: string;
  exportDate: string;
  userData: UserData;
  boostHours: number;
  dailyTarget: number;
  progressHistory?: ProgressSnapshot[];
  scenarios?: Scenario[];
}
