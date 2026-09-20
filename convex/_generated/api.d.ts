/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as services_admin_gate from "../services/admin_gate.js";
import type * as services_instagram from "../services/instagram.js";
import type * as services_reels_queue from "../services/reels_queue.js";
import type * as services_telegram from "../services/telegram.js";
import type * as tables_data_cooked_instagram_reels from "../tables/data_cooked_instagram_reels.js";
import type * as tables_data_raw_instagram_media from "../tables/data_raw_instagram_media.js";
import type * as tables_data_raw_instagram_metrics from "../tables/data_raw_instagram_metrics.js";
import type * as tables_ops_alerts from "../tables/ops_alerts.js";
import type * as tables_ops_channel_toggles from "../tables/ops_channel_toggles.js";
import type * as tables_ops_instagram_state from "../tables/ops_instagram_state.js";
import type * as tables_ops_social_snapshots from "../tables/ops_social_snapshots.js";
import type * as workflows_instagram_publishing from "../workflows/instagram_publishing.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  "services/admin_gate": typeof services_admin_gate;
  "services/instagram": typeof services_instagram;
  "services/reels_queue": typeof services_reels_queue;
  "services/telegram": typeof services_telegram;
  "tables/data_cooked_instagram_reels": typeof tables_data_cooked_instagram_reels;
  "tables/data_raw_instagram_media": typeof tables_data_raw_instagram_media;
  "tables/data_raw_instagram_metrics": typeof tables_data_raw_instagram_metrics;
  "tables/ops_alerts": typeof tables_ops_alerts;
  "tables/ops_channel_toggles": typeof tables_ops_channel_toggles;
  "tables/ops_instagram_state": typeof tables_ops_instagram_state;
  "tables/ops_social_snapshots": typeof tables_ops_social_snapshots;
  "workflows/instagram_publishing": typeof workflows_instagram_publishing;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
