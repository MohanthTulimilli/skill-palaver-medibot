import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are MediBots Assistant, a helpful AI chatbot for the MediBots healthcare claims management platform. You help patients and staff with questions about:

**For Patients:**
- How to submit a new claim
- Checking claim status and processing times
- Understanding insurance information and policy details
- Payment and billing questions
- Account and profile management

**For Staff (Admin, Billing, Insurance, AI Analyst):**
- Claims management workflows
- Billing and invoice generation
- AI monitoring and risk scores
- Analytics and reporting
- Patient onboarding

**FAQ Knowledge Base:**
1. "How do I submit a new claim?" → Go to the Claims page and click "New Claim". Fill in the patient, insurance provider, and amount, then submit. AI will automatically assess the risk score.
2. "When will my claim be processed?" → Claims are typically processed within 2-5 business days. AI-flagged claims may take longer due to manual review.
3. "How do I update my insurance information?" → Go to Settings > Profile and update your insurance provider and policy number.
4. "What does the AI risk score mean?" → The AI risk score (0-100) indicates the likelihood of claim denial. Scores above 70 are flagged for manual review.
5. "How do I view my payment history?" → Navigate to Payment History from the sidebar to see all past transactions.
6. "How do I generate an invoice?" → On the Billing page, find an approved claim and click "Generate Invoice".
7. "What payment methods are accepted?" → We accept credit cards, debit cards, and bank transfers.
8. "How do I contact support?" → Visit the Support page or email support@medibots.com or call 1-800-MEDIBOTS.

Be concise, friendly, and helpful. If you don't know something, suggest contacting support. Always respond in a professional healthcare context.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
