---
name: ios-application-dev
description: "**WORKFLOW SKILL** - Build production iOS applications with Swift, SwiftUI/UIKit interoperability, Apple HIG compliance, accessibility-first interaction patterns, and release hardening. Use when: build iOS app, SwiftUI layout implementation, UIKit integration, iOS accessibility review, App Store release preparation, iPhone UI architecture."
argument-hint: "Provide app type, UI stack preference (SwiftUI/UIKit mix), navigation model, and release constraints."
portability: adapt-port
source-skill: MiniMax-AI/skills/skills/ios-application-dev
overlap-gate:
  existing-skill: frameworks/react-native-dev
  overlap-score: 54
  decision: create-new
---

# iOS Application Dev

Portability tag: adapt-port.

Use this skill to implement iOS experiences that follow Apple platform conventions and remain resilient in production.

## When to Use

- Building new iPhone app surfaces in SwiftUI or UIKit
- Migrating between UIKit and SwiftUI while keeping behavior stable
- Enforcing accessibility, Dynamic Type, and Dark Mode quality
- Preparing App Store ready builds with platform-safe defaults

## Procedure

### Phase 1: Platform Baseline

1. Confirm deployment targets, device classes, and build configuration.
2. Define app shell: Tab, NavigationStack, and modal patterns.
3. Establish semantic color and typography tokens before UI buildout.

### Phase 2: UI Architecture

1. Keep feature boundaries clear between view, state, and data services.
2. Use reusable components with consistent spacing and interaction rules.
3. Preserve safe-area behavior and thumb-zone friendly primary actions.

### Phase 3: Accessibility and System Integration

1. Enforce VoiceOver labels, Dynamic Type scaling, and contrast thresholds.
2. Respect Reduce Motion and other accessibility environment settings.
3. Request permissions contextually and maintain usable no-permission paths.

### Phase 4: Reliability and Release

1. Add unit/UI testing for navigation, forms, and critical business flows.
2. Verify lifecycle handling for backgrounding, interruptions, and recovery.
3. Prepare release checklist for signing, analytics/crash hooks, and review compliance.

## Safety Defaults and Fallback Behavior

- Never gate core navigation behind unsupported gestures or hidden menus.
- If SwiftUI constraints block delivery, isolate UIKit fallback components with clear boundaries.
- If accessibility checks fail, treat as release blockers, not cosmetic backlog.
- If permission-dependent features fail, provide graceful degraded behavior instead of dead-end UI.

## Output Checklist

- Baseline shell and design tokens established
- Accessibility and system integration checks completed
- Navigation and lifecycle paths validated
- Release checklist and rollback path prepared
