---
name: android-native-dev
description: "**WORKFLOW SKILL** - Build production Android native apps with Kotlin + Jetpack Compose, Gradle baseline reliability, flavor/build variant discipline, and Play Store readiness. Use when: build Android app, Kotlin Compose UI, Android native feature, Gradle Android troubleshooting, mobile release hardening, Android accessibility implementation."
argument-hint: "Provide project state (new/existing), minSdk/targetSdk goals, architecture preference, and release constraints."
portability: adapt-port
source-skill: MiniMax-AI/skills/skills/android-native-dev
overlap-gate:
  existing-skill: frameworks/react-native-dev
  overlap-score: 58
  decision: create-new
---

# Android Native Dev

Portability tag: adapt-port.

Use this skill to ship Kotlin/Compose Android features with reliable build and release behavior.

## When to Use

- Building a new Android native app or a major Android feature
- Stabilizing Gradle, AGP, or flavor/build variant issues
- Implementing Compose-first UI with accessibility requirements
- Hardening Android release quality before distribution

## Procedure

### Phase 1: Baseline and Build Health

1. Classify project scenario (empty, partial, existing Android Studio project).
2. Validate wrapper plus Gradle/AGP/Kotlin compatibility first.
3. Require a passing local baseline build before feature work.

### Phase 2: Architecture and Environment Strategy

1. Keep UI, domain, and data module boundaries explicit.
2. Define API/repository contracts and typed error envelopes.
3. Configure deterministic product flavors for dev/staging/prod.

### Phase 3: Compose UI and Accessibility

1. Prefer Material 3 components and semantic typography tokens.
2. Enforce touch targets, contrast, and TalkBack coverage.
3. Keep state hoisted and side effects isolated.

### Phase 4: Quality and Release

1. Add unit, integration, and instrumentation tests for critical flows.
2. Validate signing, shrinking/proguard, and crash reporting hooks.
3. Prepare release, rollback, and versioning checklist.

## Safety Defaults and Fallback Behavior

- Never hardcode secrets, tokens, keystore passwords, or production URLs in source.
- If variant complexity blocks progress, reduce to a single stable debug variant first.
- If Compose migration is blocked, isolate view interoperability as an explicit temporary bridge.
- If release gates fail, stop rollout and ship only validation artifacts.

## Output Checklist

- Baseline build and toolchain compatibility validated
- Module boundaries and flavor strategy documented
- Accessibility and quality gates passed
- Release and rollback plan recorded
