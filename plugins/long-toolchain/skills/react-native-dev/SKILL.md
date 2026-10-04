---
name: react-native-dev
description: "**WORKFLOW SKILL** - Build React Native and Expo apps with scalable architecture, navigation, state, performance, and release workflows. Use when: build React Native app, Expo app setup, React Native navigation, mobile app performance tuning, NativeWind styling, RN testing and deployment."
argument-hint: "Provide Expo vs bare RN preference, target platforms, navigation style, and core product flows."
portability: adapt-port
source-skill: MiniMax-AI/skills/skills/react-native-dev
overlap-gate:
  existing-skill: frameworks/nextjs-static-export-reliability
  overlap-score: 31
  decision: create-new
---

# React Native Dev

Portability tag: adapt-port.

Use this skill for shipping production-ready React Native apps with Expo-aware workflows and platform-safe defaults.

## When to Use

- Building new React Native/Expo products
- Implementing navigation, forms, and async data flows
- Improving app responsiveness and startup performance
- Adding native capabilities (camera, notifications, location)
- Preparing App Store and Play Store release pipelines

## Procedure

### Phase 1: Project Setup

1. Confirm Expo-managed or bare workflow.
2. Establish module boundaries for components, state, services, and screens.
3. Configure environment variables and API endpoints per environment.

### Phase 2: Core App Patterns

1. Implement navigation hierarchy and route protection patterns.
2. Define state strategy (local UI, shared app, server state) clearly.
3. Standardize API client behavior for auth, retries, and error translation.

### Phase 3: Performance and Native Capability

1. Use performant list/image primitives for large datasets.
2. Profile rendering and interaction latency in realistic scenarios.
3. Implement permissions and native APIs with explicit fallback UX.

### Phase 4: Quality and Delivery

1. Add unit and component tests for critical paths.
2. Add E2E flows for authentication and core value journeys.
3. Prepare build/signing/deployment checklist for both stores.

## Safety Defaults and Fallback Behavior

- Never block core navigation on optional native permissions.
- If native module support is uncertain, provide feature-gated fallbacks.
- If build pipelines fail, revert to deterministic local build path and log blockers.
- Keep API secrets out of client code; use secure env injection strategies.

## Output Checklist

- Project architecture and workflow selected
- Navigation and state boundaries defined
- Performance hotspots measured and addressed
- Store release and QA plan documented
