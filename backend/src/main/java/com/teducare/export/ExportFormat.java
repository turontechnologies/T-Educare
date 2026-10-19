package com.teducare.export;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** The three formats any tabular export in this backend can be requested in — see {@link TabularExport}. */
public enum ExportFormat {
    CSV, XLSX, PDF;

    public static ExportFormat from(String value) {
        if (value == null || value.isBlank()) {
            return CSV;
        }
        try {
            return ExportFormat.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "format must be csv, xlsx, or pdf.");
        }
    }

    public String contentType() {
        return switch (this) {
            case CSV -> "text/csv;charset=UTF-8";
            case XLSX -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case PDF -> "application/pdf";
        };
    }

    public String extension() {
        return name().toLowerCase();
    }
}
