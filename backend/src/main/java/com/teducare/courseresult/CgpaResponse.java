package com.teducare.courseresult;

import java.util.List;

/** The student's cumulative GPA across every semester they have results for, plus the same figure broken down per semester — so a transcript-style view doesn't need a second call per semester. */
public record CgpaResponse(Double cgpa, int totalUnits, int courseCount, List<GpaResponse> bySemester) {
}
