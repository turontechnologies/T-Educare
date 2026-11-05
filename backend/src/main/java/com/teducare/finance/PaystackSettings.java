package com.teducare.finance;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Per-institution Paystack credentials — **super-admin only**, never
 * exposed to an institution_admin or returned over the API; the
 * secret key only ever leaves this row to go straight into a
 * server-to-server call to Paystack (Initialize Transaction) or a
 * webhook-signature check. {@code institutionId} is the primary key —
 * one row per institution, upserted on save, matching {@code
 * GradingScale}'s own one-row-per-institution convention.
 */
@Entity
@Table(name = "paystack_settings", schema = "dbo")
public class PaystackSettings {

    @Id
    @Column(name = "institution_id", length = 64)
    private String institutionId;

    @Column(name = "public_key", nullable = false, length = 200)
    private String publicKey;

    @Column(name = "secret_key", nullable = false, length = 200)
    private String secretKey;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected PaystackSettings() {
    }

    public PaystackSettings(
            String institutionId, String publicKey, String secretKey, boolean enabled, Instant updatedAt) {
        this.institutionId = institutionId;
        this.publicKey = publicKey;
        this.secretKey = secretKey;
        this.enabled = enabled;
        this.updatedAt = updatedAt;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public String getPublicKey() {
        return publicKey;
    }

    public void setPublicKey(String publicKey) {
        this.publicKey = publicKey;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
