package com.teducare.program;

/** Any field left null keeps its current value — same partial-update convention as department/UpdateDepartmentRequest. */
public record UpdateProgramRequest(String name, String departmentId, String facultyId, String programType) {
}
