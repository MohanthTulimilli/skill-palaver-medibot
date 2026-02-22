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

    // Check caller role - must be SUPER_ADMIN or HOSPITAL_ADMIN
    const { data: isSuperAdmin } = await userClient.rpc("has_role", { _user_id: callerUserId, _role: "SUPER_ADMIN" });
    const { data: isHospitalAdmin } = await userClient.rpc("has_role", { _user_id: callerUserId, _role: "HOSPITAL_ADMIN" });

    if (!isSuperAdmin && !isHospitalAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, name, role, hospital_id, specialization } = await req.json();

    if (!email || !password || !name || !role) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Domain-to-role mapping for validation
    const roleDomainMap: Record<string, string> = {
      "HOSPITAL_ADMIN": "admin.medibots.com",
      "DOCTOR": "doctor.medibots.com",
      "BILLING": "billingcare.medibots.com",
      "INSURANCE": "insurance.medibots.com",
      "AI_ANALYST": "analyst.medibots.com",
    };

    // Validate email domain matches the role
    const emailDomain = email.substring(email.indexOf("@") + 1);
    const expectedDomain = roleDomainMap[role];
    if (expectedDomain && emailDomain !== expectedDomain) {
      return new Response(JSON.stringify({ error: `Email domain must be @${expectedDomain} for role ${role}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Role validation based on caller
    if (isSuperAdmin) {
      const validRoles = ["HOSPITAL_ADMIN", "SUPER_ADMIN"];
      if (!validRoles.includes(role)) {
        return new Response(JSON.stringify({ error: "Super Admin can only create Hospital Admins" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      const validStaffRoles = ["DOCTOR", "BILLING", "INSURANCE", "AI_ANALYST"];
      if (!validStaffRoles.includes(role)) {
        return new Response(JSON.stringify({ error: `Hospital Admin can only create: ${validStaffRoles.join(", ")}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get hospital_id: for hospital admin, use their own hospital
    let effectiveHospitalId = hospital_id;
    if (isHospitalAdmin && !isSuperAdmin) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: callerProfile } = await adminClient
        .from("profiles")
        .select("hospital_id")
        .eq("user_id", callerUserId)
        .single();
      effectiveHospitalId = callerProfile?.hospital_id;
      if (!effectiveHospitalId) {
        return new Response(JSON.stringify({ error: "Your admin profile is not linked to a hospital. Please contact Super Admin." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, app_role: role, hospital_id: effectiveHospitalId, specialization: role === 'DOCTOR' ? specialization : null },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        message: "Account created successfully",
        user: { id: newUser.user.id, email: newUser.user.email, role },
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
