import { apiGet } from "./client";

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  environment: string;
  database: "not_configured" | "connected" | "unavailable";
}

export function fetchHealth(): Promise<HealthResponse> {
  return apiGet<HealthResponse>("/health");
}
