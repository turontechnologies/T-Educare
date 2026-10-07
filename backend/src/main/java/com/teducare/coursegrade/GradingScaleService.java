package com.teducare.coursegrade;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;

@Service
public class GradingScaleService {

    /** Matches the pre-backend mock's own default (academics.store.ts's `maxGradePoint: 5`) — returned, never persisted, until an institution's admin actually sets one via PUT. */
    private static final BigDecimal DEFAULT_MAX_GRADE_POINT = BigDecimal.valueOf(5);

    private final GradingScaleRepository repository;

    public GradingScaleService(GradingScaleRepository repository) {
        this.repository = repository;
    }

    public GradingScaleResponse get(String institutionId) {
        return repository.findById(institutionId)
                .map(scale -> new GradingScaleResponse(scale.getMaxGradePoint()))
                .orElse(new GradingScaleResponse(DEFAULT_MAX_GRADE_POINT));
    }

    public GradingScaleResponse update(String institutionId, UpdateGradingScaleRequest request) {
        GradingScale scale = repository.findById(institutionId)
                .orElse(new GradingScale(institutionId, request.maxGradePoint()));
        scale.setMaxGradePoint(request.maxGradePoint());
        repository.save(scale);
        return new GradingScaleResponse(scale.getMaxGradePoint());
    }
}
