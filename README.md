# ◈ DIM Roll Lens

**Know immediately whether your weapon is a PvE god roll, a PvP god roll, or both.**

Roll Lens is a browser extension for [Destiny Item Manager](https://app.destinyitemmanager.com/). It labels weapon tiles using the perks actually present on each gun and marks recommended choices directly in DIM’s native perk section.

Built on [Maxeption’s dim-aegis-overlay](https://github.com/Maxeption/dim-aegis-overlay). **Thank you, Maxeption, for the original project and its foundation.** Original Git history and contributor attribution are preserved. See [credits](CREDITS.md).

## What you see

| Tile label | Meaning |
| --- | --- |
| **PVE** | The gun owns one complete 5/5 PvE recommendation. |
| **PVP** | The gun owns one complete 5/5 PvP recommendation. |
| **BOTH** | The gun owns a complete 5/5 recommendation for each activity. |
| **PVE-1** | Exactly one of the five recommended PvE slots is missing. |
| **PVP-1** | Exactly one of the five recommended PvP slots is missing. |
| **Gray slashed UNDEF** | Neither activity can establish a complete five-slot evaluation. |
| **No label** | An evaluated gun is two or more slots away, or DIM positively identifies fixed main traits. Armor and other items have no Roll Lens labels. |

The five slots are **barrel, magazine, trait 1, trait 2 and masterwork**. All options present on the gun count, including inactive perks. Changing which perk is selected does not change its verdict. Craftable or manifest possibilities that are absent from the gun do not count.

Each verdict requires **one complete recommended combination**. Alternatives inside that source row are allowed; different recommendation rows never combine into a synthetic 5/5. PvE and PvP can each match a different complete combination that the gun owns.

God labels take priority over one-away labels and UNDEF. Otherwise, one-away labels take priority over UNDEF. If both activities are one away, the tile shows **PVE-1 PVP-1**. One activity's missing recommendation does not override the other's complete evaluation. A missing source recommendation never acts as a wildcard.

The gun's exact Bungie hash and legal trait pool help distinguish weapon editions with shared origin traits. This manifest data establishes source compatibility only; it never adds perks to the gun's owned choices. Fixed-roll weapons stay unlabeled because there is no random roll to grade. Missing DIM randomization metadata does not hide an undefined roll.

Clicking an item opens DIM’s normal popup. Matching recommended perks receive a **gold circle and check** on their existing icons, including inactive choices. A **god-roll guide docks to the right side of the screen** beside the native popup. It shows PvE and PvP scores, recommended choices (Want), every owned option (Have), and exactly which slots are missing. Alternative source combinations stay separate, with the closest complete combination first. Source notes explain the author's reasoning when available. The guide closes with the item and can be dismissed independently. DIM's title actions and item controls stay intact. The optional **Roll Lens** dashboard provides an inventory overview.

PvE uses **Aegis**. PvP uses **Finnald / Pride Eternal**. Recommendations reflect those sources; weapon meta tiers and optional Light.gg popularity grades do not establish a god roll.

## Features

- Simultaneous PvE, PvP and both labels, with optional keeper outlines.
- A right-side guide opens with each weapon: both activities, coherent possible god rolls, and missing-slot explanations.
- A **Roll Lens** button inside DIM opens a searchable inventory overview.
- Filter god rolls by activity, find one-away rolls, and inspect undefined coverage.
- Clean tile labels for 5/5 and 4/5 rolls, with a gray slashed UNDEF only when neither source can establish a five-slot verdict. Fixed rolls stay clear. Gold checks stay inside DIM’s native perk controls.
- Keyboard-accessible dialog, search, filters and close controls; narrow-screen layout.
- Bundled public recommendations for an offline first load, plus daily refresh. Failed/empty refreshes preserve cached ratings.
- Simple toolbar settings with upstream advanced customization, wishlist, armor, explorer and optional Light.gg tools still available.

The dashboard counts **weapon instances currently loaded in DIM’s DOM**. It does not promise a complete account scan. Load your inventory and show the characters/items you want to inspect. The extension only displays recommendations; item operations stay in DIM.

## Install

Download the correct ZIP from [Releases](https://github.com/Moriz82/dim-roll-lens/releases/latest) and extract it. Disable any other Aegis overlay extension first to avoid duplicate overlays.

### Firefox / Firefox Nightly

The GitHub Firefox build is **unsigned** and supports temporary developer loading:

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…**.
3. Select `manifest.json` in the extracted **firefox** folder.
4. Reload DIM. Open **Roll Lens** at the bottom right.

Firefox removes temporary add-ons when it restarts. A persistent install requires Mozilla signing; this project is not yet published on Mozilla Add-ons. There is no need to disable Firefox signature checks.

### Chrome / Chromium / Brave / Edge

1. Open the browser’s extensions page and enable **Developer mode**.
2. Click **Load unpacked** and select the extracted **chromium** folder.
3. Reload DIM.

DIM stable and beta are supported. The owned five-slot bridge and native gold checks are intended for DIM. Upstream Winnower tools remain available with Roll Lens disabled. This project is independent of Bungie, DIM, Maxeption and the recommendation authors.

## Develop

Use Node **24 LTS** or another Vite 8 supported version.

```sh
npm ci
npm test
npm run build:all
npm run test:integration
node scripts/verify-package.mjs
```

- `dist/`: unpacked Chromium extension.
- `releases/firefox/`: Firefox extension with the correct manifest.
- `releases/chromium/`: Chromium extension.
- `releases/*.zip`: separately packaged browser builds with nested paths preserved.

Run `npm run dev` and open `/preview.html` for an interactive synthetic inventory using the same verdict engine and UI. This demo does not log into Bungie or read your vault.

## Validation and limits

Unit/DOM tests cover coherent five-slot combinations, inactive owned choices, selection invariance, wrong-column rejection, exact masterwork matching, undefined source coverage, native icon checks, HTML escaping, guide lifecycle and dashboard controls. Built-bundle tests exercise mutation-triggered rescoring and source isolation. Package validation checks both manifests and required ZIP paths.

See [validation](docs/VALIDATION.md) for release-specific evidence and inventory coverage. The DIM bridge reads React item data; DIM changes can break it. Bundled recommendations come from the upstream snapshot. A successful refresh confirms retrieval, not that every weapon recommendation reflects the latest sandbox.

Custom wishlists hosted at `raw.githubusercontent.com` work with the supplied permissions. Other domains need an explicit host-permission change. [Privacy](PRIVACY.md) explains local data and network use.

## Credits and license

**Thanks again to [Maxeption](https://github.com/Maxeption)** and all upstream contributors. Recommendations and supporting work are credited to Aegis, Finnald, LowCo, Azra, Revadike, MrCharles, DIM and Bungie in [CREDITS.md](CREDITS.md). Third-party notices remain included in the extension.

[MIT](LICENSE), following the license declared by the original project. Game assets and bundled community data retain their respective attribution.
