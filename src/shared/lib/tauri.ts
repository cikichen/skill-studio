import { invoke } from "@tauri-apps/api/core";
import type { AppOverview } from "../types/app";

export async function pingBackend() {
  return invoke<string>("ping");
}

export async function getAppOverview() {
  return invoke<AppOverview>("get_app_overview");
}
