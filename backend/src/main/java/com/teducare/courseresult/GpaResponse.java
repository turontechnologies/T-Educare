package com.teducare.courseresult;

/** One semester's GPA — {@code gpa} is null (not zero) when the student has no scored results that semester yet, so the frontend can distinguish "no results yet" from "a real 0.00". */
public record GpaResponse(String academicSemesterId, Double gpa, int totalUnits, int courseCount) {
}
