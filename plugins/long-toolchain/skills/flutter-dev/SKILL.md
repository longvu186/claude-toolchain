---
name: flutter-dev
description: "**WORKFLOW SKILL** - Build and optimize Flutter apps with modern widget patterns, state management, navigation, and performance profiling. Use when: build Flutter app, Riverpod or Bloc setup, GoRouter navigation, Flutter widget architecture, Flutter performance optimization, Flutter widget testing."
argument-hint: "Provide app type, target platforms, preferred state management (Riverpod/Bloc), and priority screens/flows."
portability: adapt-port
source-skill: MiniMax-AI/skills/skills/flutter-dev
overlap-gate:
  existing-skill: frameworks/nextjs-static-export-reliability
  overlap-score: 23
  decision: create-new
---

# Flutter Dev

Portability tag: adapt-port.

Use this skill for production-oriented Flutter delivery across app architecture, state handling, and runtime performance.

## When to Use

- Starting a Flutter app with scalable structure
- Choosing and applying Riverpod or Bloc patterns
- Setting up typed navigation with GoRouter
- Profiling and reducing jank in complex UIs
- Building widget, unit, and integration test coverage

## Procedure

### Phase 1: Foundation

1. Confirm supported platforms and baseline Flutter/Dart versions.
2. Set feature-oriented folder structure and shared design tokens.
3. Establish coding standards for widget composition and state boundaries.

### Phase 2: State and Navigation

1. Select state strategy (Riverpod for composable state, Bloc for event-heavy domains).
2. Define provider/bloc ownership per feature to prevent cross-module coupling.
3. Configure route structure, guards, and deep-link behavior with GoRouter.

### Phase 3: UI and Performance

1. Apply const-first widget patterns to reduce rebuilds.
2. Use builder-based lists and isolate expensive computations.
3. Profile early with DevTools and track frame/render regressions.

### Phase 4: Test and Release

1. Add widget tests for UI contracts and edge states.
2. Add unit tests for business logic and state transitions.
3. Add integration tests for critical user journeys.

## Safety Defaults and Fallback Behavior

- Do not optimize blindly; measure with profiling tools first.
- If plugin compatibility is uncertain, gate platform-specific behavior behind feature flags.
- If Riverpod/Bloc choice is unclear, start with the simpler team-familiar option and document trade-offs.
- If performance targets are missed, degrade non-essential animations before reducing core UX behaviors.

## Output Checklist

- Architecture and state strategy documented
- Navigation model and guards defined
- Performance baselines measured
- Test plan and coverage scope included
