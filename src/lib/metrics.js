import { supabase } from "./supabase";

const METRICS_ROW_ID = "global-dashboard-metrics";

const getCurrentMetrics = async () => {
  const { data, error } = await supabase
    .from("dashboard_metrics")
    .select("total_users,total_orders,total_revenue")
    .eq("id", METRICS_ROW_ID)
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw error;
  return data || { total_users: 0, total_orders: 0, total_revenue: 0 };
};

const saveMetrics = async (metrics) => {
  await supabase.from("dashboard_metrics").upsert(
    {
      id: METRICS_ROW_ID,
      ...metrics,
    },
    { onConflict: "id" }
  );
};

export const recordUserRegistration = async () => {
  try {
    const current = await getCurrentMetrics();
    await saveMetrics({
      ...current,
      total_users: (current.total_users || 0) + 1,
    });
  } catch (error) {
    console.warn("recordUserRegistration error:", error?.message || error);
  }
};

export const recordOrderSuccess = async (amount = 0) => {
  try {
    const current = await getCurrentMetrics();
    await saveMetrics({
      ...current,
      total_orders: (current.total_orders || 0) + 1,
      total_revenue: (current.total_revenue || 0) + Number(amount || 0),
    });
  } catch (error) {
    console.warn("recordOrderSuccess error:", error?.message || error);
  }
};
