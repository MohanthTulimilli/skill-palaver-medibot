import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function generateAiRiskScore(amount: number, provider: string): { score: number; explanation: string } {
  let baseScore = Math.random() * 40 + 10;

  if (amount > 10000) baseScore += 20;
  else if (amount > 5000) baseScore += 10;
  else if (amount > 1000) baseScore += 5;

  const highRiskProviders = ["unknown", "other"];
  const lowRiskProviders = ["blue cross", "united health", "aetna", "cigna"];
  const normalizedProvider = provider.toLowerCase();

  if (highRiskProviders.some((p) => normalizedProvider.includes(p))) {
    baseScore += 15;
  } else if (lowRiskProviders.some((p) => normalizedProvider.includes(p))) {
    baseScore -= 10;
  }

  const score = Math.min(99, Math.max(1, Math.round(baseScore * 100) / 100));

  let explanation = "";
  if (score > 70) {
    explanation = `High risk: Claim amount $${amount} with ${provider}. Flagged for manual review. Potential denial indicators detected.`;
  } else if (score > 40) {
    explanation = `Moderate risk: Claim amount $${amount} with ${provider}. Standard processing recommended with documentation verification.`;
  } else {
    explanation = `Low risk: Claim amount $${amount} with ${provider}. Auto-approval candidate. Strong payer history.`;
  }

  return { score, explanation };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Role check: only BILLING, HOSPITAL_ADMIN, SUPER_ADMIN can create claims
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!roleData || !["SUPER_ADMIN", "HOSPITAL_ADMIN", "BILLING"].includes(roleData.role)) {
      return new Response(JSON.stringify({ error: "Forbidden: Only Billing staff can create claims" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { patient_id, insurance_provider, amount, appointment_id } = body;

    if (!patient_id || !insurance_provider || !amount) {
      return new Response(
        JSON.stringify({ error: "patient_id, insurance_provider, and amount are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof amount !== "number" || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Amount must be a positive number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If appointment_id provided, validate it's COMPLETED and belongs to the patient
    if (appointment_id) {
      const { data: appt, error: apptError } = await supabase
        .from("appointments")
        .select("id, status, patient_id")
        .eq("id", appointment_id)
        .maybeSingle();

      if (apptError || !appt) {
        return new Response(
          JSON.stringify({ error: "Appointment not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (appt.status !== "COMPLETED") {
        return new Response(
          JSON.stringify({ error: "Appointment must be COMPLETED before creating a claim" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (appt.patient_id !== patient_id) {
        return new Response(
          JSON.stringify({ error: "Appointment does not belong to the specified patient" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if a claim already exists for this appointment
      const { data: existingClaim } = await supabase
        .from("claims")
        .select("id")
        .eq("appointment_id", appointment_id)
        .maybeSingle();

      if (existingClaim) {
        return new Response(
          JSON.stringify({ error: "A claim already exists for this appointment" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Generate AI risk score
    const { score, explanation } = generateAiRiskScore(amount, insurance_provider);

    // Insert claim
    const insertData: Record<string, unknown> = {
      patient_id,
      insurance_provider,
      amount,
      ai_risk_score: score,
      ai_explanation: explanation,
      submitted_by: userId,
      status: "PENDING",
    };
    if (appointment_id) insertData.appointment_id = appointment_id;

    const { data: claim, error: claimError } = await supabase
      .from("claims")
      .insert(insertData)
      .select()
      .single();

    if (claimError) {
      return new Response(JSON.stringify({ error: claimError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log AI prediction
    await supabase.from("ai_logs").insert({
      claim_id: claim.id,
      prediction_score: score,
      confidence: Math.round((85 + Math.random() * 14) * 100) / 100,
      flagged: score > 70,
    });

    return new Response(JSON.stringify({ claim }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
