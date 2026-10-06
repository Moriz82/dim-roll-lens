# Release validation

## Version 2.2.0 — October 6, 2026

Opening a weapon now displays a guide at the right edge of the viewport beside DIM's native popup. Both activity scores and missing-slot summaries remain visible above the scrollable breakdown. Each source combination shows all five recommended slots (Want), every owned option (Have), checks on owned recommendations, and available source notes. Multiple source rows remain separate; the closest complete row appears first. Fixed rolls and incomplete coverage receive explanations rather than invented recommendations.

- The same private four-store snapshot passed for **389 items and all 97 weapons**, including **97 guide cases**, the independent five-slot oracle, **497 actual-owned hash checks**, and selected-perk reversal. Guide content and tile verdicts are invariant to active selections. Existing label counts are unchanged: 2 PVE, 4 PVP, 3 PVE-1, 7 PVP-1, 1 dual one-away, 75 blank and 5 UNDEF. Private snapshots and live screenshots remain outside public history.
- Unit/DOM regressions cover both activities, coherent alternate combinations, inactive options, actual non-matching owned choices, source/DIM gaps, ambiguous editions, fixed rolls, HTML escaping, deduplication, independent dismissal, item switching, unrelated nonweapon tiles and retained source-note expansion. The guide explicitly receives pointer events despite [DIM's non-interactive desktop popup root](https://github.com/DestinyItemManager/DIM/blob/master/src/app/item-popup/ItemPopup.m.scss). A regression loads the production CSS under that native parent style.
- TypeScript, production Firefox/Chromium builds, all three built-bundle integrations, both package checks and diff checks passed. A read-only reviewer found no remaining material issue.
- Signed-in Firefox Nightly loaded the final 2.2.0 build. The Recluse guide showed PvE 3/5 with barrel/magazine missing and PvP 4/5 with masterwork missing. Its native gold checks and controls remained intact. Riptide correctly showed a 5/5 PvE god roll. Mouse-wheel input scrolled only the guide, floating launchers no longer covered it, closing the guide retained the native popup, changing the weapon opened its own guide, and Escape closed the item/guide. Source notes expanded correctly. Agent-created debugging tabs were closed, user tabs retained, and Firefox was left on the Recluse popup with the finished right-side guide.

The guide explains matching against the available community recommendations. It does not expand source coverage or infer missing recommendations. Firefox remains an unsigned temporary developer install.

## Version 2.1.1 — October 6, 2026

The earlier undefined coverage was overly broad. This release leaves positively identified fixed-roll weapons unlabeled, retains a complete evaluation when the other activity lacks coverage, and resolves shared-origin editions using the exact Bungie hash's legal trait pool and full origin sets. Manifest possibilities still never count as owned, and god rolls still require one complete owned 5/5 combination.

- The same four-store private snapshot passed again for all **389 items and 97 weapons**, including 52 positively fixed weapons. UNDEF fell from **76 to 5**. Final labels were 2 PVE, 4 PVP, 3 PVE-1, 7 PVP-1, 1 dual one-away, 75 blank and 5 UNDEF. All 97 weapons passed the independent whole-row oracle, selected-perk reversal, and 497 actual-owned hash checks.
- The five remaining undefined weapons have genuinely unavailable five-slot recommendations or unresolved legacy edition coverage. Fixed classification requires explicit DIM flags on the known main-trait sockets; absent metadata stays unknown. DIM derives this flag from its socket definition's randomized plug set or always-randomized socket type ([DIM socket implementation](https://github.com/DestinyItemManager/DIM/blob/master/src/app/inventory/store/sockets.ts)).
- Unit/DOM tests passed for known-versus-unknown randomization, clearing fixed-roll badges and checks, one-activity evaluation precedence, exact hash/name validation, shared-origin resolution and unchanged five-slot ownership rules. TypeScript, both builds, all built-bundle integrations and package validation passed. A read-only reviewer found no material defect.
- Manifest loading now runs at startup. Completion clears evaluation caches and reprocesses items so transient edition ambiguity does not persist.
- Final signed-in Firefox QA confirmed four stores/389 items, exactly 5 live UNDEF labels, zero badges on fixed-roll items, six native gold checks on the open Recluse popup and zero added cards/title badges. Smallbore and inactive recommended choices were marked inside DIM's existing perk section. The temporary debugging tab was closed; the browser was left on the clean weapon grid.

## Version 2.1.0 — October 6, 2026

This release supersedes the earlier active-perk definitions. God rolls require one complete five-slot recommendation: barrel, magazine, trait 1, trait 2 and masterwork. All owned options count, including inactive choices. Recommendation rows remain separate, and manifest/craftable possibilities do not count as owned. Missing source slots, incomplete item sockets and ambiguous weapon editions show gray slashed UNDEF unless a known god or one-away verdict takes priority.

- Unit/DOM regressions passed for coherent combinations, inactive owned alternatives, wrong-column rejection, enhanced perk names, exact masterworks, missing source fields, weapon edition resolution, stale native markers and selection invariance.
- Built-bundle integrations passed, including a native popup opened after its tile was cached using the same DIM item object. Native icon identities and gold checks are attached on both fresh and cached bridge paths. Lens mode adds no custom item card, hover card or title action.
- TypeScript, both production builds and browser ZIP validation passed. An independent read-only review found no remaining material issue after fixes for cached popup annotation and legacy popup injection.
- A private, read-only inventory snapshot covered all four DIM stores with no store errors. The refreshed snapshot contained **389 items: 97 weapons, 69 armor and 223 other items**. All 97 weapons passed an independent whole-row five-slot oracle; 497 owned plug hashes were checked against actual reusable/plugged sockets. Flipping every selected-perk flag left all verdicts and native check sets unchanged. Nonweapon items are excluded from Roll Lens labels.
- The inventory changed during testing. An earlier snapshot also passed for all 405 items, including 107 weapons. The refreshed snapshot is the final coverage receipt. Snapshots and live screenshots remain local and are excluded from the public repository; `scripts/validate-owned-inventory.cjs` can check another private snapshot without printing or uploading its inventory.
- The final packaged extension was reloaded in signed-in Firefox Nightly. DIM's native Recluse perk section displayed gold rings and checks on two recommended owned perks, retained its native controls, and contained zero added item cards/title badges. Live tiles displayed god, one-away, blank and gray slashed undefined states. The temporary debugging tab was closed after testing.

The final inventory had 1 PVE, 4 PVP, 1 PVE-1, 5 PVP-1, 1 dual one-away, 9 blank and 76 UNDEF verdicts. UNDEF is intentionally conservative: the community sources often omit one of the required five slots or do not distinguish every weapon edition. These checks prove matching against the available recommendations, not universal coverage or correctness of the authors' opinions.

## Historical releases

The definitions described below are historical and have been replaced by v2.1.0.

## Version 2.0.1 — October 6, 2026

Focused regressions confirm that tiles show only PVE / PVP / BOTH for active god rolls, PVE-1 / PVP-1 when exactly one slot required by the selected definition is not active, and no badge for other rolls. God-roll labels take priority over the other activity's one-away label. Unknown/fixed items cannot acquire a one-away label. Removal and recreation after item mutations, and settling without repeat writes on unlabeled tiles, are covered.

TypeScript, browser packages and built-content integration checks passed. The existing temporary add-on was reloaded in signed-in Firefox Nightly: live inventory tiles showed all five permitted labels, dual one-away labels wrapped cleanly, and fixed/unrated/two-away items had no overlay label. DIM's own item details remain visible. The prior release's dashboard and detailed activity behavior are unchanged.

## Version 2.0.0 — October 6, 2026

- Unit and DOM checks passed: source isolation, active versus selectable traits, strict matching, missing data, fixed exotics, HTML escaping, badge deduplication, dashboard filters/search and focus return.
- Full built-content integration checks passed using bundled public recommendations and synthetic item instances. Item mutations rescore without duplicate badges; absent PvP data never borrows PvE recommendations.
- Background integration checks passed: failed/empty refreshes retain both cached recommendations and the last successful timestamp.
- TypeScript and both production builds passed. Browser ZIPs preserve nested assets and contain their correct manifests, bundled data and attribution. Dependency audit reported zero vulnerabilities.
- Synthetic browser QA covered desktop and 390-pixel layouts, dual-activity breakdowns, swap guidance, filters, search and empty results.
- The packaged Firefox build was temporarily installed into Firefox Nightly **157.0a1** and checked on signed-in DIM. Live badges displayed PvE, PvP, BOTH, swap, fixed and unrated states. The dashboard's BOTH filter matched its displayed count and selected items showed independently evaluated activity recommendations. A weapon with active Auto-Loading Holster / Chill Clip showed a PvE match and identified selectable Cornered for PvP, without changing perks or inventory.
- An independent read-only code review found no material issue in verdict matching, source separation, cached-data retention and package contents.

Live inventory screenshots and account identifiers are not included in this repository. The checked inventory is a compatibility sample, not exhaustive coverage of every possible weapon or DIM layout. The dashboard covers weapon instances currently loaded in the DOM. Recommendations remain source opinions.

Firefox builds are unsigned temporary developer builds. Mozilla signing and persistent Firefox installation have not been completed. Chromium packages were built and validated, but signed-in browser testing for this release was performed in Firefox Nightly.
