package com.teducare.institution;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Runs every startup (unlike the empty-table-only seeders in this package) but is a no-op once every institution has a slug — see {@link InstitutionService#backfillMissingSlugs()}. */
@Component
public class InstitutionSlugBackfiller {

    private final InstitutionService service;

    public InstitutionSlugBackfiller(InstitutionService service) {
        this.service = service;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void backfill() {
        service.backfillMissingSlugs();
    }
}
