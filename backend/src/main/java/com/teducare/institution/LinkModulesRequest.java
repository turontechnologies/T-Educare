package com.teducare.institution;

import java.util.List;

import jakarta.validation.constraints.NotNull;

public record LinkModulesRequest(@NotNull(message = "moduleKeys is required.") List<String> moduleKeys) {
}
