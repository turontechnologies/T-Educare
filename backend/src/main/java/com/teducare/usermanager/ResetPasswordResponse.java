package com.teducare.usermanager;

/** The plaintext is returned exactly once here — never retrievable again after this (see API_CONTRACT.md §4.5.4). */
public record ResetPasswordResponse(String password) {
}
