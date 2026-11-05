package com.teducare.finance;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Thin wrapper around Paystack's REST API — a server-to-server "Initialize
 * Transaction" call (never the student's card details; this backend only
 * ever generates a payment link for the student to complete in their own
 * browser) plus webhook signature verification. Each institution brings
 * its own test/live key pair, stored in {@link PaystackSettings} and set
 * up by a super admin (§17.2) — this class never sees or caches a key
 * beyond the single call it's given one for.
 */
@Component
class PaystackClient {

    private static final String INITIALIZE_URL = "https://api.paystack.co/transaction/initialize";
    private static final String HMAC_ALGORITHM = "HmacSHA512";

    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /** Returns the hosted checkout URL the student completes payment at — never a card field rendered by this backend. */
    String initializeTransaction(String secretKey, String email, long amountKobo, String reference) {
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "email", email, "amount", amountKobo, "reference", reference));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(INITIALIZE_URL))
                    .header("Authorization", "Bearer " + secretKey)
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(response.body());
            if (response.statusCode() != 200 || !root.path("status").asBoolean(false)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY, "Paystack rejected the request: " + root.path("message").asText("unknown error"));
            }
            return root.path("data").path("authorization_url").asText();
        } catch (IOException | InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not reach Paystack. Try again shortly.");
        }
    }

    /** Verifies the {@code x-paystack-signature} header is HMAC-SHA512(secretKey, rawBody) — never trust a webhook body before this passes. */
    boolean verifySignature(String secretKey, String rawBody, String signatureHeader) {
        if (signatureHeader == null || signatureHeader.isBlank()) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            byte[] computed = mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8));
            String computedHex = HexFormat.of().formatHex(computed);
            return computedHex.equalsIgnoreCase(signatureHeader.trim());
        } catch (NoSuchAlgorithmException | InvalidKeyException ex) {
            return false;
        }
    }

    ObjectMapper objectMapper() {
        return objectMapper;
    }
}
