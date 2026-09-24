package com.teducare.upload;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

/**
 * Server-side signed uploads to Cloudinary — backs the avatarUrl/logoUrl
 * fields on profile and institution records (see API_CONTRACT.md §3.2/§4.2:
 * frontend uploads the file here first, then sends the returned url).
 */
@RestController
@RequestMapping("/api")
public class UploadController {

    private static final long MAX_UPLOAD_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_TYPES = Set.of("image/png", "image/jpeg", "image/webp");

    private final Cloudinary cloudinary;

    public UploadController(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    @PostMapping(value = "/uploads", consumes = "multipart/form-data")
    public Map<String, String> upload(
            @RequestParam("file") MultipartFile file, Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file provided.");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PNG, JPEG, or WEBP images are allowed.");
        }
        if (file.getSize() > MAX_UPLOAD_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image must be 5MB or smaller.");
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary
                    .uploader()
                    .upload(file.getBytes(), ObjectUtils.asMap("folder", "t-educare/uploads"));
            return Map.of("url", (String) result.get("secure_url"));
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Upload to Cloudinary failed.");
        }
    }
}
