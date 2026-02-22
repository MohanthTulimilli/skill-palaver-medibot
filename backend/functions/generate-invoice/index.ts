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

    // Check role: ADMIN or BILLING
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!roleData || !["SUPER_ADMIN", "HOSPITAL_ADMIN", "BILLING"].includes(roleData.role)) {
      return new Response(JSON.stringify({ error: "Forbidden: Only admins or BILLING roles can generate invoices" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { claim_id, line_items } = body;

    if (!claim_id) {
      return new Response(
        JSON.stringify({ error: "claim_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the claim
    const { data: claim, error: claimError } = await supabase
      .from("claims")
      .select("*")
      .eq("id", claim_id)
      .maybeSingle();

    if (claimError || !claim) {
      return new Response(
        JSON.stringify({ error: "Claim not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (claim.status !== "APPROVED") {
      return new Response(
        JSON.stringify({ error: "Invoice can only be generated for APPROVED claims" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if invoice already exists for this claim
    const { data: existingInvoice } = await supabase
      .from("invoices")
      .select("id")
      .eq("claim_id", claim_id)
      .maybeSingle();

    if (existingInvoice) {
      return new Response(
        JSON.stringify({ error: "Invoice already exists for this claim" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate total from line items if provided, otherwise use claim amount
    let totalAmount = claim.amount;
    const items: { description: string; amount: number; item_type: string }[] = line_items || [];
    
    if (items.length > 0) {
      totalAmount = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
    } else {
      // Default: single consultation fee line item
      items.push({ description: "Doctor Consultation Fee", amount: claim.amount, item_type: "CONSULTATION" });
    }

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        patient_id: claim.patient_id,
        claim_id: claim.id,
        total_amount: totalAmount,
        hospital_id: claim.hospital_id,
        payment_status: "UNPAID",
      })
      .select()
      .single();

    if (invoiceError) {
      return new Response(JSON.stringify({ error: invoiceError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert line items
    if (items.length > 0) {
      const lineItemRows = items.map((item: any) => ({
        invoice_id: invoice.id,
        description: item.description,
        amount: item.amount,
        item_type: item.item_type || "OTHER",
      }));
      await supabase.from("invoice_items").insert(lineItemRows);
    }

    return new Response(JSON.stringify({ invoice }), {
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
