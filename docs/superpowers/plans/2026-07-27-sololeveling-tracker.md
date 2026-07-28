# Sololeveling Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Sololeveling Tracker SPA per `docs/superpowers/specs/2026-07-27-sololeveling-tracker-design.md` — a gamified task tracker with Supabase persistence, a 7-stage Goblin avatar, XP/leveling/HP mechanics, a 3-view task tracker, a shop with expiring inventory, and analytics charts.

**Architecture:** React + Vite SPA, Zustand for state, `@supabase/supabase-js` as source of truth with a LocalStorage cache + offline write queue, Chart.js for analytics, `@dnd-kit` for the Kanban view. Pure domain logic (XP math, ranks, rewards, HP penalty, kanban/calendar grouping, analytics shaping) is isolated in `src/domain/*` so it can be unit tested without React or Supabase.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, Zustand, `@supabase/supabase-js`, Chart.js + `react-chartjs-2`, `@dnd-kit/core` + `@dnd-kit/sortable`, `date-fns`, `react-router-dom`, Vitest + React Testing Library.

## Global Constraints

- No authentication in this phase. Single fixed profile row identified by the constant UUID `00000000-0000-0000-0000-000000000001`, used consistently in the schema seed and client code so Supabase Auth can be layered in later.
- Visual design (palette, typography, component styling) is **not** decided by this plan. Task 25 explicitly invokes the `frontend-design` / `ui-ux-pro-max` / `web-design-guidelines` skills to produce it from scratch — nothing from the earlier discarded prototype is reused.
- All charts use Chart.js (`react-chartjs-2`), per spec.
- Sound effects are synthesized at runtime via the Web Audio API — no audio asset files.
- Mobile/responsive adaptation is explicitly out of scope for this plan (deferred follow-up phase per spec).
- Every commit triggers an automatic `git push` via the repo's `post-commit` hook — just commit normally, do not run `git push` manually.
- Supabase DDL cannot be applied programmatically (no service-role key / DB connection string available, only the anon/publishable key) — applying `supabase/schema.sql` is a manual dashboard step (Task 27).

---

## File Structure

```
src/
  main.jsx
  App.jsx                              — router + layout shell (Task 25)
  index.css                            — Tailwind entry, styled in Task 25
  lib/
    supabaseClient.js                  — Supabase client singleton (Task 2)
  domain/                              — pure logic, no React/Supabase imports
    xp.js / xp.test.js                 — Task 3
    ranks.js / ranks.test.js           — Task 4
    rewards.js / rewards.test.js       — Task 5
    categories.js / categories.test.js — Task 5
    goblinStages.js / .test.js         — Task 6
    hpPenalty.js / .test.js            — Task 7
    analyticsLog.js / .test.js         — Task 14
    kanban.js / .test.js               — Task 19
    calendar.js / .test.js             — Task 20
    countdown.js / .test.js            — Task 22
    analyticsView.js / .test.js        — Task 23
  services/
    localStore.js / .test.js           — Task 8
    syncQueue.js / .test.js            — Task 8
    dataService.js / .test.js          — Task 9
    bootstrap.js / .test.js            — Task 26
  state/
    useProfileStore.js / .test.js      — Task 10
    useTaskStore.js / .test.js         — Task 15
    useDailyQuestStore.js / .test.js   — Task 16
    useShopStore.js / .test.js         — Task 17
  audio/
    sfx.js / .test.js                  — Task 12
  components/
    avatar/
      GoblinAvatar.jsx / .test.jsx     — Task 11
      stages/Stage1.jsx ... Stage7.jsx — Task 11
    profile/
      LevelUpModal.jsx / .test.jsx     — Task 12
      PenaltyScreen.jsx / .test.jsx    — Task 13
      ProfileHeader.jsx / .test.jsx    — Task 24
    tasks/
      TaskForm.jsx                     — Task 18
      TaskListView.jsx / .test.jsx     — Task 18
      TaskKanbanView.jsx / .test.jsx   — Task 19
      TaskCalendarView.jsx / .test.jsx — Task 20
      DailyQuestsPanel.jsx / .test.jsx — Task 21
    shop/
      ShopView.jsx / .test.jsx         — Task 22
      InventoryItem.jsx                — Task 22
    analytics/
      RadarChart.jsx                   — Task 23
      XpLineChart.jsx                  — Task 23
      CategoryDonutChart.jsx           — Task 23
  pages/
    DashboardPage.jsx, TasksPage.jsx, ShopPage.jsx, AnalyticsPage.jsx — Task 25
supabase/
  schema.sql                          — Task 2
```

---

### Task 1: Project scaffold, Tailwind, and test tooling

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`, `src/setupTests.js`, `.oxlintrc.json`
- Test: `src/App.test.jsx`

**Interfaces:**
- Produces: `<App />` default export from `src/App.jsx` (React component, no props). `npm run dev`, `npm run build`, `npm test` scripts.

- [ ] **Step 1: Scaffold Vite + React into a scratch dir, then copy into the project root**

The project root already has `.git`, `.claude`, `.agents`, `.mcp.json`, `.env`, `docs/` — `create-vite` refuses to scaffold into a non-empty directory non-interactively. Scaffold into a scratch dir first, then copy the generated files in.

```bash
SCRATCH="$(mktemp -d)"
cd "$SCRATCH" && npm create vite@latest app -- --template react
cp -R "$SCRATCH/app/public" "/Users/39apple.ru/Desktop/Sololeveling Task/public"
cp -R "$SCRATCH/app/src" "/Users/39apple.ru/Desktop/Sololeveling Task/src"
cp "$SCRATCH/app/index.html" "$SCRATCH/app/vite.config.js" "$SCRATCH/app/package.json" "/Users/39apple.ru/Desktop/Sololeveling Task/"
```

- [ ] **Step 2: Remove template placeholder content**

Delete `src/App.css`, `src/assets/react.svg`, `src/assets/vite.svg`, any placeholder `hero.png`, `public/vite.svg`. Set `package.json` `"name"` to `"sololeveling-tracker"`.

- [ ] **Step 3: Install dependencies**

```bash
npm install @supabase/supabase-js zustand react-router-dom @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities chart.js react-chartjs-2 date-fns tailwindcss @tailwindcss/vite
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 4: Configure Vite for React + Tailwind + Vitest**

`vite.config.js`:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    globals: true,
  },
})
```

`src/setupTests.js`:
```js
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 5: Add the `test` script**

In `package.json` `"scripts"`, add `"test": "vitest run"` (and keep `"dev"`, `"build"`, `"preview"` from the template).

- [ ] **Step 6: Write minimal `src/index.css` (Tailwind entry only, no theme yet)**

```css
@import 'tailwindcss';
```

- [ ] **Step 7: Write minimal `src/App.jsx`**

```jsx
function App() {
  return <div>Sololeveling Tracker</div>
}

export default App
```

`src/main.jsx`:
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 8: Write the failing smoke test**

`src/App.test.jsx`:
```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App.jsx'

describe('App', () => {
  it('renders the app title', () => {
    render(<App />)
    expect(screen.getByText('Sololeveling Tracker')).toBeInTheDocument()
  })
})
```

- [ ] **Step 9: Run the test suite**

Run: `npm test`
Expected: PASS (1 test) — this proves the Vite + Vitest + RTL pipeline works end to end.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json vite.config.js index.html src public .oxlintrc.json
git commit -m "chore: scaffold Vite+React project with Tailwind and Vitest"
```

---

### Task 2: Supabase schema and client

**Files:**
- Create: `supabase/schema.sql`, `src/lib/supabaseClient.js`
- Test: `src/lib/supabaseClient.test.js`

**Interfaces:**
- Produces: `SUPABASE_PROFILE_ID` (exported string constant, the fixed UUID), `supabase` (default export, configured `SupabaseClient` instance) from `src/lib/supabaseClient.js`.

- [ ] **Step 1: Write `supabase/schema.sql`**

```sql
-- Sololeveling Tracker schema. Apply manually in the Supabase SQL editor (Task 27).
create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key default '00000000-0000-0000-0000-000000000001',
  user_id uuid not null default '00000000-0000-0000-0000-000000000001',
  level int not null default 1,
  xp int not null default 0,
  coins int not null default 0,
  hp int not null default 3 check (hp >= 0 and hp <= 3),
  attr_str int not null default 0,
  attr_int int not null default 0,
  attr_vit int not null default 0,
  attr_gold int not null default 0,
  attr_disc int not null default 0,
  last_hp_check_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into profiles (id) values ('00000000-0000-0000-0000-000000000001')
  on conflict (id) do nothing;

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('physical','mental','spirit','finance','discipline')),
  rank text not null check (rank in ('E','D','C','B','A','S')),
  xp_reward int not null,
  coin_reward int not null,
  status text not null default 'todo' check (status in ('todo','in_progress','done')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists daily_quests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  last_completed_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists shop_rewards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  cost_coins int not null check (cost_coins > 0),
  created_at timestamptz not null default now()
);

create table if not exists user_inventory (
  id uuid primary key default gen_random_uuid(),
  shop_reward_id uuid references shop_rewards(id) on delete set null,
  purchased_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  status text not null default 'active' check (status in ('active','used','expired'))
);

create table if not exists analytics_logs (
  id uuid primary key default gen_random_uuid(),
  log_date date not null unique,
  xp_gained int not null default 0,
  tasks_completed int not null default 0,
  category_breakdown jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists system_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  occurred_at timestamptz not null default now()
);

-- RLS left permissive for now (no auth yet). Revisit when Supabase Auth is added.
alter table profiles enable row level security;
alter table tasks enable row level security;
alter table daily_quests enable row level security;
alter table shop_rewards enable row level security;
alter table user_inventory enable row level security;
alter table analytics_logs enable row level security;
alter table system_events enable row level security;

create policy "public read/write" on profiles for all using (true) with check (true);
create policy "public read/write" on tasks for all using (true) with check (true);
create policy "public read/write" on daily_quests for all using (true) with check (true);
create policy "public read/write" on shop_rewards for all using (true) with check (true);
create policy "public read/write" on user_inventory for all using (true) with check (true);
create policy "public read/write" on analytics_logs for all using (true) with check (true);
create policy "public read/write" on system_events for all using (true) with check (true);
```

- [ ] **Step 2: Write `src/lib/supabaseClient.js`**

```js
import { createClient } from '@supabase/supabase-js'

export const SUPABASE_PROFILE_ID = '00000000-0000-0000-0000-000000000001'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

export default supabase
```

- [ ] **Step 3: Write the failing test**

`src/lib/supabaseClient.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('supabaseClient', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')
    vi.resetModules()
  })

  it('exports a configured client and the fixed profile id', async () => {
    const { supabase, SUPABASE_PROFILE_ID } = await import('./supabaseClient.js')
    expect(supabase).toBeDefined()
    expect(typeof supabase.from).toBe('function')
    expect(SUPABASE_PROFILE_ID).toBe('00000000-0000-0000-0000-000000000001')
  })
})
```

- [ ] **Step 4: Run test to verify it fails, then passes**

Run: `npm test -- src/lib/supabaseClient.test.js`
Before Step 2 exists: FAIL (module not found). After: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/schema.sql src/lib/supabaseClient.js src/lib/supabaseClient.test.js
git commit -m "feat: add Supabase schema and client"
```

---

### Task 3: XP and leveling domain logic

**Files:**
- Create: `src/domain/xp.js`, `src/domain/xp.test.js`

**Interfaces:**
- Produces: `xpRequiredForLevel(level: number): number`, `applyXp(profile: {level:number, xp:number}, xpGained: number): {level:number, xp:number, previousLevel:number, leveledUp:boolean}`.

- [ ] **Step 1: Write the failing tests**

```js
import { describe, it, expect } from 'vitest'
import { xpRequiredForLevel, applyXp } from './xp.js'

describe('xpRequiredForLevel', () => {
  it('computes floor(100 * level^1.5)', () => {
    expect(xpRequiredForLevel(1)).toBe(100)
    expect(xpRequiredForLevel(2)).toBe(282)
    expect(xpRequiredForLevel(10)).toBe(3162)
  })
})

describe('applyXp', () => {
  it('adds xp without leveling up when below threshold', () => {
    const result = applyXp({ level: 1, xp: 0 }, 50)
    expect(result).toEqual({ level: 1, xp: 50, previousLevel: 1, leveledUp: false })
  })

  it('levels up once when xp crosses the threshold', () => {
    const result = applyXp({ level: 1, xp: 90 }, 20)
    // level 1 requires 100 xp; 90+20=110 -> level 2 with 10 remainder
    expect(result).toEqual({ level: 2, xp: 10, previousLevel: 1, leveledUp: true })
  })

  it('crosses multiple levels from a single large award', () => {
    const result = applyXp({ level: 1, xp: 0 }, 500)
    // level1 needs 100 (remainder 400), level2 needs 282 (remainder 118), level3 needs 519 (118 < 519, stop)
    expect(result).toEqual({ level: 3, xp: 118, previousLevel: 1, leveledUp: true })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/domain/xp.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```js
export function xpRequiredForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5))
}

export function applyXp(profile, xpGained) {
  let level = profile.level
  let xp = profile.xp + xpGained
  const previousLevel = level

  while (xp >= xpRequiredForLevel(level)) {
    xp -= xpRequiredForLevel(level)
    level += 1
  }

  return { level, xp, previousLevel, leveledUp: level > previousLevel }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/domain/xp.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/xp.js src/domain/xp.test.js
git commit -m "feat: add XP and leveling domain logic"
```

---

### Task 4: Ranks and titles

**Files:**
- Create: `src/domain/ranks.js`, `src/domain/ranks.test.js`

**Interfaces:**
- Produces: `RANKS` (array of 30 `{level:number, title:string, description:string}`, ordered by level ascending), `getRankTitle(level: number): {level:number, title:string, description:string}` (clamps to the level-30 entry for any level >= 30).

- [ ] **Step 1: Write the failing tests**

```js
import { describe, it, expect } from 'vitest'
import { RANKS, getRankTitle } from './ranks.js'

describe('RANKS', () => {
  it('has exactly 30 entries ordered by level', () => {
    expect(RANKS).toHaveLength(30)
    RANKS.forEach((r, i) => expect(r.level).toBe(i + 1))
  })
})

describe('getRankTitle', () => {
  it('returns the level-1 title', () => {
    expect(getRankTitle(1).title).toBe('Нищий Гоблин-Оборванец')
  })

  it('returns the level-30 title verbatim', () => {
    expect(getRankTitle(30).title).toBe('Гигачат Гоблин-Трахатель 30-го Уровня')
  })

  it('clamps levels above 30 to the level-30 title', () => {
    expect(getRankTitle(45).title).toBe('Гигачат Гоблин-Трахатель 30-го Уровня')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/domain/ranks.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```js
export const RANKS = [
  { level: 1, title: 'Нищий Гоблин-Оборванец', description: 'Грезит о великих делах в рваных трусах с деревянной ложкой.' },
  { level: 2, title: 'Гоблин с Картонным Щитом', description: 'Нашел коробку от микроволновки. Считает себя рыцарем.' },
  { level: 3, title: 'Диванный Воин Подъезда', description: 'Раздаёт советы в интернете, не вставая с дивана.' },
  { level: 4, title: 'Новичок Прокрастинации', description: 'Переносит задачи «на завтра» быстрее скорости света.' },
  { level: 5, title: 'Собиратель Мелких Скидок', description: 'Знает где взять просроченный сырок и выпросить балл.' },
  { level: 6, title: 'Охотник за Бесплатным Wi-Fi', description: 'Готов пройти 5 км ради одной полоски интернета.' },
  { level: 7, title: 'Мастер Доширачных Искусств', description: 'Заваривает лапшу за 2 минуты 59 секунд.' },
  { level: 8, title: 'Воин Кофейного Передоза', description: '5-я чашка растворимого кофе. Глаз дёргается, но работает.' },
  { level: 9, title: 'Собиратель Просроченных Дедлайнов', description: 'Жонглирует горящими дедлайнами без страха.' },
  { level: 10, title: 'Охотник E-Ранга (Выживший)', description: 'Появился тёмный плащ и неоновый блеск в глазах.' },
  { level: 11, title: 'Гроза Домашних Тараканов', description: 'Тапочек в его руке — артефакт S-ранга.' },
  { level: 12, title: 'Пожиратель Ночных Снеков', description: 'Вылазки к холодильнику проходят бесшумно.' },
  { level: 13, title: 'Властелин Будильников', description: '15 будильников с интервалом 5 минут. Почти проснулся.' },
  { level: 14, title: 'Повелитель Перерывов на Чай', description: '10 минут работы, 45 минут выбора чая.' },
  { level: 15, title: 'Теневой Уборщик Комнаты', description: 'Раз в месяц сгребает все вещи под кровать.' },
  { level: 16, title: 'Воин Отложенных Сообщений', description: 'Отвечает «Сейчас посмотрю» спустя 4 дня.' },
  { level: 17, title: 'Гладиатор Экспресс-Учёбы', description: 'Выучил семестр за 3 часа до экзамена.' },
  { level: 18, title: 'Охотник D-Ранга (Уверенный)', description: 'В глазах блеск Системы, появилась аура.' },
  { level: 19, title: 'Властелин Гаджетов на Зарядке', description: 'Одновременно заряжает все гаджеты в доме.' },
  { level: 20, title: 'Рыцарь Тёмного Энергетика', description: 'Кровь состоит на 40% из таурина. Не спит, а перезагружается.' },
  { level: 21, title: 'Охотник C-Ранга (Теневой Кадет)', description: 'Тень начинает слушать команды. Осанка идеальна.' },
  { level: 22, title: 'Укротитель Бытовых Монстров', description: 'Гора посуды в раковине больше не пугает.' },
  { level: 23, title: 'Бегущий по Дедлайнам', description: 'Режим гиперскорости за 10 минут до созвона.' },
  { level: 24, title: 'Магистр Таблиц Excel', description: 'Управляет жизнью через формулы и ячейки.' },
  { level: 25, title: 'Охотник B-Ранга (Теневой Рыцарь)', description: 'Фиолетовая аура, стальной клинок, дисциплина.' },
  { level: 26, title: 'Архитектор Продуктивности', description: 'Строит империю из выполненных задач.' },
  { level: 27, title: 'Гигачад Утренней Зарядки', description: 'Делает отжимания до открытия глаз.' },
  { level: 28, title: 'Охотник A-Ранга (Теневой Лорд)', description: 'Задачи выполняются от одного его взгляда.' },
  { level: 29, title: 'Разрушитель Лени S-Ранга', description: 'Лень при виде него уходит в депрессию.' },
  { level: 30, title: 'Гигачат Гоблин-Трахатель 30-го Уровня', description: 'Пик эволюции. Занимает весь экран прессом и величием.' },
]

export function getRankTitle(level) {
  const clamped = Math.min(Math.max(level, 1), 30)
  return RANKS[clamped - 1]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/domain/ranks.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/ranks.js src/domain/ranks.test.js
git commit -m "feat: add 30-rank title table"
```

---

### Task 5: Task rank rewards and categories

**Files:**
- Create: `src/domain/rewards.js`, `src/domain/rewards.test.js`, `src/domain/categories.js`, `src/domain/categories.test.js`

**Interfaces:**
- Produces: `RANK_REWARDS` (object keyed `E`/`D`/`C`/`B`/`A`/`S` → `{xp:number, coins:number}`), `getReward(rank: string): {xp:number, coins:number}`.
- Produces: `CATEGORIES` (array of 5 `{key:string, attr:string, label:string}`), `getAttrForCategory(category: string): string`.

- [ ] **Step 1: Write the failing tests for rewards**

```js
import { describe, it, expect } from 'vitest'
import { RANK_REWARDS, getReward } from './rewards.js'

describe('RANK_REWARDS', () => {
  it('has the 6 ranks with the spec values', () => {
    expect(RANK_REWARDS).toEqual({
      E: { xp: 50, coins: 10 },
      D: { xp: 100, coins: 20 },
      C: { xp: 250, coins: 50 },
      B: { xp: 500, coins: 100 },
      A: { xp: 1000, coins: 200 },
      S: { xp: 2500, coins: 500 },
    })
  })
})

describe('getReward', () => {
  it('returns the reward for a known rank', () => {
    expect(getReward('S')).toEqual({ xp: 2500, coins: 500 })
  })

  it('throws for an unknown rank', () => {
    expect(() => getReward('Z')).toThrow('Unknown rank: Z')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/domain/rewards.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/domain/rewards.js`**

```js
export const RANK_REWARDS = {
  E: { xp: 50, coins: 10 },
  D: { xp: 100, coins: 20 },
  C: { xp: 250, coins: 50 },
  B: { xp: 500, coins: 100 },
  A: { xp: 1000, coins: 200 },
  S: { xp: 2500, coins: 500 },
}

export function getReward(rank) {
  const reward = RANK_REWARDS[rank]
  if (!reward) throw new Error(`Unknown rank: ${rank}`)
  return reward
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/domain/rewards.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing tests for categories**

```js
import { describe, it, expect } from 'vitest'
import { CATEGORIES, getAttrForCategory } from './categories.js'

describe('CATEGORIES', () => {
  it('has 5 categories mapped 1:1 to attributes', () => {
    expect(CATEGORIES).toEqual([
      { key: 'physical', attr: 'attr_str', label: 'Физика' },
      { key: 'mental', attr: 'attr_int', label: 'Учёба/Работа' },
      { key: 'spirit', attr: 'attr_vit', label: 'Здоровье/Быт' },
      { key: 'finance', attr: 'attr_gold', label: 'Финансы' },
      { key: 'discipline', attr: 'attr_disc', label: 'Привычки/Рутина' },
    ])
  })
})

describe('getAttrForCategory', () => {
  it('returns the attribute column for a known category', () => {
    expect(getAttrForCategory('physical')).toBe('attr_str')
  })

  it('throws for an unknown category', () => {
    expect(() => getAttrForCategory('unknown')).toThrow('Unknown category: unknown')
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- src/domain/categories.test.js`
Expected: FAIL (module not found).

- [ ] **Step 7: Implement `src/domain/categories.js`**

```js
export const CATEGORIES = [
  { key: 'physical', attr: 'attr_str', label: 'Физика' },
  { key: 'mental', attr: 'attr_int', label: 'Учёба/Работа' },
  { key: 'spirit', attr: 'attr_vit', label: 'Здоровье/Быт' },
  { key: 'finance', attr: 'attr_gold', label: 'Финансы' },
  { key: 'discipline', attr: 'attr_disc', label: 'Привычки/Рутина' },
]

export function getAttrForCategory(category) {
  const entry = CATEGORIES.find((c) => c.key === category)
  if (!entry) throw new Error(`Unknown category: ${category}`)
  return entry.attr
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- src/domain/categories.test.js`
Expected: PASS (3 tests).

- [ ] **Step 9: Commit**

```bash
git add src/domain/rewards.js src/domain/rewards.test.js src/domain/categories.js src/domain/categories.test.js
git commit -m "feat: add rank rewards and task category tables"
```

---

### Task 6: Goblin evolution stage lookup

**Files:**
- Create: `src/domain/goblinStages.js`, `src/domain/goblinStages.test.js`

**Interfaces:**
- Produces: `STAGES` (array of 7 `{stage:number, minLevel:number, maxLevel:number|null, title:string}`), `getStageForLevel(level: number): number` (returns 1-7).

- [ ] **Step 1: Write the failing tests**

```js
import { describe, it, expect } from 'vitest'
import { STAGES, getStageForLevel } from './goblinStages.js'

describe('STAGES', () => {
  it('has 7 stages covering 1 through 30+', () => {
    expect(STAGES).toHaveLength(7)
    expect(STAGES[0]).toMatchObject({ stage: 1, minLevel: 1, maxLevel: 4 })
    expect(STAGES[6]).toMatchObject({ stage: 7, minLevel: 30, maxLevel: null })
  })
})

describe('getStageForLevel', () => {
  it.each([
    [1, 1], [4, 1],
    [5, 2], [9, 2],
    [10, 3], [14, 3],
    [15, 4], [19, 4],
    [20, 5], [24, 5],
    [25, 6], [29, 6],
    [30, 7], [100, 7],
  ])('level %i maps to stage %i', (level, expected) => {
    expect(getStageForLevel(level)).toBe(expected)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/domain/goblinStages.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```js
export const STAGES = [
  { stage: 1, minLevel: 1, maxLevel: 4, title: 'Нищий Гоблин-Оборванец' },
  { stage: 2, minLevel: 5, maxLevel: 9, title: 'Гоблин-Мусорщик / Картонный Рыцарь' },
  { stage: 3, minLevel: 10, maxLevel: 14, title: 'Охотник E-Ранга / Гоблин-Боец' },
  { stage: 4, minLevel: 15, maxLevel: 19, title: 'Охотник D-Ранга / Гоблин-Воин' },
  { stage: 5, minLevel: 20, maxLevel: 24, title: 'Охотник C-Ранга / Теневой Кадет' },
  { stage: 6, minLevel: 25, maxLevel: 29, title: 'Охотник A-Ранга / Теневой Рыцарь' },
  { stage: 7, minLevel: 30, maxLevel: null, title: 'Гигачат Гоблин-Трахатель 30-го Уровня (S-Ранг)' },
]

export function getStageForLevel(level) {
  const match = STAGES.find((s) => level >= s.minLevel && (s.maxLevel === null || level <= s.maxLevel))
  return match ? match.stage : STAGES[STAGES.length - 1].stage
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/domain/goblinStages.test.js`
Expected: PASS (15 tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/goblinStages.js src/domain/goblinStages.test.js
git commit -m "feat: add goblin evolution stage lookup"
```

---

### Task 7: HP penalty calculation

**Files:**
- Create: `src/domain/hpPenalty.js`, `src/domain/hpPenalty.test.js`

**Interfaces:**
- Produces: `computeHpPenalty({ currentHp: number, lastCheckDate: string, today: string, hasCompletionOnDate: (dateStr: string) => boolean }): { hp: number, lastCheckDate: string, penaltyTriggered: boolean }`. Dates are `YYYY-MM-DD` strings.

- [ ] **Step 1: Write the failing tests**

```js
import { describe, it, expect, vi } from 'vitest'
import { computeHpPenalty } from './hpPenalty.js'

describe('computeHpPenalty', () => {
  it('no-ops when lastCheckDate is today', () => {
    const result = computeHpPenalty({
      currentHp: 3, lastCheckDate: '2026-07-27', today: '2026-07-27',
      hasCompletionOnDate: () => true,
    })
    expect(result).toEqual({ hp: 3, lastCheckDate: '2026-07-27', penaltyTriggered: false })
  })

  it('deducts 1 hp for a single missed day with zero completions', () => {
    const result = computeHpPenalty({
      currentHp: 3, lastCheckDate: '2026-07-26', today: '2026-07-27',
      hasCompletionOnDate: () => false,
    })
    expect(result).toEqual({ hp: 2, lastCheckDate: '2026-07-27', penaltyTriggered: false })
  })

  it('does not deduct when the missed day had a completion', () => {
    const result = computeHpPenalty({
      currentHp: 3, lastCheckDate: '2026-07-26', today: '2026-07-27',
      hasCompletionOnDate: () => true,
    })
    expect(result).toEqual({ hp: 3, lastCheckDate: '2026-07-27', penaltyTriggered: false })
  })

  it('processes each missed day in a multi-day gap', () => {
    const hasCompletion = vi.fn((date) => date === '2026-07-25')
    const result = computeHpPenalty({
      currentHp: 3, lastCheckDate: '2026-07-24', today: '2026-07-27',
      hasCompletionOnDate: hasCompletion,
    })
    // missed days checked: 25 (completion, no penalty), 26 (no completion, -1)
    expect(result).toEqual({ hp: 2, lastCheckDate: '2026-07-27', penaltyTriggered: false })
    expect(hasCompletion).toHaveBeenCalledWith('2026-07-25')
    expect(hasCompletion).toHaveBeenCalledWith('2026-07-26')
  })

  it('stops deducting once hp reaches 0 and flags penaltyTriggered', () => {
    const result = computeHpPenalty({
      currentHp: 2, lastCheckDate: '2026-07-24', today: '2026-07-28',
      hasCompletionOnDate: () => false,
    })
    // 3 missed days (25,26,27), hp starts at 2 -> hits 0 after 2 days, third is skipped
    expect(result).toEqual({ hp: 0, lastCheckDate: '2026-07-28', penaltyTriggered: true })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/domain/hpPenalty.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```js
import { addDays, formatISO, isBefore, parseISO } from 'date-fns'

export function computeHpPenalty({ currentHp, lastCheckDate, today, hasCompletionOnDate }) {
  let hp = currentHp
  let penaltyTriggered = false
  let cursor = addDays(parseISO(lastCheckDate), 1)
  const todayDate = parseISO(today)

  while (isBefore(cursor, todayDate) && hp > 0) {
    const dateStr = formatISO(cursor, { representation: 'date' })
    if (!hasCompletionOnDate(dateStr)) {
      hp -= 1
      if (hp === 0) penaltyTriggered = true
    }
    cursor = addDays(cursor, 1)
  }

  return { hp, lastCheckDate: today, penaltyTriggered }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/domain/hpPenalty.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/hpPenalty.js src/domain/hpPenalty.test.js
git commit -m "feat: add HP daily-penalty calculation"
```

---

### Task 8: LocalStorage cache and offline sync queue

**Files:**
- Create: `src/services/localStore.js`, `src/services/localStore.test.js`, `src/services/syncQueue.js`, `src/services/syncQueue.test.js`

**Interfaces:**
- Produces: `getItem(key: string, fallback: any): any`, `setItem(key: string, value: any): void` from `localStore.js`.
- Produces: `enqueue(op: {table:string, operation:string, payload:object}): void`, `getQueue(): Array<object>`, `clearQueue(): void`, `replayQueue(applyFn: (op) => Promise<boolean>): Promise<{succeeded:number, remaining:number}>` from `syncQueue.js`.

- [ ] **Step 1: Write the failing tests for localStore**

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { getItem, setItem } from './localStore.js'

describe('localStore', () => {
  beforeEach(() => localStorage.clear())

  it('returns the fallback when the key is missing', () => {
    expect(getItem('missing', 'fallback')).toBe('fallback')
  })

  it('round-trips JSON values', () => {
    setItem('profile', { level: 5 })
    expect(getItem('profile', null)).toEqual({ level: 5 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails, implement, verify it passes**

Run: `npm test -- src/services/localStore.test.js` → FAIL (module not found).

```js
export function getItem(key, fallback) {
  const raw = localStorage.getItem(key)
  if (raw === null) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function setItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}
```

Run: `npm test -- src/services/localStore.test.js` → PASS (2 tests).

- [ ] **Step 3: Write the failing tests for syncQueue**

```js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { enqueue, getQueue, clearQueue, replayQueue } from './syncQueue.js'

describe('syncQueue', () => {
  beforeEach(() => clearQueue())

  it('enqueues operations in order', () => {
    enqueue({ table: 'tasks', operation: 'insert', payload: { id: 1 } })
    enqueue({ table: 'tasks', operation: 'insert', payload: { id: 2 } })
    expect(getQueue()).toHaveLength(2)
    expect(getQueue()[0].payload).toEqual({ id: 1 })
  })

  it('replayQueue removes entries that apply successfully, in order', async () => {
    enqueue({ table: 'tasks', operation: 'insert', payload: { id: 1 } })
    enqueue({ table: 'tasks', operation: 'insert', payload: { id: 2 } })
    const applyFn = vi.fn().mockResolvedValue(true)

    const result = await replayQueue(applyFn)

    expect(result).toEqual({ succeeded: 2, remaining: 0 })
    expect(getQueue()).toHaveLength(0)
    expect(applyFn.mock.calls[0][0].payload).toEqual({ id: 1 })
  })

  it('replayQueue stops at the first failure and leaves the remainder queued', async () => {
    enqueue({ table: 'tasks', operation: 'insert', payload: { id: 1 } })
    enqueue({ table: 'tasks', operation: 'insert', payload: { id: 2 } })
    const applyFn = vi.fn().mockResolvedValueOnce(false)

    const result = await replayQueue(applyFn)

    expect(result).toEqual({ succeeded: 0, remaining: 2 })
    expect(getQueue()).toHaveLength(2)
    expect(applyFn).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- src/services/syncQueue.test.js`
Expected: FAIL (module not found).

- [ ] **Step 5: Implement**

```js
import { getItem, setItem } from './localStore.js'

const QUEUE_KEY = 'sololeveling:pending_sync'

export function enqueue(op) {
  const queue = getQueue()
  queue.push(op)
  setItem(QUEUE_KEY, queue)
}

export function getQueue() {
  return getItem(QUEUE_KEY, [])
}

export function clearQueue() {
  setItem(QUEUE_KEY, [])
}

export async function replayQueue(applyFn) {
  const queue = getQueue()
  let succeeded = 0

  while (queue.length > 0) {
    const ok = await applyFn(queue[0])
    if (!ok) break
    queue.shift()
    succeeded += 1
  }

  setItem(QUEUE_KEY, queue)
  return { succeeded, remaining: queue.length }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- src/services/syncQueue.test.js`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add src/services/localStore.js src/services/localStore.test.js src/services/syncQueue.js src/services/syncQueue.test.js
git commit -m "feat: add LocalStorage cache and offline sync queue"
```

---

### Task 9: Data service (Supabase-first with offline fallback)

**Files:**
- Create: `src/services/dataService.js`, `src/services/dataService.test.js`

**Interfaces:**
- Consumes: `supabase` from `src/lib/supabaseClient.js`; `getItem`/`setItem` from `localStore.js`; `enqueue`/`replayQueue` from `syncQueue.js`.
- Produces: `writeRow(table: string, payload: object, { match }: {match?: object}): Promise<{ok:boolean, offline:boolean}>`, `readTable(table: string): Promise<Array<object>>`, `flushPendingSync(): Promise<{succeeded:number, remaining:number}>`.

- [ ] **Step 1: Write the failing tests**

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { clearQueue, getQueue } from './syncQueue.js'
import { setItem, getItem } from './localStore.js'

vi.mock('../lib/supabaseClient.js', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '../lib/supabaseClient.js'
import { writeRow, readTable, flushPendingSync } from './dataService.js'

describe('dataService', () => {
  beforeEach(() => {
    clearQueue()
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('writeRow upserts to Supabase and mirrors to LocalStorage on success', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    supabase.from.mockReturnValue({ upsert })

    const result = await writeRow('tasks', { id: '1', title: 'Test' })

    expect(result).toEqual({ ok: true, offline: false })
    expect(upsert).toHaveBeenCalledWith({ id: '1', title: 'Test' })
    expect(getItem('sololeveling:tasks', [])).toEqual([{ id: '1', title: 'Test' }])
    expect(getQueue()).toHaveLength(0)
  })

  it('writeRow falls back to the queue when Supabase errors', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: new Error('network') })
    supabase.from.mockReturnValue({ upsert })

    const result = await writeRow('tasks', { id: '1', title: 'Test' })

    expect(result).toEqual({ ok: false, offline: true })
    expect(getQueue()).toHaveLength(1)
    expect(getQueue()[0]).toMatchObject({ table: 'tasks', operation: 'upsert', payload: { id: '1', title: 'Test' } })
    expect(getItem('sololeveling:tasks', [])).toEqual([{ id: '1', title: 'Test' }])
  })

  it('readTable returns Supabase data on success', async () => {
    const select = vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null })
    supabase.from.mockReturnValue({ select })

    const result = await readTable('tasks')

    expect(result).toEqual([{ id: '1' }])
    expect(getItem('sololeveling:tasks', [])).toEqual([{ id: '1' }])
  })

  it('readTable falls back to the LocalStorage snapshot on failure', async () => {
    setItem('sololeveling:tasks', [{ id: 'cached' }])
    const select = vi.fn().mockResolvedValue({ data: null, error: new Error('network') })
    supabase.from.mockReturnValue({ select })

    const result = await readTable('tasks')

    expect(result).toEqual([{ id: 'cached' }])
  })

  it('flushPendingSync replays queued writes against Supabase', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    supabase.from.mockReturnValue({ upsert })
    await writeRow('tasks', { id: '1' }) // succeeds
    const failingUpsert = vi.fn().mockResolvedValue({ error: new Error('down') })
    supabase.from.mockReturnValue({ upsert: failingUpsert })
    await writeRow('tasks', { id: '2' }) // queued
    supabase.from.mockReturnValue({ upsert })

    const result = await flushPendingSync()

    expect(result).toEqual({ succeeded: 1, remaining: 0 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/services/dataService.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```js
import { supabase } from '../lib/supabaseClient.js'
import { getItem, setItem } from './localStore.js'
import { enqueue, replayQueue } from './syncQueue.js'

function cacheKey(table) {
  return `sololeveling:${table}`
}

function mirrorRow(table, payload) {
  const rows = getItem(cacheKey(table), [])
  const idx = rows.findIndex((r) => r.id === payload.id)
  if (idx >= 0) rows[idx] = { ...rows[idx], ...payload }
  else rows.push(payload)
  setItem(cacheKey(table), rows)
}

export async function writeRow(table, payload) {
  const { error } = await supabase.from(table).upsert(payload)
  mirrorRow(table, payload)

  if (error) {
    enqueue({ table, operation: 'upsert', payload })
    return { ok: false, offline: true }
  }

  return { ok: true, offline: false }
}

export async function readTable(table) {
  const { data, error } = await supabase.from(table).select()

  if (error || !data) {
    return getItem(cacheKey(table), [])
  }

  setItem(cacheKey(table), data)
  return data
}

export async function flushPendingSync() {
  return replayQueue(async (op) => {
    const { error } = await supabase.from(op.table).upsert(op.payload)
    return !error
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/services/dataService.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/services/dataService.js src/services/dataService.test.js
git commit -m "feat: add Supabase-first data service with offline fallback"
```

---

### Task 10: Profile store (Zustand)

**Files:**
- Create: `src/state/useProfileStore.js`, `src/state/useProfileStore.test.js`

**Interfaces:**
- Consumes: `writeRow`, `readTable` from `dataService.js`; `applyXp`, `xpRequiredForLevel` from `domain/xp.js`; `SUPABASE_PROFILE_ID` from `lib/supabaseClient.js`.
- Produces (Zustand store `useProfileStore`, state shape): `{ level, xp, coins, hp, attr_str, attr_int, attr_vit, attr_gold, attr_disc, lastHpCheckDate, loaded }` plus actions: `loadProfile(): Promise<void>`, `awardXp(amount: number): Promise<{leveledUp:boolean, level:number}>`, `awardCoins(amount: number): Promise<void>`, `spendCoins(amount: number): Promise<boolean>` (false if insufficient), `incrementAttribute(attr: string, amount: number): Promise<void>`, `setHpAndCheckDate({hp, lastHpCheckDate}): Promise<void>`, `applyPenaltyReset(): Promise<void>`.

- [ ] **Step 1: Write the failing tests**

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../services/dataService.js', () => ({
  writeRow: vi.fn().mockResolvedValue({ ok: true, offline: false }),
  readTable: vi.fn().mockResolvedValue([{
    id: '00000000-0000-0000-0000-000000000001', level: 1, xp: 0, coins: 0, hp: 3,
    attr_str: 0, attr_int: 0, attr_vit: 0, attr_gold: 0, attr_disc: 0,
    last_hp_check_date: '2026-07-27',
  }]),
}))

import { writeRow } from '../services/dataService.js'
import { useProfileStore } from './useProfileStore.js'

describe('useProfileStore', () => {
  beforeEach(async () => {
    useProfileStore.setState(useProfileStore.getInitialState())
    vi.clearAllMocks()
    await useProfileStore.getState().loadProfile()
  })

  it('loadProfile populates state from readTable', () => {
    expect(useProfileStore.getState().level).toBe(1)
  })

  it('awardXp adds xp, persists, and reports level-up', async () => {
    const result = await useProfileStore.getState().awardXp(150)
    expect(result).toEqual({ leveledUp: true, level: 2 })
    expect(useProfileStore.getState().xp).toBe(50)
    expect(writeRow).toHaveBeenCalledWith('profiles', expect.objectContaining({ level: 2, xp: 50 }))
  })

  it('spendCoins refuses when balance is insufficient', async () => {
    const ok = await useProfileStore.getState().spendCoins(10)
    expect(ok).toBe(false)
    expect(useProfileStore.getState().coins).toBe(0)
  })

  it('spendCoins deducts when balance is sufficient', async () => {
    useProfileStore.setState({ coins: 100 })
    const ok = await useProfileStore.getState().spendCoins(30)
    expect(ok).toBe(true)
    expect(useProfileStore.getState().coins).toBe(70)
  })

  it('incrementAttribute adds to the given attribute and persists', async () => {
    await useProfileStore.getState().incrementAttribute('attr_str', 50)
    expect(useProfileStore.getState().attr_str).toBe(50)
  })

  it('applyPenaltyReset zeroes level/xp/coins/attributes and restores hp to 3', async () => {
    useProfileStore.setState({ level: 12, xp: 400, coins: 300, attr_str: 200, hp: 0 })
    await useProfileStore.getState().applyPenaltyReset()
    const state = useProfileStore.getState()
    expect(state).toMatchObject({ level: 1, xp: 0, coins: 0, hp: 3, attr_str: 0, attr_int: 0, attr_vit: 0, attr_gold: 0, attr_disc: 0 })
    expect(writeRow).toHaveBeenCalledWith('system_events', expect.objectContaining({ event_type: 'penalty_reset' }))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/state/useProfileStore.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```js
import { create } from 'zustand'
import { writeRow, readTable } from '../services/dataService.js'
import { applyXp } from '../domain/xp.js'
import { SUPABASE_PROFILE_ID } from '../lib/supabaseClient.js'

const initialState = {
  level: 1, xp: 0, coins: 0, hp: 3,
  attr_str: 0, attr_int: 0, attr_vit: 0, attr_gold: 0, attr_disc: 0,
  lastHpCheckDate: null,
  loaded: false,
}

function persist(state) {
  return writeRow('profiles', {
    id: SUPABASE_PROFILE_ID,
    level: state.level, xp: state.xp, coins: state.coins, hp: state.hp,
    attr_str: state.attr_str, attr_int: state.attr_int, attr_vit: state.attr_vit,
    attr_gold: state.attr_gold, attr_disc: state.attr_disc,
    last_hp_check_date: state.lastHpCheckDate,
  })
}

export const useProfileStore = create((set, get) => ({
  ...initialState,

  async loadProfile() {
    const rows = await readTable('profiles')
    const row = rows.find((r) => r.id === SUPABASE_PROFILE_ID) ?? rows[0]
    if (row) {
      set({
        level: row.level, xp: row.xp, coins: row.coins, hp: row.hp,
        attr_str: row.attr_str, attr_int: row.attr_int, attr_vit: row.attr_vit,
        attr_gold: row.attr_gold, attr_disc: row.attr_disc,
        lastHpCheckDate: row.last_hp_check_date,
        loaded: true,
      })
    }
  },

  async awardXp(amount) {
    const { level, xp } = get()
    const result = applyXp({ level, xp }, amount)
    set({ level: result.level, xp: result.xp })
    await persist(get())
    return { leveledUp: result.leveledUp, level: result.level }
  },

  async awardCoins(amount) {
    set((s) => ({ coins: s.coins + amount }))
    await persist(get())
  },

  async spendCoins(amount) {
    if (get().coins < amount) return false
    set((s) => ({ coins: s.coins - amount }))
    await persist(get())
    return true
  },

  async incrementAttribute(attr, amount) {
    set((s) => ({ [attr]: s[attr] + amount }))
    await persist(get())
  },

  async setHpAndCheckDate({ hp, lastHpCheckDate }) {
    set({ hp, lastHpCheckDate })
    await persist(get())
  },

  async applyPenaltyReset() {
    set({
      level: 1, xp: 0, coins: 0, hp: 3,
      attr_str: 0, attr_int: 0, attr_vit: 0, attr_gold: 0, attr_disc: 0,
    })
    await persist(get())
    await writeRow('system_events', { event_type: 'penalty_reset', occurred_at: new Date().toISOString() })
  },
}))
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/state/useProfileStore.test.js`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/state/useProfileStore.js src/state/useProfileStore.test.js
git commit -m "feat: add profile Zustand store"
```

---

### Task 11: GoblinAvatar component (7 SVG stages)

**Files:**
- Create: `src/components/avatar/stages/Stage1.jsx` ... `Stage7.jsx`, `src/components/avatar/GoblinAvatar.jsx`, `src/components/avatar/GoblinAvatar.test.jsx`

**Interfaces:**
- Consumes: `getStageForLevel` from `domain/goblinStages.js`.
- Produces: `<GoblinAvatar level={number} />` default export. Each stage root SVG carries `data-testid="goblin-stage-N"`.

- [ ] **Step 1: Write the failing test**

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import GoblinAvatar from './GoblinAvatar.jsx'

describe('GoblinAvatar', () => {
  it.each([
    [1, 'goblin-stage-1'], [4, 'goblin-stage-1'],
    [5, 'goblin-stage-2'], [10, 'goblin-stage-3'],
    [15, 'goblin-stage-4'], [20, 'goblin-stage-5'],
    [25, 'goblin-stage-6'], [30, 'goblin-stage-7'], [99, 'goblin-stage-7'],
  ])('renders the correct stage for level %i', (level, testId) => {
    render(<GoblinAvatar level={level} />)
    expect(screen.getByTestId(testId)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/avatar/GoblinAvatar.test.jsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Write the 7 stage components**

Each stage is a self-contained SVG caricature reflecting its ТЗ description. Example for Stage 1 (the rest follow the same shape — hunched silhouette, stage-appropriate props, `data-testid`):

`src/components/avatar/stages/Stage1.jsx`:
```jsx
export default function Stage1() {
  return (
    <svg data-testid="goblin-stage-1" viewBox="0 0 200 200" role="img" aria-label="Нищий Гоблин-Оборванец">
      <ellipse cx="100" cy="180" rx="40" ry="8" fill="currentColor" opacity="0.15" />
      <path d="M70 150 Q60 100 90 80 Q100 60 120 80 Q140 100 130 150 Z" fill="#4a7c3f" />
      <circle cx="95" cy="90" r="6" fill="#0a0a0a" />
      <circle cx="115" cy="90" r="6" fill="#0a0a0a" />
      <rect x="80" y="130" width="40" height="20" fill="#8a8a8a" />
      <circle cx="100" cy="70" r="18" fill="#6b6b6b" />
      <line x1="60" y1="120" x2="45" y2="140" stroke="#3a2a1a" strokeWidth="4" />
      <circle cx="150" cy="60" r="2" fill="#333" />
      <circle cx="160" cy="70" r="2" fill="#333" />
    </svg>
  )
}
```

`Stage2.jsx` through `Stage7.jsx` follow the same pattern with `data-testid="goblin-stage-2"` through `"goblin-stage-7"` and props matching their spec descriptions (cardboard armor, leather vest + bone dagger, cape + steel sword, purple cuirass + shadow blade, dual blades + two shadow silhouettes, crown + full armor + glow) — implementer fills in shapes per the ТЗ table in the design spec, keeping each file under ~40 lines.

`src/components/avatar/GoblinAvatar.jsx`:
```jsx
import { getStageForLevel } from '../../domain/goblinStages.js'
import Stage1 from './stages/Stage1.jsx'
import Stage2 from './stages/Stage2.jsx'
import Stage3 from './stages/Stage3.jsx'
import Stage4 from './stages/Stage4.jsx'
import Stage5 from './stages/Stage5.jsx'
import Stage6 from './stages/Stage6.jsx'
import Stage7 from './stages/Stage7.jsx'

const STAGE_COMPONENTS = { 1: Stage1, 2: Stage2, 3: Stage3, 4: Stage4, 5: Stage5, 6: Stage6, 7: Stage7 }

export default function GoblinAvatar({ level }) {
  const stage = getStageForLevel(level)
  const StageComponent = STAGE_COMPONENTS[stage]
  return <StageComponent />
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/avatar/GoblinAvatar.test.jsx`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/avatar
git commit -m "feat: add GoblinAvatar with 7 evolution stage SVGs"
```

---

### Task 12: Level-up modal and sound effects

**Files:**
- Create: `src/audio/sfx.js`, `src/audio/sfx.test.js`, `src/components/profile/LevelUpModal.jsx`, `src/components/profile/LevelUpModal.test.jsx`

**Interfaces:**
- Produces: `playTaskComplete(): void`, `playLevelUp(): void` from `sfx.js` (no-op safely if `window.AudioContext`/`window.webkitAudioContext` is unavailable).
- Produces: `<LevelUpModal open={boolean} level={number} title={string} onClose={() => void} />` default export.

- [ ] **Step 1: Write the failing tests for sfx**

```js
import { describe, it, expect } from 'vitest'
import { playTaskComplete, playLevelUp } from './sfx.js'

describe('sfx', () => {
  it('playTaskComplete does not throw without AudioContext', () => {
    expect(() => playTaskComplete()).not.toThrow()
  })

  it('playLevelUp does not throw without AudioContext', () => {
    expect(() => playLevelUp()).not.toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/audio/sfx.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/audio/sfx.js`**

```js
function getAudioContext() {
  const Ctor = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
  return Ctor ? new Ctor() : null
}

function tone(ctx, { frequency, startTime, duration, type = 'sine', gain = 0.15 }) {
  const osc = ctx.createOscillator()
  const gainNode = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, startTime)
  gainNode.gain.setValueAtTime(gain, startTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.connect(gainNode).connect(ctx.destination)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

export function playTaskComplete() {
  const ctx = getAudioContext()
  if (!ctx) return
  tone(ctx, { frequency: 880, startTime: ctx.currentTime, duration: 0.12, type: 'square' })
}

export function playLevelUp() {
  const ctx = getAudioContext()
  if (!ctx) return
  const now = ctx.currentTime
  ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    tone(ctx, { frequency: freq, startTime: now + i * 0.08, duration: 0.3, type: 'triangle', gain: 0.12 })
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/audio/sfx.test.js`
Expected: PASS (2 tests — jsdom has no `AudioContext`, so both functions exercise the no-op path).

- [ ] **Step 5: Write the failing test for LevelUpModal**

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import LevelUpModal from './LevelUpModal.jsx'

describe('LevelUpModal', () => {
  it('renders nothing when closed', () => {
    render(<LevelUpModal open={false} level={5} title="Собиратель Мелких Скидок" onClose={() => {}} />)
    expect(screen.queryByText(/Собиратель Мелких Скидок/)).not.toBeInTheDocument()
  })

  it('shows the new level and title when open', () => {
    render(<LevelUpModal open={true} level={5} title="Собиратель Мелких Скидок" onClose={() => {}} />)
    expect(screen.getByText(/5/)).toBeInTheDocument()
    expect(screen.getByText('Собиратель Мелких Скидок')).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn()
    render(<LevelUpModal open={true} level={5} title="Собиратель Мелких Скидок" onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /продолжить|закрыть/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- src/components/profile/LevelUpModal.test.jsx`
Expected: FAIL (module not found).

- [ ] **Step 7: Implement**

```jsx
export default function LevelUpModal({ open, level, title, onClose }) {
  if (!open) return null
  return (
    <div role="dialog" aria-modal="true">
      <p>Новый уровень: {level}</p>
      <p>{title}</p>
      <button type="button" onClick={onClose}>Продолжить</button>
    </div>
  )
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- src/components/profile/LevelUpModal.test.jsx`
Expected: PASS (3 tests).

- [ ] **Step 9: Commit**

```bash
git add src/audio src/components/profile/LevelUpModal.jsx src/components/profile/LevelUpModal.test.jsx
git commit -m "feat: add synthesized sfx and level-up modal"
```

---

### Task 13: Penalty screen

**Files:**
- Create: `src/components/profile/PenaltyScreen.jsx`, `src/components/profile/PenaltyScreen.test.jsx`

**Interfaces:**
- Produces: `<PenaltyScreen open={boolean} onAcknowledge={() => void} />` default export.

- [ ] **Step 1: Write the failing test**

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import PenaltyScreen from './PenaltyScreen.jsx'

describe('PenaltyScreen', () => {
  it('renders nothing when closed', () => {
    render(<PenaltyScreen open={false} onAcknowledge={() => {}} />)
    expect(screen.queryByText(/SYSTEM PENALTY/i)).not.toBeInTheDocument()
  })

  it('shows the penalty message and triggers onAcknowledge', async () => {
    const onAcknowledge = vi.fn()
    render(<PenaltyScreen open={true} onAcknowledge={onAcknowledge} />)
    expect(screen.getByText(/SYSTEM PENALTY/i)).toBeInTheDocument()
    expect(screen.getByText(/YOU DIED/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button'))
    expect(onAcknowledge).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/profile/PenaltyScreen.test.jsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```jsx
export default function PenaltyScreen({ open, onAcknowledge }) {
  if (!open) return null
  return (
    <div role="alertdialog" aria-modal="true">
      <h1>SYSTEM PENALTY</h1>
      <p>YOU DIED</p>
      <button type="button" onClick={onAcknowledge}>Начать заново</button>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/profile/PenaltyScreen.test.jsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/profile/PenaltyScreen.jsx src/components/profile/PenaltyScreen.test.jsx
git commit -m "feat: add SYSTEM PENALTY screen"
```

---

### Task 14: Analytics log merge helper

**Files:**
- Create: `src/domain/analyticsLog.js`, `src/domain/analyticsLog.test.js`

**Interfaces:**
- Produces: `mergeAnalyticsLog(existingRow: object|null, { logDate, xpGained, category }: {logDate:string, xpGained:number, category:string}): object` (returns the full row shape ready for `writeRow('analytics_logs', ...)`).

- [ ] **Step 1: Write the failing tests**

```js
import { describe, it, expect } from 'vitest'
import { mergeAnalyticsLog } from './analyticsLog.js'

describe('mergeAnalyticsLog', () => {
  it('creates a fresh row when none exists', () => {
    const row = mergeAnalyticsLog(null, { logDate: '2026-07-27', xpGained: 50, category: 'physical' })
    expect(row).toEqual({
      log_date: '2026-07-27', xp_gained: 50, tasks_completed: 1,
      category_breakdown: { physical: 1 },
    })
  })

  it('increments an existing row', () => {
    const existing = { log_date: '2026-07-27', xp_gained: 50, tasks_completed: 1, category_breakdown: { physical: 1 } }
    const row = mergeAnalyticsLog(existing, { logDate: '2026-07-27', xpGained: 100, category: 'physical' })
    expect(row).toEqual({
      log_date: '2026-07-27', xp_gained: 150, tasks_completed: 2,
      category_breakdown: { physical: 2 },
    })
  })

  it('adds a new category key alongside existing ones', () => {
    const existing = { log_date: '2026-07-27', xp_gained: 50, tasks_completed: 1, category_breakdown: { physical: 1 } }
    const row = mergeAnalyticsLog(existing, { logDate: '2026-07-27', xpGained: 250, category: 'mental' })
    expect(row.category_breakdown).toEqual({ physical: 1, mental: 1 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/domain/analyticsLog.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```js
export function mergeAnalyticsLog(existingRow, { logDate, xpGained, category }) {
  const base = existingRow ?? { log_date: logDate, xp_gained: 0, tasks_completed: 0, category_breakdown: {} }
  return {
    log_date: logDate,
    xp_gained: base.xp_gained + xpGained,
    tasks_completed: base.tasks_completed + 1,
    category_breakdown: {
      ...base.category_breakdown,
      [category]: (base.category_breakdown[category] ?? 0) + 1,
    },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/domain/analyticsLog.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/analyticsLog.js src/domain/analyticsLog.test.js
git commit -m "feat: add analytics log merge helper"
```

---

### Task 15: Task store

**Files:**
- Create: `src/state/useTaskStore.js`, `src/state/useTaskStore.test.js`

**Interfaces:**
- Consumes: `writeRow`, `readTable` from `dataService.js`; `getReward` from `domain/rewards.js`; `getAttrForCategory` from `domain/categories.js`; `mergeAnalyticsLog` from `domain/analyticsLog.js`; `useProfileStore` actions (`awardXp`, `awardCoins`, `incrementAttribute`).
- Produces (Zustand store `useTaskStore`, state `{ tasks: Array<object>, loaded: boolean }`): `loadTasks(): Promise<void>`, `createTask({title, category, rank, dueDate}): Promise<void>`, `updateStatus(id, status): Promise<void>`, `completeTask(id): Promise<{leveledUp:boolean, level:number}>`, `deleteTask(id): Promise<void>`.

- [ ] **Step 1: Write the failing tests**

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../services/dataService.js', () => ({
  writeRow: vi.fn().mockResolvedValue({ ok: true, offline: false }),
  readTable: vi.fn().mockResolvedValue([]),
}))

vi.mock('./useProfileStore.js', () => ({
  useProfileStore: { getState: () => ({
    awardXp: vi.fn().mockResolvedValue({ leveledUp: true, level: 2 }),
    awardCoins: vi.fn().mockResolvedValue(undefined),
    incrementAttribute: vi.fn().mockResolvedValue(undefined),
  }) },
}))

import { writeRow } from '../services/dataService.js'
import { useProfileStore } from './useProfileStore.js'
import { useTaskStore } from './useTaskStore.js'

describe('useTaskStore', () => {
  beforeEach(() => {
    useTaskStore.setState(useTaskStore.getInitialState())
    vi.clearAllMocks()
  })

  it('createTask looks up the reward and persists a todo task', async () => {
    await useTaskStore.getState().createTask({ title: 'Отжаться', category: 'physical', rank: 'D', dueDate: null })
    const task = useTaskStore.getState().tasks[0]
    expect(task).toMatchObject({ title: 'Отжаться', category: 'physical', rank: 'D', xp_reward: 100, coin_reward: 20, status: 'todo' })
    expect(writeRow).toHaveBeenCalledWith('tasks', expect.objectContaining({ xp_reward: 100 }))
  })

  it('completeTask awards xp/coins/attribute and logs analytics', async () => {
    await useTaskStore.getState().createTask({ title: 'Отжаться', category: 'physical', rank: 'D', dueDate: null })
    const id = useTaskStore.getState().tasks[0].id
    const profileActions = useProfileStore.getState()

    const result = await useTaskStore.getState().completeTask(id)

    expect(result).toEqual({ leveledUp: true, level: 2 })
    expect(profileActions.awardXp).toHaveBeenCalledWith(100)
    expect(profileActions.awardCoins).toHaveBeenCalledWith(20)
    expect(profileActions.incrementAttribute).toHaveBeenCalledWith('attr_str', 100)
    expect(useTaskStore.getState().tasks[0].status).toBe('done')
    expect(writeRow).toHaveBeenCalledWith('analytics_logs', expect.objectContaining({ tasks_completed: 1 }))
  })

  it('deleteTask removes the task and persists', async () => {
    await useTaskStore.getState().createTask({ title: 'Отжаться', category: 'physical', rank: 'D', dueDate: null })
    const id = useTaskStore.getState().tasks[0].id
    await useTaskStore.getState().deleteTask(id)
    expect(useTaskStore.getState().tasks).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/state/useTaskStore.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```js
import { create } from 'zustand'
import { writeRow, readTable } from '../services/dataService.js'
import { getReward } from '../domain/rewards.js'
import { getAttrForCategory } from '../domain/categories.js'
import { mergeAnalyticsLog } from '../domain/analyticsLog.js'
import { useProfileStore } from './useProfileStore.js'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export const useTaskStore = create((set, get) => ({
  tasks: [],
  loaded: false,

  async loadTasks() {
    const tasks = await readTable('tasks')
    set({ tasks, loaded: true })
  },

  async createTask({ title, category, rank, dueDate }) {
    const reward = getReward(rank)
    const task = {
      id: crypto.randomUUID(),
      title, category, rank,
      xp_reward: reward.xp, coin_reward: reward.coins,
      status: 'todo', due_date: dueDate, completed_at: null,
    }
    set((s) => ({ tasks: [...s.tasks, task] }))
    await writeRow('tasks', task)
  },

  async updateStatus(id, status) {
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)) }))
    const task = get().tasks.find((t) => t.id === id)
    await writeRow('tasks', task)
  },

  async completeTask(id) {
    const task = get().tasks.find((t) => t.id === id)
    const completedAt = new Date().toISOString()
    const updated = { ...task, status: 'done', completed_at: completedAt }
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? updated : t)) }))
    await writeRow('tasks', updated)

    const profile = useProfileStore.getState()
    const levelResult = await profile.awardXp(task.xp_reward)
    await profile.awardCoins(task.coin_reward)
    await profile.incrementAttribute(getAttrForCategory(task.category), task.xp_reward)

    const logDate = todayISO()
    const existingLogs = await readTable('analytics_logs')
    const existingRow = existingLogs.find((r) => r.log_date === logDate) ?? null
    const mergedLog = mergeAnalyticsLog(existingRow, { logDate, xpGained: task.xp_reward, category: task.category })
    await writeRow('analytics_logs', mergedLog)

    return levelResult
  },

  async deleteTask(id) {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
    await writeRow('tasks', { id, _deleted: true })
  },
}))
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/state/useTaskStore.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/state/useTaskStore.js src/state/useTaskStore.test.js
git commit -m "feat: add task Zustand store with reward and analytics wiring"
```

---

### Task 16: Daily quest store

**Files:**
- Create: `src/state/useDailyQuestStore.js`, `src/state/useDailyQuestStore.test.js`

**Interfaces:**
- Consumes: `writeRow`, `readTable` from `dataService.js`.
- Produces (Zustand store `useDailyQuestStore`, state `{ quests: Array<object>, loaded: boolean }`): `loadQuests(): Promise<void>`, `createQuest(title: string): Promise<void>`, `toggleToday(id: string, today: string): Promise<void>`, `deactivateQuest(id: string): Promise<void>`, `hasCompletionOnDate(dateStr: string): boolean`.

- [ ] **Step 1: Write the failing tests**

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../services/dataService.js', () => ({
  writeRow: vi.fn().mockResolvedValue({ ok: true, offline: false }),
  readTable: vi.fn().mockResolvedValue([]),
}))

import { writeRow } from '../services/dataService.js'
import { useDailyQuestStore } from './useDailyQuestStore.js'

describe('useDailyQuestStore', () => {
  beforeEach(() => {
    useDailyQuestStore.setState(useDailyQuestStore.getInitialState())
    vi.clearAllMocks()
  })

  it('createQuest adds an active quest with no completion date', async () => {
    await useDailyQuestStore.getState().createQuest('20 отжиманий')
    expect(useDailyQuestStore.getState().quests[0]).toMatchObject({ title: '20 отжиманий', is_active: true, last_completed_date: null })
  })

  it('toggleToday marks the quest done today, then reverts on a second toggle', async () => {
    await useDailyQuestStore.getState().createQuest('20 отжиманий')
    const id = useDailyQuestStore.getState().quests[0].id

    await useDailyQuestStore.getState().toggleToday(id, '2026-07-27')
    expect(useDailyQuestStore.getState().quests[0].last_completed_date).toBe('2026-07-27')

    await useDailyQuestStore.getState().toggleToday(id, '2026-07-27')
    expect(useDailyQuestStore.getState().quests[0].last_completed_date).toBeNull()
  })

  it('hasCompletionOnDate reflects any quest completed on that date', async () => {
    await useDailyQuestStore.getState().createQuest('20 отжиманий')
    const id = useDailyQuestStore.getState().quests[0].id
    await useDailyQuestStore.getState().toggleToday(id, '2026-07-27')

    expect(useDailyQuestStore.getState().hasCompletionOnDate('2026-07-27')).toBe(true)
    expect(useDailyQuestStore.getState().hasCompletionOnDate('2026-07-26')).toBe(false)
  })

  it('deactivateQuest flips is_active to false without deleting it', async () => {
    await useDailyQuestStore.getState().createQuest('20 отжиманий')
    const id = useDailyQuestStore.getState().quests[0].id
    await useDailyQuestStore.getState().deactivateQuest(id)
    expect(useDailyQuestStore.getState().quests[0].is_active).toBe(false)
    expect(writeRow).toHaveBeenCalledWith('daily_quests', expect.objectContaining({ is_active: false }))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/state/useDailyQuestStore.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```js
import { create } from 'zustand'
import { writeRow, readTable } from '../services/dataService.js'

export const useDailyQuestStore = create((set, get) => ({
  quests: [],
  loaded: false,

  async loadQuests() {
    const quests = await readTable('daily_quests')
    set({ quests, loaded: true })
  },

  async createQuest(title) {
    const quest = { id: crypto.randomUUID(), title, last_completed_date: null, is_active: true }
    set((s) => ({ quests: [...s.quests, quest] }))
    await writeRow('daily_quests', quest)
  },

  async toggleToday(id, today) {
    const quest = get().quests.find((q) => q.id === id)
    const nextDate = quest.last_completed_date === today ? null : today
    const updated = { ...quest, last_completed_date: nextDate }
    set((s) => ({ quests: s.quests.map((q) => (q.id === id ? updated : q)) }))
    await writeRow('daily_quests', updated)
  },

  async deactivateQuest(id) {
    const quest = get().quests.find((q) => q.id === id)
    const updated = { ...quest, is_active: false }
    set((s) => ({ quests: s.quests.map((q) => (q.id === id ? updated : q)) }))
    await writeRow('daily_quests', updated)
  },

  hasCompletionOnDate(dateStr) {
    return get().quests.some((q) => q.last_completed_date === dateStr)
  },
}))
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/state/useDailyQuestStore.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/state/useDailyQuestStore.js src/state/useDailyQuestStore.test.js
git commit -m "feat: add daily quest store with date-based recurrence"
```

---

### Task 17: Shop store and inventory expiry

**Files:**
- Create: `src/state/useShopStore.js`, `src/state/useShopStore.test.js`

**Interfaces:**
- Consumes: `writeRow`, `readTable` from `dataService.js`; `useProfileStore` (`spendCoins`).
- Produces (Zustand store `useShopStore`, state `{ rewards: Array<object>, inventory: Array<object>, loaded: boolean }`): `loadShop(): Promise<void>`, `createReward({title, cost}): Promise<void>`, `purchase(rewardId: string): Promise<boolean>`, `useItem(inventoryId: string): Promise<void>`, `refreshExpiry(now: Date): void`.

- [ ] **Step 1: Write the failing tests**

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../services/dataService.js', () => ({
  writeRow: vi.fn().mockResolvedValue({ ok: true, offline: false }),
  readTable: vi.fn().mockResolvedValue([]),
}))

const spendCoins = vi.fn()
vi.mock('./useProfileStore.js', () => ({
  useProfileStore: { getState: () => ({ spendCoins }) },
}))

import { writeRow } from '../services/dataService.js'
import { useShopStore } from './useShopStore.js'

describe('useShopStore', () => {
  beforeEach(() => {
    useShopStore.setState(useShopStore.getInitialState())
    vi.clearAllMocks()
  })

  it('createReward adds a catalog entry', async () => {
    await useShopStore.getState().createReward({ title: 'Кино', cost: 200 })
    expect(useShopStore.getState().rewards[0]).toMatchObject({ title: 'Кино', cost_coins: 200 })
  })

  it('purchase fails when spendCoins refuses (insufficient balance)', async () => {
    spendCoins.mockResolvedValue(false)
    await useShopStore.getState().createReward({ title: 'Кино', cost: 200 })
    const rewardId = useShopStore.getState().rewards[0].id

    const ok = await useShopStore.getState().purchase(rewardId)

    expect(ok).toBe(false)
    expect(useShopStore.getState().inventory).toHaveLength(0)
  })

  it('purchase succeeds and adds an inventory entry expiring in 24h', async () => {
    spendCoins.mockResolvedValue(true)
    await useShopStore.getState().createReward({ title: 'Кино', cost: 200 })
    const rewardId = useShopStore.getState().rewards[0].id
    const now = new Date('2026-07-27T12:00:00Z')

    const ok = await useShopStore.getState().purchase(rewardId, now)

    expect(ok).toBe(true)
    const item = useShopStore.getState().inventory[0]
    expect(item.shop_reward_id).toBe(rewardId)
    expect(item.status).toBe('active')
    expect(item.expires_at).toBe('2026-07-28T12:00:00.000Z')
    expect(writeRow).toHaveBeenCalledWith('user_inventory', expect.objectContaining({ status: 'active' }))
  })

  it('refreshExpiry marks unused past-due items expired, leaves used ones alone', async () => {
    spendCoins.mockResolvedValue(true)
    await useShopStore.getState().createReward({ title: 'Кино', cost: 200 })
    const rewardId = useShopStore.getState().rewards[0].id
    await useShopStore.getState().purchase(rewardId, new Date('2026-07-25T12:00:00Z'))
    const [expiredItem] = useShopStore.getState().inventory
    useShopStore.setState({
      inventory: [
        { ...expiredItem, id: 'a', used_at: null },
        { ...expiredItem, id: 'b', used_at: '2026-07-25T13:00:00Z', status: 'used' },
      ],
    })

    useShopStore.getState().refreshExpiry(new Date('2026-07-27T00:00:00Z'))

    const [a, b] = useShopStore.getState().inventory
    expect(a.status).toBe('expired')
    expect(b.status).toBe('used')
  })

  it('useItem sets used_at and status', async () => {
    spendCoins.mockResolvedValue(true)
    await useShopStore.getState().createReward({ title: 'Кино', cost: 200 })
    const rewardId = useShopStore.getState().rewards[0].id
    await useShopStore.getState().purchase(rewardId, new Date('2026-07-27T12:00:00Z'))
    const itemId = useShopStore.getState().inventory[0].id

    await useShopStore.getState().useItem(itemId)

    const item = useShopStore.getState().inventory[0]
    expect(item.status).toBe('used')
    expect(item.used_at).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/state/useShopStore.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```js
import { create } from 'zustand'
import { writeRow, readTable } from '../services/dataService.js'
import { useProfileStore } from './useProfileStore.js'

export const useShopStore = create((set, get) => ({
  rewards: [],
  inventory: [],
  loaded: false,

  async loadShop() {
    const [rewards, inventory] = await Promise.all([readTable('shop_rewards'), readTable('user_inventory')])
    set({ rewards, inventory, loaded: true })
  },

  async createReward({ title, cost }) {
    const reward = { id: crypto.randomUUID(), title, cost_coins: cost }
    set((s) => ({ rewards: [...s.rewards, reward] }))
    await writeRow('shop_rewards', reward)
  },

  async purchase(rewardId, now = new Date()) {
    const reward = get().rewards.find((r) => r.id === rewardId)
    const ok = await useProfileStore.getState().spendCoins(reward.cost_coins)
    if (!ok) return false

    const item = {
      id: crypto.randomUUID(),
      shop_reward_id: rewardId,
      purchased_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      used_at: null,
      status: 'active',
    }
    set((s) => ({ inventory: [...s.inventory, item] }))
    await writeRow('user_inventory', item)
    return true
  },

  async useItem(inventoryId) {
    const item = get().inventory.find((i) => i.id === inventoryId)
    const updated = { ...item, used_at: new Date().toISOString(), status: 'used' }
    set((s) => ({ inventory: s.inventory.map((i) => (i.id === inventoryId ? updated : i)) }))
    await writeRow('user_inventory', updated)
  },

  refreshExpiry(now = new Date()) {
    set((s) => ({
      inventory: s.inventory.map((item) => {
        if (item.status !== 'active') return item
        if (new Date(item.expires_at) <= now) return { ...item, status: 'expired' }
        return item
      }),
    }))
  },
}))
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/state/useShopStore.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/state/useShopStore.js src/state/useShopStore.test.js
git commit -m "feat: add shop store with 24h expiring inventory"
```

---

### Task 18: Task List view

**Files:**
- Create: `src/components/tasks/TaskForm.jsx`, `src/components/tasks/TaskListView.jsx`, `src/components/tasks/TaskListView.test.jsx`

**Interfaces:**
- Consumes: `useTaskStore` (`tasks`, `createTask`, `completeTask`, `deleteTask`); `CATEGORIES` from `domain/categories.js`.
- Produces: `<TaskForm onSubmit={({title,category,rank,dueDate}) => void} />`, `<TaskListView />` default exports.

- [ ] **Step 1: Write the failing test**

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const createTask = vi.fn()
const completeTask = vi.fn()
const deleteTask = vi.fn()

vi.mock('../../state/useTaskStore.js', () => ({
  useTaskStore: (selector) => selector({
    tasks: [
      { id: '1', title: 'Помыть посуду', category: 'spirit', rank: 'E', status: 'todo' },
      { id: '2', title: 'Сделать отчёт', category: 'mental', rank: 'C', status: 'done' },
    ],
    createTask, completeTask, deleteTask,
  }),
}))

import TaskListView from './TaskListView.jsx'

describe('TaskListView', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders all tasks', () => {
    render(<TaskListView />)
    expect(screen.getByText('Помыть посуду')).toBeInTheDocument()
    expect(screen.getByText('Сделать отчёт')).toBeInTheDocument()
  })

  it('completing a todo task calls completeTask with its id', async () => {
    render(<TaskListView />)
    await userEvent.click(screen.getByRole('button', { name: /выполнить/i }))
    expect(completeTask).toHaveBeenCalledWith('1')
  })

  it('submitting the form calls createTask with the entered values', async () => {
    render(<TaskListView />)
    await userEvent.type(screen.getByLabelText(/название/i), 'Новая задача')
    await userEvent.selectOptions(screen.getByLabelText(/категория/i), 'physical')
    await userEvent.selectOptions(screen.getByLabelText(/ранг/i), 'D')
    await userEvent.click(screen.getByRole('button', { name: /добавить/i }))
    expect(createTask).toHaveBeenCalledWith({ title: 'Новая задача', category: 'physical', rank: 'D', dueDate: null })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/tasks/TaskListView.test.jsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `TaskForm.jsx`**

```jsx
import { useState } from 'react'
import { CATEGORIES } from '../../domain/categories.js'

const RANKS = ['E', 'D', 'C', 'B', 'A', 'S']

export default function TaskForm({ onSubmit }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0].key)
  const [rank, setRank] = useState('E')
  const [dueDate, setDueDate] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({ title, category, rank, dueDate: dueDate || null })
    setTitle('')
    setDueDate('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="task-title">Название</label>
      <input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} required />

      <label htmlFor="task-category">Категория</label>
      <select id="task-category" value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
      </select>

      <label htmlFor="task-rank">Ранг</label>
      <select id="task-rank" value={rank} onChange={(e) => setRank(e.target.value)}>
        {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>

      <label htmlFor="task-due">Срок</label>
      <input id="task-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />

      <button type="submit">Добавить</button>
    </form>
  )
}
```

- [ ] **Step 4: Implement `TaskListView.jsx`**

```jsx
import { useTaskStore } from '../../state/useTaskStore.js'
import TaskForm from './TaskForm.jsx'

export default function TaskListView() {
  const tasks = useTaskStore((s) => s.tasks)
  const createTask = useTaskStore((s) => s.createTask)
  const completeTask = useTaskStore((s) => s.completeTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)

  return (
    <div>
      <TaskForm onSubmit={createTask} />
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <span>{task.title}</span>
            {task.status !== 'done' && (
              <button type="button" onClick={() => completeTask(task.id)}>Выполнить</button>
            )}
            <button type="button" onClick={() => deleteTask(task.id)}>Удалить</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/components/tasks/TaskListView.test.jsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/tasks/TaskForm.jsx src/components/tasks/TaskListView.jsx src/components/tasks/TaskListView.test.jsx
git commit -m "feat: add task list view and creation form"
```

---

### Task 19: Kanban grouping logic and view

**Files:**
- Create: `src/domain/kanban.js`, `src/domain/kanban.test.js`, `src/components/tasks/TaskKanbanView.jsx`, `src/components/tasks/TaskKanbanView.test.jsx`

**Interfaces:**
- Produces: `columnsFromTasks(tasks: Array<{id,status}>): {todo: Array, in_progress: Array, done: Array}`, `moveTask(tasks, taskId, newStatus): Array` from `domain/kanban.js`.
- Produces: `<TaskKanbanView />` default export, using `@dnd-kit` to call `useTaskStore.updateStatus` on drop.

- [ ] **Step 1: Write the failing tests for the pure grouping logic**

```js
import { describe, it, expect } from 'vitest'
import { columnsFromTasks, moveTask } from './kanban.js'

describe('columnsFromTasks', () => {
  it('groups tasks by status into 3 columns', () => {
    const tasks = [
      { id: '1', status: 'todo' }, { id: '2', status: 'in_progress' },
      { id: '3', status: 'done' }, { id: '4', status: 'todo' },
    ]
    expect(columnsFromTasks(tasks)).toEqual({
      todo: [{ id: '1', status: 'todo' }, { id: '4', status: 'todo' }],
      in_progress: [{ id: '2', status: 'in_progress' }],
      done: [{ id: '3', status: 'done' }],
    })
  })
})

describe('moveTask', () => {
  it('returns a new array with the task moved to the new status', () => {
    const tasks = [{ id: '1', status: 'todo' }, { id: '2', status: 'todo' }]
    const result = moveTask(tasks, '1', 'in_progress')
    expect(result).toEqual([{ id: '1', status: 'in_progress' }, { id: '2', status: 'todo' }])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/domain/kanban.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/domain/kanban.js`**

```js
export function columnsFromTasks(tasks) {
  return {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    done: tasks.filter((t) => t.status === 'done'),
  }
}

export function moveTask(tasks, taskId, newStatus) {
  return tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/domain/kanban.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Write the failing test for the Kanban view (structure, not drag simulation)**

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('../../state/useTaskStore.js', () => ({
  useTaskStore: (selector) => selector({
    tasks: [
      { id: '1', title: 'Помыть посуду', status: 'todo' },
      { id: '2', title: 'Сделать отчёт', status: 'in_progress' },
      { id: '3', title: 'Спорт', status: 'done' },
    ],
    updateStatus: vi.fn(),
  }),
}))

import TaskKanbanView from './TaskKanbanView.jsx'

describe('TaskKanbanView', () => {
  it('renders each task under its column', () => {
    render(<TaskKanbanView />)
    expect(screen.getByTestId('kanban-column-todo')).toHaveTextContent('Помыть посуду')
    expect(screen.getByTestId('kanban-column-in_progress')).toHaveTextContent('Сделать отчёт')
    expect(screen.getByTestId('kanban-column-done')).toHaveTextContent('Спорт')
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- src/components/tasks/TaskKanbanView.test.jsx`
Expected: FAIL (module not found).

- [ ] **Step 7: Implement `TaskKanbanView.jsx`**

```jsx
import { DndContext } from '@dnd-kit/core'
import { useTaskStore } from '../../state/useTaskStore.js'
import { columnsFromTasks } from '../../domain/kanban.js'

const COLUMN_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }

export default function TaskKanbanView() {
  const tasks = useTaskStore((s) => s.tasks)
  const updateStatus = useTaskStore((s) => s.updateStatus)
  const columns = columnsFromTasks(tasks)

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over) return
    updateStatus(active.id, over.id)
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {Object.entries(columns).map(([status, columnTasks]) => (
        <div key={status} data-testid={`kanban-column-${status}`}>
          <h3>{COLUMN_LABELS[status]}</h3>
          {columnTasks.map((task) => <div key={task.id}>{task.title}</div>)}
        </div>
      ))}
    </DndContext>
  )
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- src/components/tasks/TaskKanbanView.test.jsx`
Expected: PASS (1 test).

Note: drag-and-drop interaction itself is not simulated in tests (jsdom + `@dnd-kit` pointer events are unreliable to test); the grouping/move logic that DnD calls into is fully covered by `kanban.test.js` above.

- [ ] **Step 9: Commit**

```bash
git add src/domain/kanban.js src/domain/kanban.test.js src/components/tasks/TaskKanbanView.jsx src/components/tasks/TaskKanbanView.test.jsx
git commit -m "feat: add Kanban board with dnd-kit"
```

---

### Task 20: Calendar grouping logic and view

**Files:**
- Create: `src/domain/calendar.js`, `src/domain/calendar.test.js`, `src/components/tasks/TaskCalendarView.jsx`, `src/components/tasks/TaskCalendarView.test.jsx`

**Interfaces:**
- Produces: `buildMonthGrid(year: number, month: number): Array<Array<Date>>` (weeks of 7 dates, including leading/trailing days from adjacent months), `tasksByDate(tasks: Array<{due_date}>): Record<string, Array>` from `domain/calendar.js`.
- Produces: `<TaskCalendarView />` default export.

- [ ] **Step 1: Write the failing tests for the pure helpers**

```js
import { describe, it, expect } from 'vitest'
import { buildMonthGrid, tasksByDate } from './calendar.js'

describe('buildMonthGrid', () => {
  it('builds a full-week grid for February 2026 (Sun-start weeks)', () => {
    const grid = buildMonthGrid(2026, 1) // month is 0-indexed: 1 = February
    // Feb 2026 starts on a Sunday and has 28 days -> exactly 4 weeks, no padding needed
    expect(grid).toHaveLength(4)
    expect(grid[0][0].toISOString().slice(0, 10)).toBe('2026-02-01')
    expect(grid[3][6].toISOString().slice(0, 10)).toBe('2026-02-28')
  })
})

describe('tasksByDate', () => {
  it('groups tasks by their due_date', () => {
    const tasks = [
      { id: '1', due_date: '2026-07-27' },
      { id: '2', due_date: '2026-07-27' },
      { id: '3', due_date: '2026-07-28' },
      { id: '4', due_date: null },
    ]
    const result = tasksByDate(tasks)
    expect(result['2026-07-27']).toHaveLength(2)
    expect(result['2026-07-28']).toHaveLength(1)
    expect(result.null).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/domain/calendar.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/domain/calendar.js`**

```js
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'

export function buildMonthGrid(year, month) {
  const firstDay = startOfMonth(new Date(year, month, 1))
  const lastDay = endOfMonth(firstDay)
  const gridStart = startOfWeek(firstDay)
  const gridEnd = endOfWeek(lastDay)
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }
  return weeks
}

export function tasksByDate(tasks) {
  return tasks.reduce((acc, task) => {
    if (!task.due_date) return acc
    if (!acc[task.due_date]) acc[task.due_date] = []
    acc[task.due_date].push(task)
    return acc
  }, {})
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/domain/calendar.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Write the failing test for the Calendar view**

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('../../state/useTaskStore.js', () => ({
  useTaskStore: (selector) => selector({
    tasks: [{ id: '1', title: 'Отчёт', due_date: '2026-02-15' }],
  }),
}))

import TaskCalendarView from './TaskCalendarView.jsx'

describe('TaskCalendarView', () => {
  it('renders the task under its due date cell', () => {
    render(<TaskCalendarView year={2026} month={1} />)
    expect(screen.getByTestId('calendar-day-2026-02-15')).toHaveTextContent('Отчёт')
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- src/components/tasks/TaskCalendarView.test.jsx`
Expected: FAIL (module not found).

- [ ] **Step 7: Implement `TaskCalendarView.jsx`**

```jsx
import { format } from 'date-fns'
import { useTaskStore } from '../../state/useTaskStore.js'
import { buildMonthGrid, tasksByDate } from '../../domain/calendar.js'

export default function TaskCalendarView({ year, month }) {
  const tasks = useTaskStore((s) => s.tasks)
  const grid = buildMonthGrid(year, month)
  const byDate = tasksByDate(tasks)

  return (
    <table>
      <tbody>
        {grid.map((week, i) => (
          <tr key={i}>
            {week.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              return (
                <td key={key} data-testid={`calendar-day-${key}`}>
                  <div>{format(day, 'd')}</div>
                  {(byDate[key] ?? []).map((t) => <div key={t.id}>{t.title}</div>)}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- src/components/tasks/TaskCalendarView.test.jsx`
Expected: PASS (1 test).

- [ ] **Step 9: Commit**

```bash
git add src/domain/calendar.js src/domain/calendar.test.js src/components/tasks/TaskCalendarView.jsx src/components/tasks/TaskCalendarView.test.jsx
git commit -m "feat: add calendar view"
```

---

### Task 21: Daily Quests panel UI

**Files:**
- Create: `src/components/tasks/DailyQuestsPanel.jsx`, `src/components/tasks/DailyQuestsPanel.test.jsx`

**Interfaces:**
- Consumes: `useDailyQuestStore` (`quests`, `createQuest`, `toggleToday`, `deactivateQuest`).
- Produces: `<DailyQuestsPanel today={string} />` default export.

- [ ] **Step 1: Write the failing test**

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

const toggleToday = vi.fn()
const createQuest = vi.fn()

vi.mock('../../state/useDailyQuestStore.js', () => ({
  useDailyQuestStore: (selector) => selector({
    quests: [{ id: '1', title: '20 отжиманий', last_completed_date: null, is_active: true }],
    createQuest, toggleToday,
    deactivateQuest: vi.fn(),
  }),
}))

import DailyQuestsPanel from './DailyQuestsPanel.jsx'

describe('DailyQuestsPanel', () => {
  it('renders quests and toggles completion for today', async () => {
    render(<DailyQuestsPanel today="2026-07-27" />)
    await userEvent.click(screen.getByRole('checkbox', { name: /20 отжиманий/i }))
    expect(toggleToday).toHaveBeenCalledWith('1', '2026-07-27')
  })

  it('submitting the add-quest form calls createQuest', async () => {
    render(<DailyQuestsPanel today="2026-07-27" />)
    await userEvent.type(screen.getByLabelText(/новый квест/i), 'Пить воду')
    await userEvent.click(screen.getByRole('button', { name: /добавить/i }))
    expect(createQuest).toHaveBeenCalledWith('Пить воду')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/tasks/DailyQuestsPanel.test.jsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```jsx
import { useState } from 'react'
import { useDailyQuestStore } from '../../state/useDailyQuestStore.js'

export default function DailyQuestsPanel({ today }) {
  const quests = useDailyQuestStore((s) => s.quests)
  const createQuest = useDailyQuestStore((s) => s.createQuest)
  const toggleToday = useDailyQuestStore((s) => s.toggleToday)
  const [title, setTitle] = useState('')

  function handleAdd(e) {
    e.preventDefault()
    createQuest(title)
    setTitle('')
  }

  return (
    <div>
      <ul>
        {quests.filter((q) => q.is_active).map((q) => (
          <li key={q.id}>
            <label>
              <input
                type="checkbox"
                checked={q.last_completed_date === today}
                onChange={() => toggleToday(q.id, today)}
              />
              {q.title}
            </label>
          </li>
        ))}
      </ul>
      <form onSubmit={handleAdd}>
        <label htmlFor="new-quest">Новый квест</label>
        <input id="new-quest" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button type="submit">Добавить</button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/tasks/DailyQuestsPanel.test.jsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/tasks/DailyQuestsPanel.jsx src/components/tasks/DailyQuestsPanel.test.jsx
git commit -m "feat: add daily quests panel"
```

---

### Task 22: Shop UI and countdown formatting

**Files:**
- Create: `src/domain/countdown.js`, `src/domain/countdown.test.js`, `src/components/shop/ShopView.jsx`, `src/components/shop/InventoryItem.jsx`, `src/components/shop/ShopView.test.jsx`

**Interfaces:**
- Produces: `formatRemaining(ms: number): string` from `domain/countdown.js`.
- Produces: `<ShopView />`, `<InventoryItem item={object} onUse={(id) => void} now={Date} />` default exports.

- [ ] **Step 1: Write the failing tests for formatRemaining**

```js
import { describe, it, expect } from 'vitest'
import { formatRemaining } from './countdown.js'

describe('formatRemaining', () => {
  it('formats hours, minutes, and seconds', () => {
    expect(formatRemaining(2 * 3600_000 + 5 * 60_000 + 9_000)).toBe('02:05:09')
  })

  it('formats zero as 00:00:00', () => {
    expect(formatRemaining(0)).toBe('00:00:00')
  })

  it('returns "expired" for negative durations', () => {
    expect(formatRemaining(-1000)).toBe('expired')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/domain/countdown.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/domain/countdown.js`**

```js
export function formatRemaining(ms) {
  if (ms < 0) return 'expired'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/domain/countdown.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing test for ShopView**

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

const purchase = vi.fn()
const createReward = vi.fn()
const useItem = vi.fn()

vi.mock('../../state/useShopStore.js', () => ({
  useShopStore: (selector) => selector({
    rewards: [{ id: 'r1', title: 'Кино', cost_coins: 200 }],
    inventory: [{ id: 'i1', shop_reward_id: 'r1', status: 'active', expires_at: '2026-07-28T12:00:00.000Z', used_at: null }],
    purchase, createReward, useItem,
  }),
}))

import ShopView from './ShopView.jsx'

describe('ShopView', () => {
  it('renders catalog rewards and purchasing calls purchase(rewardId)', async () => {
    render(<ShopView />)
    await userEvent.click(screen.getByRole('button', { name: /купить/i }))
    expect(purchase).toHaveBeenCalledWith('r1')
  })

  it('renders active inventory items with a use button', async () => {
    render(<ShopView />)
    await userEvent.click(screen.getByRole('button', { name: /использовать/i }))
    expect(useItem).toHaveBeenCalledWith('i1')
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- src/components/shop/ShopView.test.jsx`
Expected: FAIL (module not found).

- [ ] **Step 7: Implement `InventoryItem.jsx`**

```jsx
import { formatRemaining } from '../../domain/countdown.js'

export default function InventoryItem({ item, onUse, now = new Date() }) {
  const remaining = new Date(item.expires_at).getTime() - now.getTime()
  return (
    <li>
      <span>{formatRemaining(remaining)}</span>
      {item.status === 'active' && (
        <button type="button" onClick={() => onUse(item.id)}>Использовать</button>
      )}
    </li>
  )
}
```

- [ ] **Step 8: Implement `ShopView.jsx`**

```jsx
import { useShopStore } from '../../state/useShopStore.js'
import InventoryItem from './InventoryItem.jsx'

export default function ShopView() {
  const rewards = useShopStore((s) => s.rewards)
  const inventory = useShopStore((s) => s.inventory)
  const purchase = useShopStore((s) => s.purchase)
  const useItem = useShopStore((s) => s.useItem)

  return (
    <div>
      <ul>
        {rewards.map((r) => (
          <li key={r.id}>
            {r.title} — {r.cost_coins}
            <button type="button" onClick={() => purchase(r.id)}>Купить</button>
          </li>
        ))}
      </ul>
      <ul>
        {inventory.filter((i) => i.status === 'active').map((item) => (
          <InventoryItem key={item.id} item={item} onUse={useItem} />
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 9: Run test to verify it passes**

Run: `npm test -- src/components/shop/ShopView.test.jsx`
Expected: PASS (2 tests).

- [ ] **Step 10: Commit**

```bash
git add src/domain/countdown.js src/domain/countdown.test.js src/components/shop
git commit -m "feat: add shop UI with 24h countdown"
```

---

### Task 23: Analytics data shaping and charts

**Files:**
- Create: `src/domain/analyticsView.js`, `src/domain/analyticsView.test.js`, `src/components/analytics/RadarChart.jsx`, `src/components/analytics/XpLineChart.jsx`, `src/components/analytics/CategoryDonutChart.jsx`

**Interfaces:**
- Produces: `radarDataFromProfile(profile: object): {labels: string[], values: number[]}`, `lineDataFromLogs(logs: Array<{log_date,xp_gained}>, days: number, penaltyDates: string[]): {labels: string[], values: number[], penaltyFlags: boolean[]}`, `donutDataFromLogs(logs: Array<{category_breakdown}>): {labels: string[], values: number[]}` from `domain/analyticsView.js`.
- Produces: `<RadarChart profile={object} />`, `<XpLineChart logs={array} penaltyEvents={array} />`, `<CategoryDonutChart logs={array} />` default exports (thin `react-chartjs-2` wrappers around the shaping functions).

- [ ] **Step 1: Write the failing tests for the shaping functions**

```js
import { describe, it, expect } from 'vitest'
import { radarDataFromProfile, lineDataFromLogs, donutDataFromLogs } from './analyticsView.js'

describe('radarDataFromProfile', () => {
  it('maps the 5 attributes to labeled values', () => {
    const profile = { attr_str: 10, attr_int: 20, attr_vit: 30, attr_gold: 40, attr_disc: 50 }
    expect(radarDataFromProfile(profile)).toEqual({
      labels: ['STR', 'INT', 'VIT', 'GOLD', 'DISC'],
      values: [10, 20, 30, 40, 50],
    })
  })
})

describe('lineDataFromLogs', () => {
  it('fills missing days with 0 and flags penalty dates', () => {
    const logs = [{ log_date: '2026-07-26', xp_gained: 150 }]
    const result = lineDataFromLogs(logs, 3, ['2026-07-25'], '2026-07-27')
    expect(result.labels).toEqual(['2026-07-25', '2026-07-26', '2026-07-27'])
    expect(result.values).toEqual([0, 150, 0])
    expect(result.penaltyFlags).toEqual([true, false, false])
  })
})

describe('donutDataFromLogs', () => {
  it('sums category_breakdown across logs', () => {
    const logs = [
      { category_breakdown: { physical: 2, mental: 1 } },
      { category_breakdown: { physical: 1, finance: 3 } },
    ]
    expect(donutDataFromLogs(logs)).toEqual({
      labels: ['physical', 'mental', 'finance'],
      values: [3, 1, 3],
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/domain/analyticsView.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/domain/analyticsView.js`**

```js
import { subDays, format, parseISO } from 'date-fns'

export function radarDataFromProfile(profile) {
  return {
    labels: ['STR', 'INT', 'VIT', 'GOLD', 'DISC'],
    values: [profile.attr_str, profile.attr_int, profile.attr_vit, profile.attr_gold, profile.attr_disc],
  }
}

export function lineDataFromLogs(logs, days, penaltyDates = [], today = format(new Date(), 'yyyy-MM-dd')) {
  const byDate = Object.fromEntries(logs.map((l) => [l.log_date, l.xp_gained]))
  const penaltySet = new Set(penaltyDates)
  const labels = []
  for (let i = days - 1; i >= 0; i--) {
    labels.push(format(subDays(parseISO(today), i), 'yyyy-MM-dd'))
  }
  return {
    labels,
    values: labels.map((d) => byDate[d] ?? 0),
    penaltyFlags: labels.map((d) => penaltySet.has(d)),
  }
}

export function donutDataFromLogs(logs) {
  const totals = {}
  for (const log of logs) {
    for (const [category, count] of Object.entries(log.category_breakdown ?? {})) {
      totals[category] = (totals[category] ?? 0) + count
    }
  }
  return { labels: Object.keys(totals), values: Object.values(totals) }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/domain/analyticsView.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Implement the chart components (thin wrappers, no dedicated tests beyond a smoke render — the data shaping they depend on is already fully tested)**

```jsx
// src/components/analytics/RadarChart.jsx
import { Radar } from 'react-chartjs-2'
import { Chart, RadialLinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js'
import { radarDataFromProfile } from '../../domain/analyticsView.js'

Chart.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip)

export default function RadarChart({ profile }) {
  const { labels, values } = radarDataFromProfile(profile)
  return <Radar data={{ labels, datasets: [{ label: 'Атрибуты', data: values }] }} />
}
```

```jsx
// src/components/analytics/XpLineChart.jsx
import { Line } from 'react-chartjs-2'
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, Tooltip } from 'chart.js'
import { lineDataFromLogs } from '../../domain/analyticsView.js'

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip)

export default function XpLineChart({ logs, penaltyEvents = [], days = 7 }) {
  const penaltyDates = penaltyEvents.map((e) => e.occurred_at.slice(0, 10))
  const { labels, values } = lineDataFromLogs(logs, days, penaltyDates)
  return <Line data={{ labels, datasets: [{ label: 'XP', data: values }] }} />
}
```

```jsx
// src/components/analytics/CategoryDonutChart.jsx
import { Doughnut } from 'react-chartjs-2'
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js'
import { donutDataFromLogs } from '../../domain/analyticsView.js'

Chart.register(ArcElement, Tooltip, Legend)

export default function CategoryDonutChart({ logs }) {
  const { labels, values } = donutDataFromLogs(logs)
  return <Doughnut data={{ labels, datasets: [{ data: values }] }} />
}
```

- [ ] **Step 6: Commit**

```bash
git add src/domain/analyticsView.js src/domain/analyticsView.test.js src/components/analytics
git commit -m "feat: add analytics data shaping and Chart.js views"
```

---

### Task 24: Profile header (HP, level, coins, XP bar) with penalty/level-up wiring

**Files:**
- Create: `src/components/profile/ProfileHeader.jsx`, `src/components/profile/ProfileHeader.test.jsx`

**Interfaces:**
- Consumes: `useProfileStore` (`level, xp, coins, hp, ...attrs, checkHpPenalty-equivalent flow wired here`, `applyPenaltyReset`); `xpRequiredForLevel` from `domain/xp.js`; `getRankTitle` from `domain/ranks.js`; `GoblinAvatar`; `LevelUpModal`; `PenaltyScreen`; `playLevelUp` from `audio/sfx.js`.
- Produces: `<ProfileHeader />` default export. Internally tracks the previous rendered level in a ref to detect level-up transitions and previous hp to detect the 0-crossing for the penalty screen.

- [ ] **Step 1: Write the failing tests**

```jsx
import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const baseProfile = {
  level: 1, xp: 40, coins: 15, hp: 2,
  attr_str: 0, attr_int: 0, attr_vit: 0, attr_gold: 0, attr_disc: 0,
  applyPenaltyReset: vi.fn(),
}

vi.mock('../../state/useProfileStore.js', () => ({
  useProfileStore: (selector) => selector(mockState),
}))

vi.mock('../../audio/sfx.js', () => ({ playLevelUp: vi.fn() }))

let mockState

import ProfileHeader from './ProfileHeader.jsx'
import { playLevelUp } from '../../audio/sfx.js'

describe('ProfileHeader', () => {
  it('renders hp hearts, level, coins, and an xp progress bar', () => {
    mockState = { ...baseProfile }
    render(<ProfileHeader />)
    expect(screen.getByTestId('hp-hearts')).toHaveTextContent('♥♥♡')
    expect(screen.getByText(/15/)).toBeInTheDocument() // coins
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40')
  })

  it('shows the level-up modal and plays the sfx when level increases between renders', () => {
    mockState = { ...baseProfile, level: 1 }
    const { rerender } = render(<ProfileHeader />)
    mockState = { ...baseProfile, level: 2 }
    rerender(<ProfileHeader />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(playLevelUp).toHaveBeenCalled()
  })

  it('shows the penalty screen when hp reaches 0', () => {
    mockState = { ...baseProfile, hp: 0 }
    render(<ProfileHeader />)
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/profile/ProfileHeader.test.jsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```jsx
import { useEffect, useRef, useState } from 'react'
import { useProfileStore } from '../../state/useProfileStore.js'
import { xpRequiredForLevel } from '../../domain/xp.js'
import { getRankTitle } from '../../domain/ranks.js'
import GoblinAvatar from '../avatar/GoblinAvatar.jsx'
import LevelUpModal from './LevelUpModal.jsx'
import PenaltyScreen from './PenaltyScreen.jsx'
import { playLevelUp } from '../../audio/sfx.js'

export default function ProfileHeader() {
  const level = useProfileStore((s) => s.level)
  const xp = useProfileStore((s) => s.xp)
  const coins = useProfileStore((s) => s.coins)
  const hp = useProfileStore((s) => s.hp)
  const applyPenaltyReset = useProfileStore((s) => s.applyPenaltyReset)

  const [showLevelUp, setShowLevelUp] = useState(false)
  const previousLevel = useRef(level)

  useEffect(() => {
    if (level > previousLevel.current) {
      setShowLevelUp(true)
      playLevelUp()
    }
    previousLevel.current = level
  }, [level])

  const rank = getRankTitle(level)
  const required = xpRequiredForLevel(level)
  const hearts = '♥'.repeat(hp) + '♡'.repeat(3 - hp)

  return (
    <div>
      <GoblinAvatar level={level} />
      <div data-testid="hp-hearts">{hearts}</div>
      <p>Уровень {level}: {rank.title}</p>
      <p>{coins}</p>
      <div role="progressbar" aria-valuenow={xp} aria-valuemin={0} aria-valuemax={required} />

      <LevelUpModal open={showLevelUp} level={level} title={rank.title} onClose={() => setShowLevelUp(false)} />
      <PenaltyScreen open={hp === 0} onAcknowledge={applyPenaltyReset} />
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/profile/ProfileHeader.test.jsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/profile/ProfileHeader.jsx src/components/profile/ProfileHeader.test.jsx
git commit -m "feat: add profile header with level-up and penalty wiring"
```

---

### Task 25: App shell, routing, and visual design pass

**Files:**
- Create: `src/pages/DashboardPage.jsx`, `src/pages/TasksPage.jsx`, `src/pages/ShopPage.jsx`, `src/pages/AnalyticsPage.jsx`
- Modify: `src/App.jsx`, `src/index.css`
- Test: `src/App.test.jsx` (replaces the Task 1 smoke test)

**Interfaces:**
- Consumes: all page-level components/stores built in Tasks 10-24.
- Produces: `<App />` with `react-router-dom` routes `/` (Dashboard), `/tasks` (Tasks — List/Kanban/Calendar tabs + DailyQuestsPanel), `/shop`, `/analytics`.

- [ ] **Step 1: Write the failing routing test**

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from './App.jsx'

describe('App routing', () => {
  it.each([
    ['/', /дашборд|уровень/i],
    ['/tasks', /задачи/i],
    ['/shop', /магазин/i],
    ['/analytics', /аналитика/i],
  ])('renders the expected heading for %s', (path, heading) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
  })
})
```

(This test supersedes the Task 1 smoke test — delete the old assertion for "Sololeveling Tracker" placeholder text once this one is in place.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/App.test.jsx`
Expected: FAIL (routes/pages don't exist yet).

- [ ] **Step 3: Build the 4 page components**, each with an `<h1>` heading matching the test regex and composing the components from earlier tasks:
  - `DashboardPage.jsx`: `<h1>Дашборд</h1>` + `<ProfileHeader />` + `<DailyQuestsPanel today={...} />`.
  - `TasksPage.jsx`: `<h1>Задачи</h1>` + tab switcher rendering `TaskListView` / `TaskKanbanView` / `TaskCalendarView`.
  - `ShopPage.jsx`: `<h1>Магазин</h1>` + `<ShopView />`.
  - `AnalyticsPage.jsx`: `<h1>Аналитика</h1>` + `RadarChart` / `XpLineChart` / `CategoryDonutChart` wired to store data.

- [ ] **Step 4: Wire routing in `App.jsx`**

```jsx
import { Routes, Route, Link } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage.jsx'
import TasksPage from './pages/TasksPage.jsx'
import ShopPage from './pages/ShopPage.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'

export default function App() {
  return (
    <div>
      <nav>
        <Link to="/">Дашборд</Link>
        <Link to="/tasks">Задачи</Link>
        <Link to="/shop">Магазин</Link>
        <Link to="/analytics">Аналитика</Link>
      </nav>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </div>
  )
}
```

Wrap `<App />` in `<BrowserRouter>` inside `main.jsx` (not inside `App.jsx` itself, so the test above can wrap it in `MemoryRouter` instead).

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/App.test.jsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Design pass — invoke the design skills**

This is a real, required step, not optional polish: invoke `frontend-design`, then `ui-ux-pro-max`, then `web-design-guidelines` (review pass) to produce the actual visual language from scratch — color palette, typography, spacing, the "System" HUD aesthetic — and apply it across `src/index.css` and component `className`s. Do not reuse any specific values from the earlier discarded prototype (that attempt is not a reference). Re-run `npm test` after styling changes to confirm nothing broke, since Tailwind classes don't affect the RTL assertions above but a botched JSX edit could.

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx src/App.test.jsx src/main.jsx src/pages src/index.css
git commit -m "feat: wire app routing and apply visual design"
```

---

### Task 26: Boot sequence (initial loads, HP check, offline sync)

**Files:**
- Create: `src/services/bootstrap.js`, `src/services/bootstrap.test.js`
- Modify: `src/main.jsx` (call `bootstrap()` before render, or from an effect in `App.jsx` — implementer's call, document whichever is chosen)

**Interfaces:**
- Consumes: `useProfileStore`, `useTaskStore`, `useDailyQuestStore`, `useShopStore` (their `load*` actions and `useProfileStore`'s `setHpAndCheckDate`); `computeHpPenalty` from `domain/hpPenalty.js`; `flushPendingSync` from `services/dataService.js`.
- Produces: `bootstrap(today: string = todayISO()): Promise<void>` — loads all four stores, runs the HP penalty check against `useDailyQuestStore().hasCompletionOnDate`, persists any resulting hp/date change, and registers a `window` `online` listener that calls `flushPendingSync`.

- [ ] **Step 1: Write the failing tests**

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

const loadProfile = vi.fn()
const loadTasks = vi.fn()
const loadQuests = vi.fn()
const loadShop = vi.fn()
const setHpAndCheckDate = vi.fn()
const hasCompletionOnDate = vi.fn().mockReturnValue(true)

vi.mock('../state/useProfileStore.js', () => ({
  useProfileStore: { getState: () => ({
    loadProfile, setHpAndCheckDate,
    hp: 3, lastHpCheckDate: '2026-07-26',
  }) },
}))
vi.mock('../state/useTaskStore.js', () => ({ useTaskStore: { getState: () => ({ loadTasks }) } }))
vi.mock('../state/useDailyQuestStore.js', () => ({
  useDailyQuestStore: { getState: () => ({ loadQuests, hasCompletionOnDate }) },
}))
vi.mock('../state/useShopStore.js', () => ({ useShopStore: { getState: () => ({ loadShop }) } }))
vi.mock('./dataService.js', () => ({ flushPendingSync: vi.fn() }))

import { flushPendingSync } from './dataService.js'
import { bootstrap } from './bootstrap.js'

describe('bootstrap', () => {
  beforeEach(() => vi.clearAllMocks())

  it('loads all 4 stores', async () => {
    await bootstrap('2026-07-27')
    expect(loadProfile).toHaveBeenCalled()
    expect(loadTasks).toHaveBeenCalled()
    expect(loadQuests).toHaveBeenCalled()
    expect(loadShop).toHaveBeenCalled()
  })

  it('runs the HP penalty check and persists the result', async () => {
    await bootstrap('2026-07-27')
    expect(setHpAndCheckDate).toHaveBeenCalledWith({ hp: 3, lastHpCheckDate: '2026-07-27' })
  })

  it('registers an online listener that flushes the pending sync queue', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    await bootstrap('2026-07-27')
    const [event, handler] = addEventListenerSpy.mock.calls.find(([e]) => e === 'online')
    expect(event).toBe('online')
    handler()
    expect(flushPendingSync).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/services/bootstrap.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```js
import { useProfileStore } from '../state/useProfileStore.js'
import { useTaskStore } from '../state/useTaskStore.js'
import { useDailyQuestStore } from '../state/useDailyQuestStore.js'
import { useShopStore } from '../state/useShopStore.js'
import { computeHpPenalty } from '../domain/hpPenalty.js'
import { flushPendingSync } from './dataService.js'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export async function bootstrap(today = todayISO()) {
  await Promise.all([
    useProfileStore.getState().loadProfile(),
    useTaskStore.getState().loadTasks(),
    useDailyQuestStore.getState().loadQuests(),
    useShopStore.getState().loadShop(),
  ])

  const profile = useProfileStore.getState()
  const dailyQuests = useDailyQuestStore.getState()
  const penaltyResult = computeHpPenalty({
    currentHp: profile.hp,
    lastCheckDate: profile.lastHpCheckDate,
    today,
    hasCompletionOnDate: dailyQuests.hasCompletionOnDate,
  })
  await profile.setHpAndCheckDate({ hp: penaltyResult.hp, lastHpCheckDate: penaltyResult.lastCheckDate })

  window.addEventListener('online', () => flushPendingSync())
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/services/bootstrap.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Call `bootstrap()` from `main.jsx` before rendering**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { bootstrap } from './services/bootstrap.js'

bootstrap()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] **Step 6: Commit**

```bash
git add src/services/bootstrap.js src/services/bootstrap.test.js src/main.jsx
git commit -m "feat: wire app boot sequence with HP check and offline sync"
```

---

### Task 27: Apply the Supabase schema (manual step)

**Files:** none (dashboard action + verification).

- [ ] **Step 1:** Open the Supabase project's SQL Editor (`https://supabase.com/dashboard/project/jenmywdeyhmssmufuqti/sql`), paste the full contents of `supabase/schema.sql`, run it.
- [ ] **Step 2:** In the Table Editor, confirm all 7 tables exist and `profiles` has exactly one seeded row with `id = '00000000-0000-0000-0000-000000000001'`.
- [ ] **Step 3:** Run `npm run dev`, open the app, confirm the Dashboard loads the seeded profile (level 1, 3 hearts) with no console errors.
- [ ] **Step 4:** Create a task in the UI, complete it, and confirm a matching row appears in the `tasks` and `analytics_logs` tables in the Supabase Table Editor.

---

### Task 28: Vercel deployment

**Files:** none (deployment configuration).

- [ ] **Step 1:** Connect the GitHub repo `artemzhabinsky/Sololeveling-Tracker` to a new Vercel project — either via the Vercel dashboard ("Import Project" → select the repo), or, if a Vercel token is provided, via `npx vercel --token=<token> --yes` from the project root.
- [ ] **Step 2:** In the Vercel project's Environment Variables settings, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` matching `.env`.
- [ ] **Step 3:** Trigger a deploy (push to `main`, which the existing auto-push hook already does on every commit) and confirm the build succeeds.
- [ ] **Step 4:** Open the deployed URL, confirm the Dashboard loads real data from Supabase and a task can be created/completed end to end.

---

## Self-Review Notes

- **Spec coverage:** every section of the design spec maps to a task — schema/sync (2, 8, 9), leveling/ranks/rewards/categories (3-5), goblin stages (6, 11), HP/penalty (7, 13, 24), level-up popup/sfx (12, 24), task tracker List/Kanban/Calendar (18-20), daily quests (16, 21), shop (17, 22), analytics (14, 23), visual design (25), deployment (27-28).
- **Type consistency checked:** `writeRow(table, payload)` signature is identical across Tasks 9-17; `useProfileStore` action names (`awardXp`, `awardCoins`, `spendCoins`, `incrementAttribute`, `setHpAndCheckDate`, `applyPenaltyReset`) are used consistently by Tasks 15, 17, 24, 26 exactly as defined in Task 10.
- **No placeholders:** all steps contain runnable code and exact commands; Tasks 27-28 are explicitly manual (no code exists to write) and are scoped as verification checklists rather than fake code steps.
