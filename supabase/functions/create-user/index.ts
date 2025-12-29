import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Missing Supabase env vars" }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const email = String(payload.email ?? "").trim().toLowerCase();
  const password = String(payload.password ?? "");
  const fullName = String(payload.full_name ?? "");
  const role = payload.role === "admin" ? "admin" : "user";
  const status = payload.status === "inactive" ? "inactive" : "active";

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return jsonResponse({ error: "Invalid email" }, 400);
  }

  if (password.length < 6) {
    return jsonResponse({ error: "Password too short" }, 400);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authUserData, error: authUserError } = await supabaseAdmin.auth.getUser(token);
  if (authUserError || !authUserData?.user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { data: adminProfile, error: adminProfileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", authUserData.user.id)
    .maybeSingle();

  if (adminProfileError) {
    return jsonResponse({ error: adminProfileError.message }, 500);
  }

  if (adminProfile?.role !== "admin") {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError) {
    return jsonResponse({ error: createError.message }, 400);
  }

  const createdUser = created.user;
  if (!createdUser?.id) {
    return jsonResponse({ error: "User creation failed" }, 500);
  }

  const { data: profileData, error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: createdUser.id,
        email: createdUser.email ?? email,
        full_name: fullName,
        role,
        status,
      },
      { onConflict: "id" },
    )
    .select()
    .maybeSingle();

  if (profileError) {
    return jsonResponse({ error: profileError.message }, 500);
  }

  return jsonResponse({
    user: { id: createdUser.id, email: createdUser.email },
    profile: profileData ?? null,
  });
});
