import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    // Check role: ADMIN, BILLING, AI_ANALYST, INSURANCE
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!roleData || !["SUPER_ADMIN", "HOSPITAL_ADMIN", "BILLING", "AI_ANALYST", "INSURANCE"].includes(roleData.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all claims
    const { data: claims, error: fetchErr } = await supabase
      .from("claims")
      .select("id, amount, status, ai_risk_score, submitted_at, insurance_provider");

    if (fetchErr) {
      return new Response(JSON.stringify({ error: fetchErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allClaims = claims || [];
    const total = allClaims.length;
    const approved = allClaims.filter(c => c.status === "APPROVED");
    const denied = allClaims.filter(c => c.status === "DENIED");
    const pending = allClaims.filter(c => c.status === "PENDING");

    const totalRevenue = approved.reduce((s, c) => s + Number(c.amount), 0);
    const denialRate = total > 0 ? Math.round((denied.length / total) * 10000) / 100 : 0;
    const avgRiskScore = total > 0
      ? Math.round(allClaims.reduce((s, c) => s + Number(c.ai_risk_score || 0), 0) / total * 100) / 100
      : 0;

    // Claims by payer
    const byPayer: Record<string, number> = {};
    allClaims.forEach(c => {
      byPayer[c.insurance_provider] = (byPayer[c.insurance_provider] || 0) + 1;
    });
    const claimsByPayer = Object.entries(byPayer)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Claims by month
    const byMonth: Record<string, { total: number; approved: number; denied: number; revenue: number }> = {};
    allClaims.forEach(c => {
      const month = c.submitted_at ? c.submitted_at.substring(0, 7) : "unknown";
      if (!byMonth[month]) byMonth[month] = { total: 0, approved: 0, denied: 0, revenue: 0 };
      byMonth[month].total++;
      if (c.status === "APPROVED") {
        byMonth[month].approved++;
        byMonth[month].revenue += Number(c.amount);
      }
      if (c.status === "DENIED") byMonth[month].denied++;
    });
    const monthlyTrend = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));

    // Risk distribution
    const riskBuckets = { low: 0, medium: 0, high: 0 };
    allClaims.forEach(c => {
      const score = Number(c.ai_risk_score || 0);
      if (score < 30) riskBuckets.low++;
      else if (score < 70) riskBuckets.medium++;
      else riskBuckets.high++;
    });

    // Fetch invoices for payment stats
    const { data: invoices } = await supabase
      .from("invoices")
      .select("total_amount, payment_status");

    const allInvoices = invoices || [];
    const totalBilled = allInvoices.reduce((s, i) => s + Number(i.total_amount), 0);
    const totalCollected = allInvoices
      .filter(i => i.payment_status === "PAID")
      .reduce((s, i) => s + Number(i.total_amount), 0);
    const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 10000) / 100 : 0;

    const analytics = {
      summary: {
        totalClaims: total,
        approvedClaims: approved.length,
        deniedClaims: denied.length,
        pendingClaims: pending.length,
        totalRevenue,
        denialRate,
        avgRiskScore,
        totalBilled,
        totalCollected,
        collectionRate,
      },
      claimsByPayer,
      monthlyTrend,
      riskDistribution: [
        { name: "Low (<30)", value: riskBuckets.low },
        { name: "Medium (30-70)", value: riskBuckets.medium },
        { name: "High (>70)", value: riskBuckets.high },
      ],
    };

    return new Response(JSON.stringify(analytics), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
