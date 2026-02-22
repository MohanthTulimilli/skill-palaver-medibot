import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerUserId = claimsData.claims.sub;

    // Check caller role
    const { data: isSuperAdmin } = await userClient.rpc("has_role", { _user_id: callerUserId, _role: "SUPER_ADMIN" });
    const { data: isHospitalAdmin } = await userClient.rpc("has_role", { _user_id: callerUserId, _role: "HOSPITAL_ADMIN" });

    if (!isSuperAdmin && !isHospitalAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, target_user_id } = body;

    if (!action || !target_user_id) {
      return new Response(JSON.stringify({ error: "action and target_user_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get caller's hospital_id
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("hospital_id")
      .eq("user_id", callerUserId)
      .single();

    // Get target user's hospital_id to verify same hospital
    const { data: targetProfile } = await adminClient
      .from("profiles")
      .select("hospital_id, name, email, specialization")
      .eq("user_id", target_user_id)
      .single();

    if (!targetProfile) {
      return new Response(JSON.stringify({ error: "Target user not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Hospital admins can only manage users in their own hospital
    if (isHospitalAdmin && !isSuperAdmin) {
      if (targetProfile.hospital_id !== callerProfile?.hospital_id) {
        return new Response(JSON.stringify({ error: "Cannot manage users from another hospital" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Prevent self-deletion/modification of own admin account
    if (target_user_id === callerUserId) {
      return new Response(JSON.stringify({ error: "Cannot modify your own account from here" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      const { name, email, password, specialization } = body;

      // Update auth user (email/password)
      const updatePayload: Record<string, unknown> = {};
      if (email && email !== targetProfile.email) updatePayload.email = email;
      if (password) updatePayload.password = password;
      if (name) updatePayload.user_metadata = { name, specialization: specialization || null };

      if (Object.keys(updatePayload).length > 0) {
        const { error: authError } = await adminClient.auth.admin.updateUserById(target_user_id, updatePayload);
        if (authError) {
          return new Response(JSON.stringify({ error: authError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Update profile
      const profileUpdate: Record<string, unknown> = {};
      if (name) profileUpdate.name = name;
      if (email) profileUpdate.email = email;
      if (specialization !== undefined) profileUpdate.specialization = specialization || null;

      if (Object.keys(profileUpdate).length > 0) {
        const { error: profileError } = await adminClient
          .from("profiles")
          .update(profileUpdate)
          .eq("user_id", target_user_id);
        if (profileError) {
          return new Response(JSON.stringify({ error: profileError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      return new Response(JSON.stringify({ message: "User updated successfully" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "delete") {
      // Delete the auth user (cascades to profiles and user_roles via FK)
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(target_user_id);
      if (deleteError) {
        return new Response(JSON.stringify({ error: deleteError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ message: "User deleted successfully" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      return new Response(JSON.stringify({ error: "Invalid action. Use 'update' or 'delete'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
