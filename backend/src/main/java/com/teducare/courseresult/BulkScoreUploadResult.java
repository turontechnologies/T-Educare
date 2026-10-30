package com.teducare.courseresult;

/** One row of CSV may touch several components at once, so counts are per score cell, not per row. */
public record BulkScoreUploadResult(int updated, int skipped) {
}
