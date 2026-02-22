package com.medibots.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class ChatService {

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String HF_ROUTER_URL = "https://router.huggingface.co/v1/chat/completions";
    private static final String GROQ_MODEL = "llama-3.1-8b-instant";
    private static final String HF_MODEL = "CohereLabs/command-a-reasoning-08-2025:cohere";

    private static final String SYSTEM_PROMPT = """
        You are MediBots Assistant, a live AI support chatbot for the MediBots healthcare Revenue Cycle Management platform.
        You help patients and staff in real time with immediate, actionable answers.

        **For Patients (common questions):**
        - Submitting claims: Go to My Claims or Book Appointment. For new claims, use the Claims section.
        - Claim status: Check "My Claims" for status. Typical processing is 2-5 business days.
        - Insurance: Update in Settings > Profile. Include provider name, policy number, group number.
        - Payments: Use "Make Payment" or "Invoices" to pay. Credit cards and bank transfer accepted.
        - Payment history: Available under "Payment History" in the sidebar.
        - Appointments: Use "Book Appointment" to schedule with doctors at your hospital.
        - General help: Support page, or email support@medibots.com, or call 1-800-MEDIBOTS.

        **For Staff (Billing, Admin, etc.):**
        - Claims: Use Claims page to view, submit, and manage. AI risk scores flag denials.
        - Invoices: Generate from Billing page on approved claims.
        - AI monitoring: AI Monitoring shows model performance and flagged claims.
        - Patient onboarding: Staff can add patients via Patients management.

        **Guidelines:**
        - Be warm, empathetic, and professional. Patients may be stressed about bills or claims.
        - Give short, clear, step-by-step answers. Use bullets when listing options.
        - If unsure, suggest contacting support or checking the relevant dashboard section.
        - Never give medical advice. Direct clinical questions to their doctor.
        - Keep replies concise (2-4 sentences usually) but complete.
        """;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.chat.groq-api-key:}")
    private String groqApiKey;

    @Value("${app.chat.hf-token:}")
    private String hfToken;

    public String chat(List<Map<String, String>> messages) {
        String apiKey = groqApiKey;
        String url = GROQ_URL;
        String model = GROQ_MODEL;

        if (apiKey == null || apiKey.isBlank()) {
            apiKey = hfToken;
            url = HF_ROUTER_URL;
            model = HF_MODEL;
        }

        if (apiKey == null || apiKey.isBlank()) {
            return """
                Hi! The chat needs an API key to work. Your admin can enable it by setting either:
                • GROQ_API_KEY (free at groq.com) — recommended, very fast
                • HF_TOKEN (Hugging Face) — huggingface.co
                Restart the backend after adding the key. Meanwhile, call 1-800-MEDIBOTS or email support@medibots.com for help.""";
        }

        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", model);
            ArrayNode msgs = body.putArray("messages");
            msgs.addObject()
                .put("role", "system")
                .put("content", SYSTEM_PROMPT);
            for (Map<String, String> m : messages) {
                String role = String.valueOf(m.getOrDefault("role", "user"));
                Object contentVal = m.get("content");
                String content = contentVal != null ? contentVal.toString() : "";
                if (!content.isBlank()) {
                    String apiRole = "user".equalsIgnoreCase(role) ? "user" : "assistant";
                    msgs.addObject().put("role", apiRole).put("content", content);
                }
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey.trim());
            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);

            ResponseEntity<String> resp = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                String.class
            );

            JsonNode root = objectMapper.readTree(resp.getBody());
            JsonNode choices = root.path("choices");
            if (choices.isArray() && choices.size() > 0) {
                JsonNode msg = choices.get(0).path("message");
                JsonNode content = msg.path("content");
                return content.asText();
            }
            return "I couldn't generate a response. Please try again or contact support@medibots.com.";
        } catch (Exception e) {
            return "Something went wrong. Please try again in a moment. For urgent help, call 1-800-MEDIBOTS.";
        }
    }
}
