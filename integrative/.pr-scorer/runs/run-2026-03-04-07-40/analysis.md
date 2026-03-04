## SWOT Analysis: PR Impact Scoring System

---

### Strengths
- **High-confidence categories dominate**: trivial, bugfix, feature, auth, api, database, performance, and tests all hit 100% — the model handles well-defined, unambiguous changes reliably
- **Score 3 is rock-solid**: 13/13 accuracy suggests the "moderate" band is well-calibrated with clear examples and anchors
- **Score 1 is clean**: 4/4 on trivial changes; the low-end boundary is well-defined
- **Business impact logic works**: Security severity trumping code size is correctly applied in most cases (SQL injection, auth bypass examples)

---

### Weaknesses
- **Score 2 is the weakest band**: 57% (4/7) — the model struggles most at the minor/trivial and minor/moderate boundaries
- **Systematic over-scoring bias**: 2 of 4 failures are over-scores (security-dependency-patch, deps-new-library scored 3 instead of 2); the model inflates impact when "interesting" concepts appear (security, new library)
- **Infrastructure is under-valued**: infra-kubernetes scored 3 instead of 5 — the model doesn't recognize that deployment infrastructure (K8s manifests, scaling, networking) constitutes an architectural/system-level change
- **CI is under-valued**: ci-add-workflow scored 1 instead of 2 — adding a workflow (45 LOC, new capability) is treated as a config tweak rather than a minor addition
- **"New integration" label is over-triggered**: deps-new-library gets bumped to 3 because the prompt explicitly lists "new integration" as a score-3 pattern, but adding a small utility library doesn't meet that bar

---

### Opportunities

**1. Fix score-2 over-scoring for security patches and deps (fixes 2 fixtures: security-dependency-patch, deps-new-library)**
Add explicit guidance:
```
- Dependency version bump that patches a security CVE = 2 (Minor), not 3
  (the fix is upstream; this PR is just updating a number)
- Adding a small utility/validation library with minimal integration = 2 (Minor)
  "New integration" at score 3 means a new external service, API, or architectural pattern,
  not adding an npm package
```

**2. Fix infrastructure under-scoring (fixes 1 fixture: infra-kubernetes)**
Add to score-5 guidance:
```
- New deployment infrastructure (Kubernetes manifests, Terraform, Docker Compose for prod)
  = 5 (Major) — defines how the system runs in production, equivalent to a new system
```

**3. Fix CI under-scoring (fixes 1 fixture: ci-add-workflow)**
Clarify score-2 vs score-1 for config:
```
- Adding a CI/CD workflow (new capability, affects all future code) = 2 (Minor)
- Tweaking an existing CI config (timeout, env var) = 1 (Trivial)
```

**Priority order**: Change 1 addresses the most failures (2) and the most common failure mode (over-scoring at the score-2 boundary). Changes 2 and 3 each fix one fixture but address a systematic conceptual gap.

---

### Threats
- **Score 2 fixture gap**: 7 fixtures at score 2 but failures cluster there — more diverse score-2 fixtures (different categories) would expose whether the fixes above generalize or just overfit
- **"New integration" ambiguity is a latent risk**: The prompt uses the term for both score-3 patterns and score-2 deps; without the clarification above, model drift or rephrased PRs could re-trigger the same over-scoring
- **Infra category is under-represented**: Only 3 fixtures, 1 failure — K8s was a significant miss (off by 2). More infra fixtures (Terraform, Helm, Docker) needed to validate the fix
- **Security scoring is bimodal and fragile**: The prompt correctly separates CVE severity (2 vs 5) but the model conflates "security-related" with "high impact" — any new security framing in a PR title risks score inflation
- **CI category has only 2 fixtures**: 50% pass rate on 2 samples is statistically unreliable; a single edge case dominates the category score
