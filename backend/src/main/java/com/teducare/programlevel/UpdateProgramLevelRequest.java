package com.teducare.programlevel;

/** Any field left null keeps its current value — same partial-update convention as program/UpdateProgramRequest. */
public record UpdateProgramLevelRequest(String levelCode, String description) {
}
