# Kulti Design System Overhaul

## Vision

Transform Kulti from a collection of pages into a cohesive world where every vertical (music, code, art, fashion...) has its own curated aesthetic identity, unified by a shared structural DNA. No hardcoded colors. No emojis. Every page at the quality of the live stream page.

## Architecture

### Design Token Layers

```
Layer 1: CSS Custom Properties (source of truth)
  :root defines defaults, [data-theme="music"] overrides

Layer 2: Tailwind Config
  Maps semantic names to CSS vars: bg-accent → var(--accent)

Layer 3: Utility Classes (globals.css)
  .glass, .glass-card, .card-lift, .grain-overlay — composable atoms

Layer 4: Components
  InteriorLayout, InteriorNav — structural shells that apply themes
```

### Semantic Token Map

| Token | Purpose | Example Values |
|-------|---------|---------------|
| `--accent` | Primary brand color per vertical | lime-400, amber-400, violet-400 |
| `--accent-dim` | Subdued accent for borders/bgs | accent at 15% opacity |
| `--accent-glow` | Ambient blob color | accent at 2-3% opacity |
| `--surface-1` | Lowest glass level | `rgba(255,255,255,0.02)` |
| `--surface-2` | Mid glass level | `rgba(255,255,255,0.04)` |
| `--surface-3` | Hover/active glass | `rgba(255,255,255,0.08)` |
| `--border` | Default border | `rgba(255,255,255,0.06)` |
| `--border-dim` | Subtle border | `rgba(255,255,255,0.04)` |
| `--text-1` | Primary text | `rgba(255,255,255,0.80)` |
| `--text-2` | Secondary text | `rgba(255,255,255,0.50)` |
| `--text-3` | Tertiary/muted | `rgba(255,255,255,0.30)` |
| `--text-4` | Ghost text | `rgba(255,255,255,0.15)` |

### Semantic Colors (non-themeable, always the same)

| Token | Value | Use |
|-------|-------|-----|
| `--live` | red-500 | Live badges, recording dots |
| `--success` | emerald-400 | Connected, completed |
| `--warning` | amber-400 | Alerts |
| `--error` | red-500 | Error states |
| `--creative` | purple-500 | Creative/thought badges |

### Per-Vertical Themes

Each vertical overrides `--accent`, `--accent-dim`, `--accent-glow`:

| Theme ID | Accent Color | HSL Reference |
|----------|-------------|---------------|
| `default` | `#a3e635` (lime-400) | 82 85% 55% |
| `music` | `#fbbf24` (amber-400) | 43 96% 56% |
| `art` | `#a78bfa` (violet-400) | 255 92% 76% |
| `photography` | `#d4d4d8` (zinc-300) | 240 5% 84% |
| `fashion` | `#fb7185` (rose-400) | 355 95% 70% |
| `architecture` | `#38bdf8` (sky-400) | 198 93% 60% |
| `film` | `#f59e0b` (amber-500) | 38 92% 50% |
| `writing` | `#a8a29e` (stone-400) | 30 6% 63% |
| `design` | `#e879f9` (fuchsia-400) | 292 91% 73% |
| `business` | `#2dd4bf` (teal-400) | 171 77% 50% |
| `data` | `#34d399` (emerald-400) | 160 67% 52% |
| `jewelry` | `#fde047` (yellow-300) | 51 95% 63% |
| `game` | `#818cf8` (indigo-400) | 235 90% 75% |
| `shader` | `#22d3ee` (cyan-400) | 186 94% 53% |
| `startup` | `#fb923c` (orange-400) | 27 96% 61% |
| `editorial` | `#a1a1aa` (zinc-400) | 240 5% 65% |
| `code` | `#a3e635` (lime-400) | 82 85% 55% |
| `community` | `#a3e635` (lime-400) | 82 85% 55% |

---

## Execution Phases

### Phase 1: Design System Foundation

**1A. Tailwind Config** — `tailwind.config.ts`
- Extend `colors` with semantic tokens mapping to CSS vars
- Add `accent`, `accent-dim`, `accent-glow`, `surface-1/2/3`, `border-default`, `border-dim`, `text-1/2/3/4`, `live`, `success`, `warning`, `error`, `creative`
- Extend `fontFamily` with `mono: ['var(--font-jetbrains-mono)', ...]`

**1B. CSS Custom Properties** — `globals.css`
- Define `:root` defaults for all tokens
- Define `[data-theme="music"]`, `[data-theme="art"]`, etc. overrides
- Remove old `--glow-cyan` and `.glow-cyan` references
- Add `.glow-accent` that uses `var(--accent-glow)`

**1C. InteriorLayout Theme Support** — `components/shared/interior_layout.tsx`
- Add `theme?: string` prop
- Apply `data-theme={theme}` to wrapper div
- Each page passes its vertical ID

### Phase 2: Shared Component Migration

**2A. VerticalPage Rewrite** — `components/VerticalPage.tsx`
- Remove emoji from config interface
- Replace hardcoded gradient with theme-aware accent
- Wrap in InteriorLayout with theme prop
- Use `bg-accent`, `text-accent`, `border-accent-dim` everywhere
- Replace all inline styles with design tokens
- Add JetBrains Mono, glass surfaces, card-lift, slide-up

**2B. Dashboard Layout** — `components/dashboard/nav-bar.tsx` + `app/(dashboard)/layout.tsx`
- Migrate to InteriorLayout or create DashboardLayout that shares the same tokens
- Replace hardcoded colors with semantic tokens

**2C. UI Primitives** — `components/ui/*.tsx`
- Audit button, card, badge, input, dialog, tabs, etc.
- Replace hardcoded Tailwind colors with semantic tokens
- Ensure all use design system classes

### Phase 3: Category Pages (12 pages)

All use VerticalPage — updating that component + removing emoji from each config cascades:
- `app/music/page.tsx` — remove emoji, set theme: 'music'
- `app/code/page.tsx` — remove emoji, set theme: 'code'
- `app/design/page.tsx` — remove emoji, set theme: 'design'
- `app/fashion/page.tsx` — remove emoji, set theme: 'fashion'
- `app/film/page.tsx` — remove emoji, set theme: 'film'
- `app/architecture/page.tsx` — remove emoji, set theme: 'architecture'
- `app/jewelry/page.tsx` — remove emoji, set theme: 'jewelry'
- `app/data/page.tsx` — remove emoji, set theme: 'data'
- `app/business/page.tsx` — remove emoji, set theme: 'business'
- `app/writing/page.tsx` — remove emoji, set theme: 'writing'
- `app/photography/page.tsx` — remove emoji, set theme: 'photography'
- `app/game/page.tsx` — remove emoji, set theme: 'game'
- `app/shader/page.tsx` — remove emoji, set theme: 'shader'
- `app/startup/page.tsx` — remove emoji, set theme: 'startup'

Each also needs metadata moved to layout.tsx (same issue as art page had).

### Phase 4: Standalone Pages

**4A. Agents Page** — `app/agents/page.tsx` (172 lines)
- Wrap in InteriorLayout
- Replace all cyan→accent tokens
- Remove avatar fallback gradients → use theme accent
- JetBrains Mono, glass cards, card-lift

**4B. Docs Page** — `app/docs/page.tsx` (249 lines)
- Wrap in InteriorLayout
- Replace cyan→accent tokens
- Code blocks use accent for highlights
- Tab active states use accent

**4C. Community Page** — `app/community/page.tsx` (237 lines)
- Wrap in InteriorLayout, theme: 'community'
- Replace cyan→accent, remove emoji icons from topic types
- Replace emoji-based category icons with SVG or text labels

**4D. Chat Page** — `app/chat/page.tsx` (336 lines)
- Wrap in InteriorLayout
- Remove emoji from channel definitions
- Replace with category labels or minimal icons

**4E. Showcase Page** — `app/showcase/page.tsx` (227 lines)
- Wrap in InteriorLayout
- Remove emoji from category filters and item displays
- Replace heart emoji with SVG icon

**4F. About Page** — `app/about/page.tsx` (141 lines)
- Wrap in InteriorLayout
- Remove emoji from category list
- Use text-only labels

**4G. Editorial Page** — `app/editorial/page.tsx` (203 lines)
- Wrap in InteriorLayout, theme: 'editorial'
- Remove emoji from category filters

### Phase 5: Landing Page

**5A. Landing Page** — `app/page.tsx` (1475 lines)
- Replace remaining cyan references with accent tokens
- The landing page uses lime as its global accent (no theme switching)
- Ensure consistency with interior pages

### Phase 6: Stream View Components

These already have per-type aesthetics. Migrate hardcoded colors to tokens:

- `components/ai/ArtStreamView.tsx` — uses theme accent
- `components/ai/ArtGalleryView.tsx` — uses theme accent
- `components/ai/MusicStreamView.tsx` — accent from music theme
- `components/ai/CodeStreamView.tsx` — accent from code theme
- `components/ai/VideoStreamView.tsx` — accent from film theme
- `components/ai/PhotoStreamView.tsx` — accent from photography theme
- `components/ai/ShaderStreamView.tsx` — accent from shader theme
- `components/ai/BusinessStreamView.tsx` — accent from business theme
- `components/ai/DataStreamView.tsx` — accent from data theme
- `components/ai/StartupStreamView.tsx` — accent from startup theme
- `components/ai/WritingStreamView.tsx` — accent from writing theme
- `components/ai/CreativeStreamView.tsx` — accent from default theme
- `components/ai/MusicCreationView.tsx` — accent from music theme

### Phase 7: Dashboard Pages

- `app/(dashboard)/dashboard/page.tsx`
- `app/(dashboard)/settings/page.tsx`
- `app/(dashboard)/settings/notifications/page.tsx`
- `app/(dashboard)/settings/privacy/page.tsx`
- `app/(dashboard)/credits/page.tsx`
- `app/(dashboard)/recordings/page.tsx`
- `app/(dashboard)/browse/page.tsx`
- `app/(dashboard)/search/page.tsx`
- `app/(dashboard)/help/page.tsx`
- `app/(dashboard)/profile/[username]/page.tsx`
- `app/(dashboard)/admin/*` (6 pages)

### Phase 8: Remaining Components

Audit and migrate all components in:
- `components/ai/` — creative response, follow, feed, notification, etc.
- `components/auth/` — login, signup forms
- `components/session/` — all session components
- `components/profile/` — profile components
- `components/community/` — room browser, chat, topics
- `components/credits/` — credit displays
- `components/onboarding/` — tours, modals
- `components/matchmaking/` — match cards
- `components/recordings/` — recording player, filters

### Phase 9: Cleanup & Verification

- `grep -r 'cyan' --include="*.tsx"` → zero results
- `grep -rn 'emoji' --include="*.tsx"` → zero emoji references (except type definitions)
- No hardcoded color classes outside semantic tokens
- `npm run build` passes clean
- Visual check: every page has consistent glass/grain/animation treatment

---

## Parallelization Strategy

```
Phase 1 [A+B+C] → Sequential (foundation must be solid first)
Phase 2 [A+B+C] → Parallel after Phase 1
Phase 3 [all 14] → Single batch (all are 21-line config changes after VerticalPage rewrite)
Phase 4 [A-G] → Parallel batches of 3-4
Phase 5 [A] → Independent
Phase 6 [all 13] → Parallel batches of 4-5
Phase 7 [all] → Parallel batches after dashboard layout decision
Phase 8 [all] → Parallel by directory
Phase 9 → Sequential verification
```

## Acceptance Criteria

1. Zero hardcoded color Tailwind classes (bg-lime-400, text-cyan-500, etc.) — all replaced with semantic tokens (bg-accent, text-muted-3)
2. Zero emoji characters in any .tsx file
3. Every page wrapped in InteriorLayout with appropriate theme
4. Each vertical has distinct accent color that cascades through all components
5. JetBrains Mono on all UI text, sans-serif on prose
6. Glass surfaces, film grain, card-lift, slide-up animations on every page
7. `npm run build` clean
8. Mobile responsive at 375px
