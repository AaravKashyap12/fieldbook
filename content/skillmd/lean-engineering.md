---
name: lean-engineering
description: "Deliver bounded software changes with one owning agent, TDD-backed evidence, root-cause debugging, and a deterministic completion gate. Use for bug fixes, small-to-medium features, refactors, and plan execution in an existing repo when the user wants focused work without reviewer swarms or recursive review loops. Triggers: fix this bug, implement this, make the smallest change, run the checks, no subagent swarm, keep it lean. Not for deployments, migrations, security boundaries, or work that cannot be verified locally."
license: MIT
metadata:
  version: 0.2.0
  author: Aarav Kashyap
  platforms: [linux, macos, windows]
---

# Lean Engineering

Deliver reliable software changes with one owning agent. Preserve planning, TDD, root-cause debugging, and evidence-based completion while allowing bounded workers without recursive LLM review loops.

## When to Use

- Building or modifying software when speed and token efficiency matter.
- Executing a defined plan or a bounded change in an existing repository.
- Debugging a defect with reproducible local checks.

Do not use this skill for destructive external actions, production deployment, security-sensitive changes, migrations, or changes whose correctness cannot be tested locally without first getting the user's explicit direction.

## Owner Model

- The session model owns the plan, production-code decisions, all judgment calls, and the completion gate. It remains accountable for every edit.
- One owner per file. By default the owner makes production-code edits. A routing skill may assign a bounded, clear-shape implementation slice to one worker only after its delegation gate passes; assign an exclusive file scope and hand ownership back before the session edits those files.
- Bounded workers may run tests and summarize evidence, search the codebase, list call sites, or gather a diff. Workers return evidence; the owner decides what it means.
- Never dispatch a subagent to double-check the orchestrator's own work.
- Do not use recursive LLM review loops, implementer/reviewer ping-pong, parallel writers to the same files, or workers for consequential work.
- Verification is deterministic: tests, types, lint, build, runtime evidence, and owner inspection of the diff. It is never an LLM reviewer dispatch.
- Never claim a check passed without running and inspecting it.

If another installed workflow proposes a reviewer swarm or recursive review, this skill's owner model governs for the task. Higher-priority host instructions and the user's authorization still apply.

## Works with a routing skill

This engineering workflow governs what stays with the owner, how changes are verified, and the completion gate. A routing skill governs whether to dispatch, to which tier, and at what effort, within those boundaries. State the mode in one line before starting: owner inline, or owner with named bounded workers.

Without a routing skill, dispatch a mechanical or recon worker only if its task is bounded, self-contained enough to brief without the conversation, and verifiable from evidence it returns.
Otherwise work inline; production-code implementation stays with the owner.

## Procedure

1. **Classify the work.**
   - For a quick feasibility question, state the probe and keep outputs throwaway.
   - For a bounded code change, state the intended behavior, touched area, and verification command in 2-5 lines.
   - For a multi-file or architectural change, write a compact plan: goal, constraints, task order, changed files, and checks.
   - Completion criterion: scope, acceptance behavior, and validation command are explicit before editing.

2. **Inspect only relevant context.**
   - Read the local instructions, target code, analogous code, and the nearest existing tests.
   - Establish the narrowest useful test/type/lint commands before changing production code.
   - Completion criterion: the next edit and the command that can disprove it are known.

3. **Implement vertically with TDD.**
   - For each behavior change: write one focused failing test, run it and confirm the expected failure, implement the smallest change, then rerun the focused test.
   - Run the relevant regression command after each completed behavior slice.
   - For configuration, generated code, or throwaway spikes where test-first is inappropriate, say why and use the strongest applicable deterministic check.
   - If a focused test is unavailable or test-first is inappropriate, use the first applicable rung: focused test → type check → build → runtime probe script with recorded output → manual reproduction with recorded output. Name the rung used in the completion report. A lower rung is a disclosed limitation, not proof of behavior it cannot exercise.
   - Completion criterion: each behavior has direct evidence, not only a final broad test run.

4. **Debug by evidence.**
   - When a check fails unexpectedly, reproduce it, inspect the failure and relevant code path, state the root-cause hypothesis, then make the smallest test-backed fix.
   - Do not make speculative batches of fixes.
   - Completion criterion: the reproduction no longer fails and the regression test remains in place when appropriate.

5. **Perform a deterministic completion gate.**
   - Run the project-appropriate test suite or the broadest feasible relevant subset.
   - Run applicable type checking, linting, formatting validation, build, or static analysis.
   - Inspect `git diff --check`, `git diff --stat`, and the changed-file diff; account for every changed file and remove unrelated changes.
   - Report commands, exit outcomes, any skipped checks, and why a skipped check could not run.
   - Completion criterion: all claimed checks have fresh evidence; scope is intentional and no known failure is hidden.

## Verification Ladder

Use the highest checks the repository supports, in this order where applicable:

1. Focused regression test for the behavior changed.
2. Relevant package/module test suite.
3. Type checker, linter, formatter validation, and build.
4. Full repository test suite when feasible.
5. Diff hygiene: `git diff --check`, `git diff --stat`, and manual changed-file inspection.

A green linter is not a replacement for a behavioral test. A passing test suite is not a replacement for inspecting scope.

## Consequential work

Security, money, data migrations, concurrency, public contracts, production changes, irreversible operations, final review of a high-risk diff.

For consequential work, stop and ask the user before proceeding unless explicit authorization for that same scope is already recorded. Secrets and security boundaries belong to security; deployments belong to production changes. Keep consequential judgment and the final completion gate with the owner, never a worker.

Propose the narrowest additional check needed. Do not create a reviewer swarm.

## Pitfalls

- Do not replace testing with a self-authored prose review.
- Do not turn one failed check into several speculative edits.
- Do not use a full suite as an excuse to skip the focused RED-GREEN evidence.
- Do not create a long plan for a bounded edit; the plan must reduce uncertainty, not become ceremony.
- Preserve installed tooling and unrelated configuration. Express task-specific execution rules in the governing workflow or project instructions instead of deleting other tools.

## Completion Report

Report only:

- what changed;
- verification commands and actual results;
- skipped checks and blockers, if any;
- the next decision required from the user, if any.

Do not report success if a named acceptance check did not run or failed.
