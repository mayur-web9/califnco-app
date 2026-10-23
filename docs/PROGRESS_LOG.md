# Progress Log

Each entry records what was done, why, which files changed, how it was tested, any errors, and what comes next.

---

## 2026-10-23 — Phase 0: Monorepo scaffold and docs

**What was done:**
- Created top-level folder structure: mobile/, admin-web/, server/, automation/, docs/
- Wrote docs/SPEC.md from the assignment brief (roles, features, scoring, tools, constraints, phases)
- Created docs/DECISIONS.md with proposed Firestore schema, security rules, and folder layout for each package
- Created docs/EXPLAINED.md, docs/ALTERNATIVES.md, docs/SUBMISSION.md with section headers only
- Added root .gitignore and root .env.example
- Initialised git repository

**Files changed:**
- docs/SPEC.md (new)
- docs/PROGRESS_LOG.md (new)
- docs/DECISIONS.md (new)
- docs/EXPLAINED.md (new)
- docs/ALTERNATIVES.md (new)
- docs/SUBMISSION.md (new)
- .gitignore (new)
- .env.example (new)

**Why:**
Starting with docs and structure means every session can pick up from the log without re-reading the brief.

**How tested:**
Verified all files exist and directories are present. Git status clean after initial commit.

**Errors:**
None.

**Next:**
Phase 1 — Firebase project setup, Firebase Auth with role writing, Firestore security rules enforcement, product seed script.
