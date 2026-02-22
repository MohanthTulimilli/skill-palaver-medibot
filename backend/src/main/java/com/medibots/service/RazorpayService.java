package com.medibots.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class RazorpayService {

    private final String keyId;
    private final String keySecret;
    private RazorpayClient client;

    public RazorpayService(
            @Value("${app.razorpay.key-id:}") String keyId,
            @Value("${app.razorpay.key-secret:}") String keySecret) {
        this.keyId = keyId != null ? keyId.trim() : "";
        this.keySecret = keySecret != null ? keySecret.trim() : "";
        if (!this.keyId.isEmpty() && !this.keySecret.isEmpty()) {
            try {
                this.client = new RazorpayClient(this.keyId, this.keySecret);
            } catch (RazorpayException e) {
                this.client = null;
            }
        } else {
            this.client = null;
        }
    }

    public boolean isConfigured() {
        return client != null;
    }

    /**
     * Create Razorpay order. Amount in paise (INR).
     * Returns Map with orderId, keyId, amount, currency.
     */
    public Map<String, Object> createOrder(long amountPaise, String receipt, String invoiceId) throws RazorpayException {
        if (client == null) {
            throw new IllegalStateException("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
        }
        JSONObject params = new JSONObject();
        params.put("amount", amountPaise);
        params.put("currency", "INR");
        if (receipt != null && !receipt.isBlank()) params.put("receipt", receipt);
        params.put("notes", new JSONObject().put("invoice_id", invoiceId != null ? invoiceId : ""));

        Order order = client.orders.create(params);
        return Map.of(
                "orderId", order.get("id"),
                "keyId", keyId,
                "amount", amountPaise,
                "currency", "INR"
        );
    }

    /**
     * Verify payment signature and return true if valid.
     */
    public boolean verifyPayment(String orderId, String paymentId, String signature) {
        if (keySecret == null || keySecret.isEmpty()) return false;
        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", orderId);
            options.put("razorpay_payment_id", paymentId);
            options.put("razorpay_signature", signature);
            Utils.verifyPaymentSignature(options, keySecret);
            return true;
        } catch (RazorpayException e) {
            return false;
        }
    }
}
