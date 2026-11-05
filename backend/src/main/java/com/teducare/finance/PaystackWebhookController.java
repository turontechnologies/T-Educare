package com.teducare.finance;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Publicly reachable (see {@code SecurityConfig}'s permitAll for this exact
 * path) — Paystack itself calls this, so there's no JWT to check. Every
 * institution gets its own URL (its id is the path segment) so {@link
 * FinanceService#handlePaystackWebhook} knows which institution's secret
 * key to verify the signature against before trusting anything in the
 * body; the institution admin registers that exact URL in their own
 * Paystack dashboard.
 */
@RestController
@RequestMapping("/api/financials/paystack/webhook")
public class PaystackWebhookController {

    private final FinanceService service;

    public PaystackWebhookController(FinanceService service) {
        this.service = service;
    }

    @PostMapping("/{institutionId}")
    public void handleWebhook(
            @PathVariable String institutionId,
            @RequestBody String rawBody,
            @RequestHeader(value = "x-paystack-signature", required = false) String signature) {
        service.handlePaystackWebhook(institutionId, rawBody, signature);
    }
}
