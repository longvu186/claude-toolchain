---
name: vue-tailwind-pwa
description: "WORKFLOW SKILL - Build and maintain Vue 3 + Tailwind + PWA applications. Use for Composition API patterns, Pinia store wiring, Vue Router code splitting, PWA service worker setup, Supabase client integration, i18n with Vietnamese-first locale, and Tailwind design token management. Trigger phrases: Vue component, Pinia store, composable, PWA service worker, Tailwind config, Supabase composable, i18n Vietnamese, Vue Router code split, script setup."
argument-hint: "Describe the Vue component, composable, store, or PWA feature to build."
---

# Vue 3 + Tailwind CSS + PWA Patterns

Proven patterns for building bilingual (Vietnamese-first) Vue 3 PWA applications with Tailwind CSS, Supabase, and Pinia.

## System-First UI Composition

- Repeated surfaces such as app headers, footers, cards, toolbars, empty states, form sections, and section shells should be implemented as shared Vue components, shared layout shells, or token-driven variants.
- If the same visual rule appears twice, promote it into Tailwind tokens, a reusable component, or a shared layout pattern instead of copying page-local utility stacks.
- Route views should primarily compose shared spacing, typography, color, border, radius, shadow, and interaction rules rather than redefining them per screen.
- Treat repeated page-local overrides on recurring surfaces as a design-system gap that should be fixed in the shared layer.

## When to Use

- Building or modifying Vue 3 SFC components with `<script setup>`
- Creating Pinia stores for domain state management
- Writing composables for shared logic
- Configuring Tailwind with project design tokens
- Setting up or debugging PWA service worker behavior
- Integrating Supabase client with typed queries
- Managing i18n for Vietnamese-first bilingual UI

## Component Patterns

### Standard SFC Structure

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStudentStore } from '@/stores/student-store'

const props = defineProps<{
  studentId: string
}>()

const emit = defineEmits<{
  updated: [id: string]
}>()

const store = useStudentStore()
const loading = ref(false)

const displayName = computed(() => store.currentStudent?.name ?? '')

onMounted(async () => {
  loading.value = true
  await store.fetchStudent(props.studentId)
  loading.value = false
})
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center p-8">
    <span class="animate-spin h-6 w-6 border-2 border-brand-teal border-t-transparent rounded-full" />
  </div>
  <div v-else class="bg-surface rounded-2xl shadow-md p-4">
    <h2 class="font-heading text-xl font-bold text-brand-navy">{{ displayName }}</h2>
  </div>
</template>
```

### Rules
- Always use `<script setup lang="ts">` — no Options API
- Use `defineProps<T>()` and `defineEmits<T>()` with TypeScript generics
- Prefer `ref`/`computed` over `reactive` for primitives
- Never import Supabase client directly in components — use stores or composables

## Rich Review / Retry Payload Contracts

When a modal, sheet, or detail surface re-displays learning content, keep the payload rich enough to preserve the linked media affordances from the source item.

```ts
type ReviewItem = {
  text: string
  audioKey: string | null
  imageKey?: string | null
}
```

### Rules
- Do not pass display text alone when the rendered content is expected to keep audio, image, or other replay affordances.
- Treat visible reference text and its linked media keys as one contract from the originating correct option or content record.
- Make the receiving modal derive interactivity from the rich payload (`audioKey`, `imageKey`, etc.), not by trying to rediscover media from the display string later.
- When tightening a modal contract, update the caller type and add a focused regression assertion for the user-visible affordance that depends on that metadata.

## Pinia Store Pattern

```ts
// stores/student-store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Database } from '@shared/types/database'

type Student = Database['public']['Tables']['students']['Row']

export const useStudentStore = defineStore('student', () => {
  const students = ref<Student[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const sorted = computed(() =>
    [...students.value].sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0))
  )

  async function fetchAll() {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('students')
      .select('*')
    if (err) error.value = err.message
    else students.value = data ?? []
    loading.value = false
  }

  return { students, loading, error, sorted, fetchAll }
})
```

### Rules
- One store per domain (students, rewards, lessons, auth)
- Use `defineStore` with setup function syntax (not options)
- All Supabase queries live in store actions — never in components
- Export readonly computed values for derived data

## Composable Pattern

```ts
// composables/use-countdown.ts
import { ref, onUnmounted } from 'vue'

export function useCountdown(seconds: number) {
  const remaining = ref(seconds)
  const expired = ref(false)

  const interval = setInterval(() => {
    if (remaining.value <= 0) {
      expired.value = true
      clearInterval(interval)
    } else {
      remaining.value--
    }
  }, 1000)

  onUnmounted(() => clearInterval(interval))

  return { remaining, expired }
}
```

### Rules
- File name: `use-*.ts` (kebab-case with `use` prefix)
- Export a single function named `use*`
- Clean up side effects in `onUnmounted`
- Don't access stores inside composables unless explicitly needed

## Responsive Control Switching

Use breakpoint-driven control swaps when mobile and desktop need different interaction density.

```ts
import { computed } from 'vue'
import { useBreakpoints } from '@vueuse/core'

const breakpoints = useBreakpoints({ desktop: 1024 })
const isDesktop = breakpoints.greaterOrEqual('desktop')

const branchControlMode = computed(() => (isDesktop.value ? 'segmented' : 'select'))
```

### Rules
- Keep one shared reactive value for the selected option; only the rendered control changes.
- Prefer dropdown/select on mobile for long or variable option lists.
- Prefer pills, tabs, or segmented controls on desktop when horizontal space is stable.
- Add a stable test hook (`data-testid`) to the mobile control when it is part of release gating.

## Progress-Driven Expansion Helpers

When a progress surface needs to auto-expand the currently active or partially completed container, derive that state with a small helper instead of overloading unlock logic.

```ts
function isUnitInProgress(unitId: string): boolean {
  const unitLessons = curriculum.getLessonsForUnit(unitId) || []
  if (unitLessons.length === 0) return false

  const completedCount = unitLessons.filter((lesson) => completedLessonIds.value.has(lesson.id)).length
  return completedCount > 0 && completedCount < unitLessons.length
}
```

### Rules
- Keep progress-driven expansion separate from entitlement or unlock checks.
- Use the helper for default expansion/readability, not permission decisions.
- Pair the helper with screenshot validation on the primary mobile viewport when expansion behavior is part of a reported regression.

## Tailwind Design Token Integration

### Tailwind CSS v4: @theme Directive (Preferred)

Tailwind v4 uses `@theme` in CSS instead of `tailwind.config.js`:

```css
/* main.css */
@import "tailwindcss";

@theme {
  --color-duo-green: #58CC02;
  --color-duo-green-dark: #58A700;
  --color-duo-border: #E5E5E5;
  --color-duo-text: #4B4B4B;
  --color-duo-text-muted: #AFAFAF;
  --color-duo-gray-light: #F7F7F7;
  --font-sans: 'DM Sans', sans-serif;
}
```

This auto-generates utility classes: `bg-duo-green`, `text-duo-text`, `border-duo-border`, `font-sans`.

### Rules (v4)
- Define all tokens inside `@theme { }` block using `--color-*`, `--font-*`, `--spacing-*` custom properties
- No `tailwind.config.js` needed — CSS is the single source of truth
- Hex values directly (no RGB channel workaround needed in v4)
- Update `styling.instructions.md` when adding new tokens

### Tailwind CSS v3: CSS Custom Properties + Config (Legacy)

```css
@layer base {
  :root {
    --color-brand-teal: 22 190 207;    /* #16BECF */
    --color-brand-navy: 24 47 123;     /* #182F7B */
    --color-brand-gold: 230 160 0;     /* #E6A000 */
    --color-text-primary: 52 64 84;    /* #344054 */
    --font-heading: 'Barlow', sans-serif;
    --font-body: 'Nunito', sans-serif;
  }
}
```

### tailwind.config.ts Extension

```ts
export default {
  theme: {
    extend: {
      colors: {
        'brand-teal': 'rgb(var(--color-brand-teal) / <alpha-value>)',
        'brand-navy': 'rgb(var(--color-brand-navy) / <alpha-value>)',
        'brand-gold': 'rgb(var(--color-brand-gold) / <alpha-value>)',
      },
      fontFamily: {
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)'],
      },
    },
  },
}
```

### Rules
- All colors defined as CSS custom properties with RGB channels (no hex in Tailwind config)
- Font families reference CSS custom properties
- Never hardcode color hex values in templates — always use `brand-*` or `text-*` classes
- Update `styling.instructions.md` when adding new tokens

## Router Code Splitting

```ts
const routes = [
  { path: '/login', component: () => import('@/views/StudentLogin.vue') },
  {
    path: '/',
    component: () => import('@/views/StudentLayout.vue'),
    children: [
      { path: 'dashboard', component: () => import('@/views/Dashboard.vue') },
      { path: 'level-map', component: () => import('@/views/LevelMap.vue') },
    ],
  },
]
```

### Rules
- Always use dynamic `import()` for route components
- Nest child routes under layout components
- Auth guard via `beforeEach` checking Supabase session

## PWA Service Worker

Key patterns for offline-first PWA:
- Cache static assets on install (app shell strategy)
- Cache API responses with stale-while-revalidate for lesson data
- Skip waiting on update to activate new SW immediately
- Register in `main.ts` with `registerSW({ immediate: true })`

## i18n (Vietnamese-First)

```ts
// i18n/vi.ts
export default {
  login: { title: 'Đăng nhập', forgotPin: 'Quên mật khẩu' },
  nav: { dashboard: 'Thống kê', leaderboard: 'Bảng xếp hạng' },
}
```

### Rules
- Vietnamese is default locale — all strings go through i18n
- Never hardcode Vietnamese text in `<template>`
- Use `$t('key')` or `t('key')` from `useI18n()`
- Preserve Vietnamese diacritics exactly in source strings and rendered UI. `Tiếng Việt` is correct; `Tieng Viet` is not.
- Prefer idiomatic Vietnamese labels over literal English calques for tabs, buttons, placeholders, and status text.
- Keep one terminology and casing system across the locale. Avoid mixed English/Vietnamese controls unless product copy explicitly requires it.
- Proofread high-salience strings in context after translation changes: nav, CTA labels, placeholders, errors, and badges.

## Layout Anti-Patterns

| Anti-Pattern | Symptom | Fix |
|-------------|---------|-----|
| `overflow-auto` on root | Whole page scrolls including sidebar | Fixed viewport height on root, `overflow-y-auto` only on center panel |
| Dark text on dark bg | Unreadable content | Content goes inside WHITE card — dark text on white |
| White text in content area | Looks wrong on light card | Only sidebar/nav use white text on dark bg |
| Missing `min-h-0` on flex child | Content doesn't scroll | Add `min-h-0` to scrollable flex children |
| Logo cropping | Sidebar logo cut off | Use `object-contain` + explicit size + `flex-shrink-0` |

## Verification Checklist

- [ ] Component uses `<script setup lang="ts">`
- [ ] No direct Supabase calls in components
- [ ] Colors use design token classes, not hardcoded hex
- [ ] Fonts use `font-heading` / `font-body` classes
- [ ] Route uses dynamic import
- [ ] i18n strings not hardcoded in template
- [ ] Vietnamese copy keeps native diacritics and natural phrasing on high-salience surfaces
- [ ] Build passes: `npm run typecheck && npm run build`
