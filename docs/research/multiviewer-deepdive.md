# MultiViewer Deep Dive — Lessons for Teebox

Research synthesis on [MultiViewer](https://multiviewer.app/) to inform the Teebox roadmap. Sources cited inline.

## TL;DR

MultiViewer (MV) is a desktop app wrapping F1TV plus FOM's live-timing feed into a layout-driven, multi-stream, telemetry-rich dashboard. Core = **synced multi-stream + structured live data + saveable layouts**. Most *wow* features (telemetry overlays, race trace, mini-sectors, marshal sectors, AI radio) depend on FOM's live-timing socket — no golf equivalent. Portable: multi-stream sync, saveable layouts, structured leaderboard, score-by-hole grid, no-spoilers, click-to-highlight, adapter/plugin model. Telemetry overlays are OOS until the PGA Tour opens shot-level data, and then only at ShotLink events.

## 1. MV feature inventory

Sourced from MV's [site](https://multiviewer.app/), [changelog](https://multiviewer.app/changelog), [shortcuts docs](https://multiviewer.app/docs/usage/keyboard-shortcuts), [iMore](https://www.imore.com/music-movies-tv/multiviewer-for-f1-the-fan-built-formula-1-app-so-popular-even-f1-teams-use-it), [Apex Bite](https://apexbite.com/education/f1-multiviewer/).

| # | Feature | What it does | Needs FOM/broadcast metadata? |
|---|---|---|---|
| 1 | Multi-stream sync | N streams side-by-side, re-sync on buffer | No |
| 2 | One-click setups | Saves layouts; auto-restores | No |
| 3 | DRM player (Widevine) | Plays F1TV streams | Yes (license) |
| 4 | Driver onboards | Per-car cam | Yes |
| 5 | Telemetry overlay | Speed/throttle/brake/gear/RPM/DRS on onboard | **Yes** |
| 6 | Live timing table | Pos/gap/sector/tyre/pit | Yes |
| 7 | Mini-sector timing | Sub-sector deltas | Yes |
| 8 | Track map V2 | Cars on map + pit/sectors/DRS/speed traps | Yes |
| 9 | Marshal sectors | Yellow/green/red overlays | Yes |
| 10 | Race control msgs | Color-coded with icons | Yes |
| 11 | Race Trace | Lap-by-lap gap chart, pit predictions | Yes |
| 12 | Lap Time Series | All driver laps + tyres | Yes |
| 13 | Theoretical best lap | Sum of best sectors | Yes |
| 14 | Investigations tracker | FIA penalty state | Yes |
| 15 | AI radio transcripts (live + replay) | STT on team radios | Yes |
| 16 | AI document summaries | FIA docs | Yes |
| 17 | "No spoilers" catalog | Text-only, hides results | No |
| 18 | Click-to-highlight | Pin driver across panes | No (UX) |
| 19 | Top-3/5/10 filters | Auto-select leaders | Yes (data) |
| 20 | Light mode / driver colors | Theming, colorblind | No |
| 21 | Keyboard shortcuts | `S` sync, `T` telemetry, `D` debug, `L` latency | No |
| 22 | PiP / window snapping | Free-floating panes | No |
| 23 | Replay mode + sync replay | Re-watch with live-timing replayed | Yes (archive) |
| 24 | Pit-stop popout | Stop times via tyre icon | Yes |
| 25 | Watch parties (early access) | Synced group view | No |
| 26 | Multi-series (F1/F2/F3/IndyCar/NASCAR/WEC) | Same shell | Per-series feed |
| 27 | Public API + plugin extensions | Devs build on top | Partial |
| 28 | Stream settings memory | Volume/mute per window | No |
| 29 | Predictions popout | Standings sims | Yes |
| 30 | Transparent track map | Easier resize | No |

**Reality check:** ~22 of 30 features depend on FOM's structured live-timing feed. Strip that and you're left with the *shell* (multi-stream sync, layouts, theming, no-spoilers, watch parties, plugin model), not the *content*.

## 2. Golf adaptation table

Data-source assumptions:
- **Public scraping** — TOURCast `holeview.json` ([Lohec](http://alexlohec.com/posts/2021-04-14-scrape/), [shotscraper](https://github.com/Pratted/shotscraper)); leaderboard HTML.
- **Paid APIs** — [DataGolf](https://datagolf.com/api-access) (live SG, 45 req/min), [SportsDataIO](https://sportsdata.io/developers/api-documentation/golf), [Sportradar](https://developer.sportradar.com/golf/reference/golf-overview), [Rolling Insights](https://rolling-insights.com/datafeeds/pga-api/).
- **Closed** — official ShotLink raw data ([PGA Tour ShotLink](https://www.pgatour.com/shotlink), syndication only).
- **Streams** — PGA Tour Live (ESPN+, 4 feeds: Main / Marquee / 2 Featured Groups / Featured Holes); Peacock NBC windows. All DRM-locked.

Effort: S=hours, M=days, L=weeks, XL=months. Value 1–5.

| MV feature | Golf adaptation | Data source | Effort | Value | Priority |
|---|---|---|---|---|---|
| Multi-stream sync | Side-by-side ESPN+ groups + Marquee + Main | User subs; YT for free events | M | 5 | v1 |
| Saveable layouts | "Sunday at the Masters" preset | Local JSON | S | 5 | **v0.x** |
| DRM player | ESPN+/Peacock inside Teebox | Widevine + license | XL — blocked | 5 | OOS |
| Driver onboards | Player tracking cam / Marquee per-player | ESPN+ Marquee | M | 4 | v1 |
| Telemetry overlay | Shot trace overlay (club/dist/SG) | DataGolf + scrape | L | 5 | v1.x |
| Live timing table | Live leaderboard (have v0) | Adapter extension | S | 5 | **v0.x** |
| Mini-sector timing | Shot-by-shot SG stream | TOURCast + DataGolf | L | 4 | v1.x |
| Track map | Hole map + ball positions | TOURCast hole/shot coords | M | 5 | v1 |
| Marshal sectors | "Hole heat map" — scoring avg vs par now | Aggregate live scoring | M | 3 | v1.x |
| Race control msgs | Tournament alerts (weather, suspension, DQ) | RSS/scrape + Twitter | S | 3 | v1 |
| Race Trace | "Position Trace" — leaderboard pos over time | Snapshot scoring N min | M | 4 | v1 |
| Lap Time Series | "Round Score Series" — score per hole grid | Live scoring | S | 4 | **v0.x** |
| Theoretical best | "Theoretical low round" | Live scoring | S | 2 | v1.x |
| Investigations | Rules officials review tracker | Manual/RSS | M | 1 | OOS |
| AI radio transcripts | AI player/caddie audio transcripts | Broadcast audio + Whisper | XL — copyright | 3 | OOS |
| AI doc summaries | Weather/rules/notes-to-players summary | Tournament notes scrape | M | 2 | v2 |
| No-spoilers mode | Hide leaderboard/cut/totals/thumbs | UX | S | 4 | **v0.x** |
| Click-to-highlight | Pin player across leaderboard + grid + map | UX | S | 5 | **v0.x** |
| Top-3/5/10 filters | Same | Existing data | S | 4 | **v0.x** |
| Light mode / colors | Theming | UX | S | 2 | v1 |
| Keyboard shortcuts | `S` sync, `H` highlight, `L` leaderboard toggle | UX | S | 3 | v1 |
| PiP / window snap | Resizable panes (50/50 today) | CSS grid | M | 4 | v1 |
| Replay mode | Re-watch round with synced leaderboard at that minute | Snapshot scoring; sync to YT timestamp | L | 4 | v1.x |
| Pit-stop popout | Pre-shot routine timer | TOURCast timing | M | 1 | OOS |
| Watch parties | Synced group-watch | WebRTC | L | 3 | v2 |
| Multi-series | Adapters: PGA, LIV, DP World, LPGA, KFT, Asian | Per-tour adapter | M each | 5 | **v0.x** ongoing |
| Public API + plugins | Adapter contract is the seed (SPEC.md) | Existing | S | 4 | **v0.x** |
| Stream settings memory | Vol/mute per stream | localStorage | S | 2 | v1 |
| Predictions popout | Live win-prob (DataGolf) | DataGolf API | S | 4 | v1 |
| Transparent overlay | Translucent leaderboard over video | CSS | S | 3 | v1 |

## 3. Top 5 highest-value, lowest-effort features

Given v0 is YT + scraped leaderboard, cheapest wins:

1. **Saveable layouts (v0.x, S, V5)** — Persist `{youtubeUrl, adapterId, customUrl, paneSizes}` to `localStorage`. Named presets ("Masters Sunday", "PGA Featured", "All-Thailand Final"). MV's most-loved feature; no new data.
2. **Click-to-highlight + top-N filter (v0.x, S, V5)** — Click a row → pins, colors, filter to leaders. Works on already-scraped data.
3. **Score-by-hole grid (v0.x, S, V4)** — Most adapters can give score per hole; render as golf's Lap Time Series. Tiny adapter extension.
4. **No-spoilers mode (v0.x, S, V4)** — Toggle blurs leaderboard, hides totals, hides thumbnails. Replicates MV's text-only catalog. Pure CSS/state.
5. **Adapter expansion (v0.x ongoing, S each, V5)** — PGA, LIV, DP World, LPGA, KFT. Architecture supports it; ship five more. MV's *same shell* across F1/F2/F3/IndyCar/NASCAR/WEC validates this design.

All v0.x, no new data dependencies, captures most of the achievable MV-feel.

## 4. Top 3 "cool but probably impossible"

1. **Live telemetry overlay** (MV's flagship). FOM publishes a live-timing socket at ~tens-of-Hz with per-car speed/throttle/brake/gear/RPM/DRS. Golf's analog — club, ball speed, launch, spin, distance — is captured by Trackman/broadcast graphics but **not exposed as a public live feed**. ShotLink captures [256k data points/week](https://www.pgatour.com/shotlink) but is syndication-only; SG calc is closed. DataGolf has live SG aggregates, not telemetry-grade per-shot sync. **OOS** until PGA Tour opens a developer tier.
2. **DRM-locked broadcast inside Teebox**. MV plays F1TV because it ships Widevine and has a working F1 relationship (teams reportedly use it). ESPN+/Peacock won't license third-party DRM playback. Teebox can link to streams or embed YT, but cannot play ESPN+/Peacock directly. **OOS**; design multi-stream around user-provided streams.
3. **AI player/caddie radio transcripts**. F1 broadcasts driver radio as a discrete audio track. Golf picks up player/caddie audio sporadically via shotgun mics with no isolated stream. Even transcribing broadcast audio yields low value-density (one snippet per 90s vs continuous F1 radio). **OOS** unless a broadcaster ships an isolated mic feed.

## 5. Implications for Teebox roadmap

- **Lean into the shell, not the telemetry.** Teebox's defensible product is the *layout-driven adapter shell* — same architectural bet MV made. The data-overlay arms race is mostly unwinnable in golf.
- **The adapter pattern in [`SPEC.md`](../../SPEC.md) is already the right primitive** — it's MV's multi-series model on day one. Ship adapters aggressively.
- **DataGolf is the single most useful paid API** for any "telemetry-lite" overlays (live SG, win prob, position-over-time). Cheap, well-documented.
- **Don't build replay/multi-stream until v1+** — sync is real engineering, and golf streams are DRM-locked.
- **The 5 v0.x features above are 1–2 weeks of work and capture ~60% of the MV vibe** without touching telemetry, DRM, or paid APIs.

## Sources

- <https://multiviewer.app/> · <https://multiviewer.app/changelog> · <https://multiviewer.app/docs/usage/keyboard-shortcuts>
- <https://www.imore.com/music-movies-tv/multiviewer-for-f1-the-fan-built-formula-1-app-so-popular-even-f1-teams-use-it>
- <https://apexbite.com/education/f1-multiviewer/>
- <https://www.pgatour.com/shotlink> · <https://www.pgatour.com/tourcast/about>
- <http://alexlohec.com/posts/2021-04-14-scrape/> · <https://github.com/Pratted/shotscraper>
- <https://datagolf.com/api-access> · <https://sportsdata.io/developers/api-documentation/golf> · <https://developer.sportradar.com/golf/reference/golf-overview> · <https://rolling-insights.com/datafeeds/pga-api/>
- <https://www.golfdigest.com/story/players-championship-2026-how-to-watch-tpc-sawgrass-viewers-guide-tv-listings-streaming-times>
