# Release validation

## Version 2.0.0 — October 6, 2026

- Unit and DOM checks passed: source isolation, active versus selectable traits, strict matching, missing data, fixed exotics, HTML escaping, badge deduplication, dashboard filters/search and focus return.
- Full built-content integration checks passed using bundled public recommendations and synthetic item instances. Item mutations rescore without duplicate badges; absent PvP data never borrows PvE recommendations.
- Background integration checks passed: failed/empty refreshes retain both cached recommendations and the last successful timestamp.
- TypeScript and both production builds passed. Browser ZIPs preserve nested assets and contain their correct manifests, bundled data and attribution. Dependency audit reported zero vulnerabilities.
- Synthetic browser QA covered desktop and 390-pixel layouts, dual-activity breakdowns, swap guidance, filters, search and empty results.
- The packaged Firefox build was temporarily installed into Firefox Nightly **157.0a1** and checked on signed-in DIM. Live badges displayed PvE, PvP, BOTH, swap, fixed and unrated states. The dashboard's BOTH filter matched its displayed count and selected items showed independently evaluated activity recommendations. A weapon with active Auto-Loading Holster / Chill Clip showed a PvE match and identified selectable Cornered for PvP, without changing perks or inventory.
- An independent read-only code review found no material issue in verdict matching, source separation, cached-data retention and package contents.

Live inventory screenshots and account identifiers are not included in this repository. The checked inventory is a compatibility sample, not exhaustive coverage of every weapon or DIM layout. The dashboard covers weapon instances currently loaded in the DOM. Recommendations remain source opinions, and the default definition requires both main traits; the strict definition also requires every specified detail.

Firefox builds are unsigned temporary developer builds. Mozilla signing and persistent Firefox installation have not been completed. Chromium packages were built and validated, but signed-in browser testing for this release was performed in Firefox Nightly.
