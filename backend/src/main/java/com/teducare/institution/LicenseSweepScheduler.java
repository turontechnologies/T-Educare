package com.teducare.institution;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * First {@code @Scheduled} job in this backend. The actual sweep logic
 * lives in {@code InstitutionService.sweepExpiredGracePeriods()} — this
 * class only triggers it on a timer, so the JUnit suite can call that
 * method directly without waiting on real wall-clock time or mocking a
 * clock.
 */
@Component
public class LicenseSweepScheduler {

    private final InstitutionService institutionService;

    public LicenseSweepScheduler(InstitutionService institutionService) {
        this.institutionService = institutionService;
    }

    @Scheduled(cron = "0 0 2 * * *")
    public void sweepExpiredGracePeriods() {
        institutionService.sweepExpiredGracePeriods();
    }
}
