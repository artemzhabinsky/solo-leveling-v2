# Sololeveling Tracker — Design

Date: 2026-07-27
Status: Approved (brainstorming phase)

## Summary

A gamified personal productivity SPA themed after the "System" from Solo Leveling.
The player is a Goblin who evolves through 7 visual stages and 30 named ranks
(level 1 → 30+) by completing tasks. Progress (level, XP, coins, attributes) is
stored in Supabase (Postgres) with a LocalStorage cache/queue for offline use.
Single-user for now (no login screen), but the data model reserves a `user_id`
column so Supabase Auth can be added later without a schema rewrite.

## Non-goals (for this spec)

- Authentication / multi-user support — deferred, schema just leaves room for it.
- Final visual design (color palette, typography, exact component styling) —
  deliberately **not** specified here. It will be produced from scratch during
  implementation using the installed design skills (`frontend-design`,
  `ui-ux-pro-max`, `web-design-guidelines`). Nothing from the earlier discarded
  prototype should be reused.
- Vercel project creation itself — the design assumes Vercel deployment, but the
  actual "connect repo" / credentials step happens at implementation time.

## Architecture

- **Frontend**: React + Vite SPA.
- **Backend**: Supabase (Postgres) via `@supabase/supabase-js`, used directly from
  the client (no custom server) — RLS is left permissive for now since there's no
  auth yet, structured so it's easy to tighten once auth exists.
- **Offline strategy**: Supabase is the source of truth. Every write also mirrors
  to LocalStorage. When offline, writes land only in a LocalStorage
  `pending_sync` queue (table, operation, payload, timestamp) and are replayed
  against Supabase in order once connectivity returns (`online` event + periodic
  retry). Conflict resolution is last-write-wins — acceptable because this is a
  single-user, effectively single-session app.
- **Deployment**: Vercel, connected to the GitHub repo for auto-deploy on push to
  `main` (matches the existing auto-push-per-commit workflow already configured
  for this project).

## Data model (Supabase)

### `profiles` (single row for now)
| column | type | notes |
|---|---|---|
| id | uuid, pk | |
| user_id | uuid | fixed constant for now; placeholder for future auth |
| level | int, default 1 | |
| xp | int, default 0 | XP within the current level (post level-up remainder) |
| coins | int, default 0 | |
| hp | int, default 3 | 0-3 |
| attr_str, attr_int, attr_vit, attr_gold, attr_disc | int, default 0 | grown only by completed task categories |
| last_hp_check_date | date | drives the once-a-day HP penalty check |
| created_at, updated_at | timestamptz | |

No separate "stat points" pool — attributes are purely the sum of completed-task
category rewards (design decision: rejected the manual-allocation variant to
avoid a redundant screen/state).

### `tasks`
id, title, category (`physical`/`mental`/`spirit`/`finance`/`discipline` — maps
1:1 to STR/INT/VIT/GOLD/DISC), rank (`E`/`D`/`C`/`B`/`A`/`S`), xp_reward,
coin_reward, status (`todo`/`in_progress`/`done`), due_date, completed_at,
created_at, updated_at.

Rank → reward table (constants, editable):
| Rank | XP | Coins |
|---|---|---|
| E | 50 | 10 |
| D | 100 | 20 |
| C | 250 | 50 |
| B | 500 | 100 |
| A | 1000 | 200 |
| S | 2500 | 500 |

### `daily_quests`
id, title, last_completed_date (nullable date — "done today" iff equal to
today), is_active (bool). User-authored and edited freely; a quest is not
recreated each day, its "done" status is simply date-derived, which is what
makes it recurring/looping without extra bookkeeping.

### `shop_rewards` (user-authored catalog of "хотелки")
id, title, cost_coins, created_at.

### `user_inventory`
id, shop_reward_id (fk), purchased_at, expires_at (`purchased_at + 24h`),
used_at (nullable), status (`active`/`used`/`expired`).

### `analytics_logs` (append-only, never wiped by penalty reset)
id, log_date, xp_gained, tasks_completed, category_breakdown (jsonb: counts per
category that day), created_at. Upserted per day as tasks complete.

### `system_events`
id, event_type (`penalty_reset` for now), occurred_at. Lets the XP line chart
plot the "death" as a visible drop instead of the history silently vanishing.

## Leveling & ranks

- `XP_req(level) = floor(100 * level^1.5)`.
- On XP award: while `xp >= XP_req(level)`, subtract the threshold and
  increment level (handles a single S-rank task crossing multiple levels).
- 30 named ranks/titles (from the ТЗ table) map 1:1 to levels 1-30. Level 30+
  keeps showing the level-30 title ("Гигачат Гоблин-Трахатель 30-го Уровня")
  regardless of how high the numeric level climbs further.
- `GoblinAvatar` maps level to 1 of 7 visual stages (per the ТЗ level ranges).
  Visual implementation: hand-authored SVG/CSS caricatures (not AI-generated
  images) — one component per stage, actual illustration/styling produced
  during implementation via `frontend-design`.

## HP & penalty

- On app load, compare `profiles.last_hp_check_date` to today. For each full
  calendar day strictly between that date and today (inclusive of yesterday,
  exclusive of today — today is still in progress), check whether any
  `daily_quests` were completed that day; if zero were completed, apply
  `hp -= 1` for that day. Stop early if `hp` reaches 0 (penalty triggers
  immediately, remaining missed days aren't further over-subtracted). Advance
  `last_hp_check_date` to today once processed. This correctly handles gaps of
  several days without opening the app, not just a single missed day.
- `hp === 0` triggers a full-screen "SYSTEM PENALTY: YOU DIED" screen, then a
  **full reset**: level=1, xp=0, coins=0, hp=3, all attributes=0,
  `user_inventory` cleared. `analytics_logs` and a new `system_events` row are
  preserved/created so history and the death event remain visible on the XP
  line chart.

## Level-up popup

On any XP award, recompute level. If the new level is higher than the old one,
show a modal: new level, new rank title (from the 30-rank table), and the
updated `GoblinAvatar` if the stage changed. If a single award crosses several
levels, the popup shows only the final level reached (no per-level replay).
Dismissible.

## Sound effects

Two events: task completion, level-up. No external audio files/licensing —
both are synthesized at runtime via the Web Audio API (short oscillator-based
"system" blip for task completion, a fuller chord/fanfare for level-up). Zero
asset weight, fits the "System" HUD aesthetic.

## Task tracker

Shared task state (Supabase + LocalStorage cache) rendered through 3 views:
- **List** — filter/sort by rank, category, status.
- **Kanban** — todo/in_progress/done columns, drag-and-drop via `@dnd-kit`.
- **Calendar** — month grid keyed on `due_date`.

Creating a task: title, category (5 fixed options), rank (auto-fills
xp/coin reward from the table above). Completing a task: awards XP/coins,
increments the relevant attribute, and upserts today's `analytics_logs` row
(xp_gained, tasks_completed, category_breakdown[category] += 1). Triggers the
task-completion sound and, if it crossed a level, the level-up popup + sound.

A separate **Daily Quests** panel: its own CRUD (add/remove/deactivate), a
"done today" checkbox that flips `last_completed_date` to today.

## Shop

You populate `shop_rewards` yourself (title + coin cost). Purchasing checks
`coins >= cost_coins`, deducts coins, inserts a `user_inventory` row with
`expires_at = now + 24h`. Inventory items show a live countdown; once expired
and unused, status flips to `expired` (kept, not deleted). A "use" action sets
`used_at` and removes the item from the active/spendable list before expiry.

## Analytics

- **Radar** — current `attr_*` values, 5 axes.
- **Line** — `xp_gained` per day from `analytics_logs` (default: last 7 days),
  annotated with `system_events` (penalty) markers as visible drops.
- **Donut** — `category_breakdown` totals for the selected period (default:
  current week) as a 5-category share.

## Open items for implementation time (not blocking this spec)

- Exact visual design (palette/typography/layout) — produced fresh via the
  design skills, not carried over from the earlier discarded prototype.
- Vercel project connection / credentials.
- Mobile adaptation — desktop-first build initially; a dedicated
  responsive/mobile pass (touch targets, Kanban/Calendar layout on small
  screens, etc.) is planned as a follow-up phase after the desktop version is
  working, not part of the initial implementation plan.
