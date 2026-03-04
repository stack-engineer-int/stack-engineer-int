## SWOT Analysis: PR Impact Scoring System

### Strengths
- **Breadth of accuracy**: 8 of 12 categories at 100% — security, auth, api, bugfix, performance, tests, ci, deps all nail their expected scores consistently
- **Extreme scores are reliable**: Score 1 (100%) and Score 2 (100%) show the model confidently handles trivial/minor changes without false inflation
- **Security heuristics work well**: Explicit mappings (SQL injection → 5, XSS → 3) are clearly internalized and applied correctly
- **90% overall pass rate** is a strong baseline with only 3 failures across 31 fixtures

---

### Weaknesses
- **Score 3 is the weakest band** (85%, 11/13) — the model struggles most at the moderate tier, both under- and over-scoring into it
- **Systematic under-scoring bias**: 2 of 3 failures are under-scores; the model defaults conservative when uncertain
- **"feature" category is broken** (50%, 1/2) — the model undersells UI features that introduce new state/architecture
- **Database migrations are misclassified** (db-migration-data off by 2): The model treats data migrations as pure refactors, missing the irreversibility and production data risk that elevates them
- **Infrastructure scope conflation**: The model can't reliably distinguish "dev-only Docker" from "prod deployment infrastructure," leading to over-scoring local tooling

---

### Opportunities

**1. Fix `db-migration-data` (highest priority — off by 2 points)**
Add explicit guidance for data migrations:
> "Schema migrations that move/transform existing production data (not just DDL) = 5 (Major) — irreversible, affects live records, high blast radius even if LOC is modest"

The current rationale shows the model sees "significant refactor" but caps at 3. The missing signal is **data irreversibility**, not code complexity.

**2. Fix `infra-docker` (over-scored by 2)**
Tighten the infrastructure heuristic to distinguish environment scope:
> "Docker/containerization for **local development only** (no prod deployment, no CI integration) = 3 (Moderate) — improves DX but doesn't define production runtime. Docker Compose/Kubernetes for **production or CI** = 5 (Major)"

The current prompt says "Docker Compose for prod = 5" but the model applied it to a dev-only setup, suggesting the scope qualifier isn't prominent enough.

**3. Fix `feature-dark-mode` (under-scored by 1)**
Add a clarifying example for UI features that introduce new state:
> "A UI feature that introduces a new state store, new component, and user-facing behavior = 3 (Moderate), even if it doesn't touch backend logic. 'Small feature' (score 2) means a single self-contained change with no new abstractions."

The model's own rationale ("new state store and component") contains the right evidence but draws the wrong conclusion — the prompt's score-2 example of "small feature" is too broad and is capturing this case.

---

### Threats
- **Score 3 fixture coverage is thin** (13 fixtures) and already the weakest band — more edge cases here will likely expose further failures
- **Rationale-evidence mismatch**: In `feature-dark-mode`, the model identified the right signals but scored wrong anyway, suggesting prompt language is ambiguous rather than the model lacking context — future model versions could amplify this unpredictably
- **"Local vs. prod" infrastructure distinction** is inherently context-dependent; if PR descriptions don't explicitly state environment scope, the model will guess, creating noise
- **No score-8 fixtures**: Critical/foundational changes are untested — a false positive here would be high-cost and invisible until a real PR triggers it
- **Category label leakage**: The model may be using the PR title prefix (`feat:`, `fix:`) as a scoring shortcut rather than analyzing diff content, which would degrade on mislabeled PRs
