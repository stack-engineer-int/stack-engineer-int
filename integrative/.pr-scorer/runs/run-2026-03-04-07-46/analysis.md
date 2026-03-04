## SWOT Analysis: PR Impact Scoring System

### Strengths
- **Near-perfect accuracy (97%)** across 11 of 12 categories — the rubric is well-calibrated for most change types
- **Score distribution is balanced**: handles both extremes (1, 5) and middle values (2) with 100% accuracy; no systematic floor/ceiling bias
- **Security scoring is reliable** (3/3): the explicit CVE/injection/XSS hierarchy with named scores is working as intended
- **Dependency and infra scoring** (6/6 combined) shows the granular guidance (prod vs. dev, breaking vs. minor) is effective
- **Ambiguous categories like auth and API** (5/5 combined) score correctly, suggesting the blast-radius framing resonates with the model

---

### Weaknesses
- **CI category is the sole failure point (50%)**: the model over-scored a 2-file, 90-LOC Vercel config addition by 2 full Fibonacci steps
- **Systematic bias in the CI/CD guidance is contradictory**: the prompt says "New deployment infrastructure for production or CI = 5 (Major)" but also "Adding a CI/CD workflow = 2 (Minor)" — these rules directly conflict when a CI file *is* the deployment infrastructure (e.g., Vercel preview/production config)
- **The rationale reveals the model latched onto "production deployment infrastructure"** and applied the Terraform/Kubernetes rule to what is effectively a CI workflow file, ignoring the 2-file/90-LOC signal that should push toward moderate, not major
- **Score 3 is the weakest band (92%)**: the only miss lives here, suggesting the 3↔5 boundary near CI/deployment is under-specified

---

### Opportunities
*(Ordered by expected fixture impact)*

1. **Fix the CI/deployment contradiction** *(fixes the one known failure, prevents recurrence)*
   - The current prompt lists both "New deployment infrastructure for CI = 5" and "Adding a CI/CD workflow = 2" without distinguishing them
   - Add a clarifying rule: *"Vercel/Netlify/GitHub Actions deployment configs (preview + production) = 3 (Moderate) — they define delivery but are platform-managed, not self-hosted infrastructure. Reserve score 5 for self-managed infrastructure-as-code: Kubernetes manifests, Terraform, Docker Compose for prod servers."*
   - This creates a clear 3-tier ladder: CI tweak (1) → new workflow/managed deployment (2–3) → self-managed IaC (5)

2. **Add a tiebreaker heuristic for the 3↔5 boundary**
   - When a change is ambiguous between 3 and 5, instruct the model to ask: *"Does this change require human operational intervention to roll back, or does the platform handle it?"* Platform-managed (Vercel, Netlify) = 3; self-managed = 5
   - This prevents LOC-small but label-heavy changes from being inflated

3. **Add a CI-specific example** to the Examples section:
   - *"Example 4: Vercel deployment workflow → Score 3, Confidence 0.80 — Adds preview and production deployment via managed platform. Improves delivery but platform handles rollback and infra; not equivalent to self-managed IaC."*

4. **Stress-test score 3 fixtures** — it's the thinnest band (one miss already). Add fixtures covering: new GitHub Actions workflow (expected 2), Vercel config (expected 3), Terraform module (expected 5) to pin the ladder explicitly

---

### Threats
- **Prompt contradiction is a latent risk multiplier**: the CI rule conflict will likely cause more failures as CI-adjacent PRs grow in variety (Render, Railway, Fly.io configs all look like "deployment infrastructure")
- **Model drift on boundary cases**: the 3↔5 line is the most subjective; future model versions may weight "production" language more heavily and inflate scores further
- **Fixture coverage gaps**: only 2 CI fixtures, both at the boundary — no fixture for a pure CI tweak (score 1) or a Terraform-level change (score 5) in this category, so regressions in either direction would go undetected
- **LOC as a weak signal**: the model correctly ignores LOC for security fixes but may inconsistently use it as a tiebreaker elsewhere; the prompt doesn't explicitly address when LOC *should* influence scoring vs. when it shouldn't
- **Rationale overfitting**: the model's rationale for the failure quoted prompt language almost verbatim ("new deployment infrastructure for production"), suggesting it pattern-matches on keywords rather than reasoning about operational impact — a rephrased PR title could flip the score unpredictably
