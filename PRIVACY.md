# DIM Roll Lens privacy

Updated October 6, 2026.

Roll Lens reads weapon names, perk sockets, masterwork data, and item instance identifiers already loaded in DIM. Matching and dashboard rendering take place in your browser. Local extension storage contains public recommendation caches, settings, and optional Light.gg grades or chase-list preferences inherited from upstream. The dashboard does not upload your inventory. Roll Lens adds no analytics, telemetry, or Bungie login flow, and never moves, equips, locks, tags, or dismantles items.

Public data downloads contact GitHub and Google Sheets. Those hosts receive normal network metadata such as your IP address. Source links open the source website. Optional Light.gg synchronization in advanced settings opens its Roll Appraiser in a browser tab and reads grades provided by that site; Light.gg has its own account and privacy practices. Roll Lens does not extract DIM or Bungie authentication tokens.

Permissions:

- `storage` and `unlimitedStorage`: local public databases and preferences.
- `alarms`: periodic community-data refresh.
- `tabs`: inherited Light.gg sync tab management and DIM messaging.
- Host permissions: DIM stable/beta, Winnower, Light.gg, GitHub raw content, Google Docs and its spreadsheet-content hosts. General access to all websites has been removed. Custom wishlists on other hosts may need an explicitly reviewed permission change; GitHub raw wishlists work with the supplied permissions.

Remove the extension to remove its extension storage. Existing DIM data remains managed by DIM. Inspect the [source](https://github.com/Moriz82/dim-roll-lens) or report a privacy issue there.
