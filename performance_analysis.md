# Trip Rebuild Pipeline — Performance Analysis

**Date:** 2026-03-21
**Trip:** Budapest, Hungary (12 days, Russian)
**Model:** Claude Opus 4.6 (1M context)

---

## Pipeline Overview

| Step | Duration | % of Total | Notes |
|------|----------|-----------|-------|
| **Phase A** (overview + manifest) | 100s (1m 40s) | 4.7% | Web research + overview table + manifest |
| **Phase B** (12 days, 4 batches) | 729s (12m 9s) | 34.5% | Parallel day generation |
| **Budget** | 48s | 2.3% | Read all days + write budget_ru.md |
| **Assembly (MD)** | 20s | 0.9% | Concatenate trip_full_ru.md (1,479 lines) |
| **HTML Render** (6 fragment agents) | 650s (10m 50s) | 30.8% | Shell + 6 parallel fragments + assembly |
| **Regression** (Playwright) | 52s | 2.5% | 124 tests, 118 passed, 6 failed |
| **Fixes + Re-runs** | 515s (8m 35s) | 24.3% | HTML fixes + 2 re-runs |
| **Pipeline Total** | **2,114s (35m 14s)** | **100%** | End-to-end |

---

## Phase B — Agent Init vs Generation Time

### Per-Batch Breakdown

| Batch | Days | Init Time | Generation Time | Total | Tokens | Tool Calls |
|-------|------|-----------|-----------------|-------|--------|------------|
| Batch 1 | 0, 1, 2 | 64s | 421s (7m 1s) | 485s | 67,164 | 51 |
| Batch 2 | 3, 4, 5 | 90s | 602s (10m 2s) | 692s | 78,271 | 61 |
| Batch 3 | 6, 7, 8 | 103s | 575s (9m 35s) | 678s | 73,939 | 56 |
| Batch 4 | 9, 10, 11 | 128s | 430s (7m 10s) | 558s | 62,257 | 48 |
| **Wall clock** | | | | **692s (11m 32s)** | **281,631** | **216** |

### Init Time Staggering

```
Batch 1: ████████ 64s
Batch 2: ███████████ 90s  (+26s)
Batch 3: █████████████ 103s (+13s)
Batch 4: ████████████████ 128s (+25s)
```

**Root cause:** The platform serializes Agent tool call setup even when all 4 are sent in a single response block. Each agent needs resource allocation + context copying. The ~25-30s gap between each is the per-agent setup cost.

### Generation Time Variance

```
Batch 1 (days 0-2): ██████████████████████████████████████████ 421s — Day 0 is arrival (short), days 1-2 are full
Batch 4 (days 9-11): ██████████████████████████████████████████ 430s — Day 11 is departure (short)
Batch 3 (days 6-8):  █████████████████████████████████████████████████████████ 575s
Batch 2 (days 3-5):  ████████████████████████████████████████████████████████████ 602s — BOTTLENECK
```

**Why Batch 2 is slowest:** Days 3-5 (Margaret Island, Buda Hills, Central Pest) required the most research — Children's Railway Sunday schedule verification, Central Market Monday hours check (turned out to be open, contradicting initial assumption), Csodák Palotája operating hours.

---

## HTML Render — Breakdown

### Fragment Generation (6 parallel agents)

| Fragment | Init Time | Generation Time | Total | Tokens | Tool Calls |
|----------|-----------|-----------------|-------|--------|------------|
| Overview | 19s | 47s | 66s | 19,394 | 4 |
| Budget | 28s | 33s | 61s | 17,705 | 4 |
| Day batch 1 (0-2) | 52s | 266s (4m 26s) | 318s | 48,695 | 9 |
| Day batch 2 (3-5) | 60s | 386s (6m 26s) | 446s | 84,866 | 13 |
| Day batch 3 (6-8) | 64s | 365s (6m 5s) | 429s | 90,368 | 15 |
| Day batch 4 (9-11) | 77s | 251s (4m 11s) | 328s | 69,854 | 14 |
| **Wall clock** | | | **446s (7m 26s)** | **330,882** | **59** |

### Render Pipeline Sub-steps

| Sub-step | Duration | Notes |
|----------|----------|-------|
| Context loading (5 files) | ~24s | rendering-config, dev rules, base layout, CSS, TripPage.ts |
| Shell fragments (nav) | ~37s | 14 sidebar links + 14 mobile pills |
| Fragment agents (parallel) | ~446s | 6 agents, bottleneck = Day batch 2 |
| HTML assembly (Python) | ~32s | CSS inlining + fragment concatenation |
| Pre-regression validation | ~17s | 11-point structural check |

---

## Per-Day Content Metrics

| Metric | Average | Range |
|--------|---------|-------|
| Lines per day file | 123.5 | 50–152 |
| POI sections per day | 9.25 | 2–10 |
| External URLs per day | 17.5 | 8–21 |
| Unique external sites per day | 7 | 2–9 |
| Google Maps links per day | 9 | 2–10 |

### Work Ratio per Day Agent

| Activity | % of Time | What It Does |
|----------|-----------|--------------|
| **Web research** | ~40% | WebSearch calls for hours, prices, "Only Here" attractions, holiday checks |
| **Content generation** | ~35% | Writing POI narratives, schedule tables, pricing, pro-tips |
| **Structural formatting** | ~15% | Markdown structure, links, budget tables, backup plans |
| **Rules compliance** | ~10% | CEO audit, POI parity check, age-appropriateness, avoidance list |

---

## Agent Overhead Analysis

### Total Agent Init Overhead

| Phase | Agents Spawned | Total Init Overhead | % of Phase Time |
|-------|---------------|--------------------|-----------------|
| Phase B | 4 | ~250s | 34% |
| HTML Render | 6 | ~300s | 46% |
| **Total** | **10** | **~550s (9m 10s)** | **26% of pipeline** |

### Token Consumption

| Phase | Tokens | Tool Calls |
|-------|--------|------------|
| Phase A (main agent) | ~15,000 | 8 |
| Phase B (4 agents) | 281,631 | 216 |
| HTML Render (6 agents) | 330,882 | 59 |
| Regression (main agent) | ~5,000 | 6 |
| **Total** | **~632,500** | **~289** |

---

## Optimization Opportunities

### High Impact

| Optimization | Est. Savings | Current | After | How |
|---|---|---|---|---|
| **POI pre-cache agent** | -30-40% on Phase B | 729s | ~400s | One research agent builds POI database before Phase B. Day agents format only, no redundant searches |
| **Reduce agent count** | -25% on init overhead | 10 agents, 550s init | 6 agents, ~330s | Merge overview+budget into main agent (they're tiny). Use 3 render batches instead of 4+2 |
| **Cache rendering rules** | -15% on Render | 650s | ~550s | Pass rendering-config as pre-parsed rules, not full 300-line file |

### Medium Impact

| Optimization | Est. Savings | How |
|---|---|---|
| **Parallel Phase A research** | -30s on Phase A | Run web searches for events/holidays in parallel |
| **Skip live verification for revisits** | -15-20% on Phase B | If same destination was generated before, reuse cached POI data |
| **Smaller batches, more parallelism** | -10% on Phase B | 6 batches of 2 days (but higher init overhead) |
| **Template POI cards** | -10% on Render | Pre-generate HTML skeleton, agents fill variables only |

### Low Impact (Already Optimized)

| Area | Status | Notes |
|---|---|---|
| Budget aggregation | 48s | Mechanical — no room to optimize |
| MD assembly | 20s | Mechanical concat — already fast |
| HTML assembly | 32s | Python script — already fast |
| Regression | 52s | Playwright parallelized, 7 workers |

---

## Projected Optimized Pipeline

If all high-impact optimizations were applied:

| Step | Current | Optimized | Savings |
|------|---------|-----------|---------|
| Phase A | 100s | 70s | -30s |
| POI pre-cache (new) | — | 120s | +120s |
| Phase B | 729s | 400s | -329s |
| Budget + Assembly | 68s | 68s | 0 |
| HTML Render | 650s | 450s | -200s |
| Regression | 52s | 52s | 0 |
| **Total** | **~2,114s (35m)** | **~1,160s (19m)** | **-45%** |

---

## Regression Results

**Run:** 124 tests, 118 passed (95.2%), 6 failed

| Failure | Category | Root Cause |
|---------|----------|------------|
| Activity label language format (2) | Content quality | Some POI labels missing "/" separator between Hungarian/Russian |
| Assembly order check (1) | Test reliability | Intermittent compareDocumentPosition issue |
| Pro-tip coverage (1) | Content quality | Some POI cards generated without pro-tip div |
| Link type coverage (1) | Content quality | Some POIs missing one of Maps/Site/Photo links |
| Duplicate POI name (1) | Content quality | Városligeti Nagyjátszótér appears in Day 2 and Day 8 |
