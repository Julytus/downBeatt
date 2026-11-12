export type DashboardGroupBy = "DAY" | "MONTH";

export interface DashboardTotalsDTO {
  from?: string;
  to?: string;
  revenue: number;
  paidOrders: number;
  newCustomers: number;
  downloads: number;
  premiumDownloads: number;
  premiumRatio: number;
}

export interface DashboardPointDTO {
  period: string;
  revenue: number;
  paidOrders: number;
  newCustomers: number;
  downloads: number;
}

export interface PlanRevenueDTO {
  planCode: string;
  planName: string;
  revenue: number;
  paidOrders: number;
}

export interface PlanCustomersDTO {
  planCode: string;
  planName: string;
  customers: number;
}

export interface ActivePlansDTO {
  totalCustomers: number;
  items: PlanCustomersDTO[];
}

export interface DashboardTopLutDTO {
  id: number;
  slug: string;
  title: string;
  coverUrl: string;
  isPremium: number;
  status: string;
  creatorName: string;
  downloads: number;
}

export interface DashboardSummaryDTO {
  from: string;
  to: string;
  groupBy: DashboardGroupBy;
  summary: DashboardTotalsDTO;
  previous: DashboardTotalsDTO;
  series: DashboardPointDTO[];
  revenueByPlan: PlanRevenueDTO[];
  activePlans: ActivePlansDTO;
  topLuts: DashboardTopLutDTO[];
}

export interface DashboardSummaryParams {
  from?: string;
  to?: string;
  groupBy?: DashboardGroupBy;
}
