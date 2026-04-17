export interface CompanyInfo {
  id: number;
  companyName: string;
  address: string;
  phoneNumber: string;
  ein: string;
  logoUrl: string | null;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  planPriceId: string | null;
  workLatitude: number | null;
  workLongitude: number | null;
  geofenceRadiusMeters: number | null;
}

export interface UpdateCompanyRequest {
  companyName: string;
  address?: string;
  phoneNumber?: string;
  workLatitude?: number | null;
  workLongitude?: number | null;
  geofenceRadiusMeters?: number | null;
}
