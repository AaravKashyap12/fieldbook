---
name: efficiency-skill
description: "Route every task to the cheapest model tier and reasoning effort that holds output quality. The session model stays the orchestrator and delegates bounded work to subagents on smaller models, or answers inline when delegating would cost more. Use at the start of any coding, research, or writing session in Claude Code, Codex, or another Agent Skills harness when the user cares about token usage, usage limits, or cost, asks to be efficient, save tokens, use subagents, or delegate, or when a task mixes trivial and hard work. Also use when deciding whether to answer inline or dispatch a subagent."
license: MIT
metadata:
  version: 0.2.0
  author: Aarav Kashyap
  platforms: [linux, macos, windows]
---

# Efficiency Skill

The strongest model thinks and decides. Cheaper models grind. Output quality never drops: work routes down only when its task class allows it, and anything above the floor stays on the session model.

Routing makes a dispatch cheaper. It does not make dispatching free. A subagent starts with an empty context, re-reads what it needs, and returns a report. Savings come from two places: a cheaper tier doing the grinding, and raw file contents and logs staying out of the main context. Never manufacture a dispatch to collect savings.

## Works with an engineering workflow skill

This routing skill governs whether to dispatch, to which tier, and at what effort. An engineering workflow skill governs edits, ownership, verification, and completion; its owner-only and consequential boundaries remain binding. Route only work that those boundaries permit.

## Step 0: Resolve the harness

Read exactly one provider reference before routing anything. It holds the current model names, prices, effort ladder, and dispatch mechanics with a verification date.

- Claude Code or the Claude API: [references/claude-code.md](references/claude-code.md)
- Codex CLI, Codex app, or the OpenAI API: [references/codex.md](references/codex.md)
- Any other provider or harness, or a mixed-provider setup: [references/other-providers.md](references/other-providers.md)

If the reference's `review_after` date has passed, verify each model row against the official pages it cites before relying on it. A newer model is a candidate to qualify, not an automatic replacement.

If the harness cannot set a subagent model, or subagents are disabled, routing is effort-only: skip Step 1 and apply the class table to effort. Treat `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` when active as disabling per-dispatch tier selection, and Codex `agents.enabled = false` as disabling dispatch. A forced model is not proof that subagents themselves are disabled. If effort is not controllable either, work inline and disclose that limitation; never claim an unavailable setting was applied.

Confirm the harness's actual model IDs (`/model`, `/status`) match the reference rows; if they do not, treat the reference as stale and route by effort only until verified.

Tiers are relative to the session model the user picked:

- **strongest**: the session model. Never switch it and never tell the user to switch it.
- **mid**: one step down.
- **cheap**: the lowest tier the provider offers.

When the session model is already the cheapest tier, there is nothing to route down. Orchestrate inline.

## Step 1: The delegation gate

Decide inline versus dispatch before choosing a tier. Answer inline when any of these hold:

- The answer is available from the conversation, general knowledge, or a file already in context.
- The task produces a short output and needs no exploration or command execution. A five-line function, a one-line fix, a factual question.
- Briefing a subagent faithfully would need more than five facts from the conversation that are not in files.
- The task needs judgment that spans the whole conversation history.
- The task is the orchestrator's own decision, authorization, or user dialogue.

Dispatch when all of these hold:

- The task is bounded and self-contained enough to describe without the conversation.
- It requires reading files, running commands, or producing intermediate output that the main context does not need to keep.
- Its result can be verified from evidence the subagent returns.

Batch related tasks into one dispatch. Each subagent re-reads from scratch, so one tiny task per agent costs more than it saves. Keep parallel dispatches read-heavy. One owner per file. Assign exclusive file scopes to implementation workers and hand ownership back before another agent edits those files.

## Step 2: Classify the task

Classify in this order and stop at the first that applies: deterministic verifiability, silent-miss risk, dispersed-context reconciliation, ambiguity or novelty, consequence. File count and duration alone never raise the class. When torn between two classes, take the stronger one.

| Class | What it covers | Floor tier | Default effort |
| --- | --- | --- | --- |
| mechanical | Run tests, builds, linters. Summarize logs. Renames, boilerplate, mirrored constants, extraction, classification, structured summaries. Misses are visible and cheap to check. | cheap | low |
| breadth-recon | Where is X, list every Y, trace a chain end to end, which files import Z. Correctness is checkable by following the code. | cheap | low |
| judgment-recon | How does X work, does this retry, what does this return for that input, audit API usage. A miss could be silent and look confident. | mid | low or medium |
| implementation | A clear-shape change whose approach is already decided: single feature, bounded refactor, tests for known behavior. | mid | medium |
| hard-reasoning | Ambiguous debugging, architecture, novel problems, heavy math or algorithmic reasoning, competing interpretations. | strongest | high |
| consequential | Security, money, data migrations, concurrency, public contracts, production changes, irreversible operations, final review of a high-risk diff. | strongest | high |

Escalation boundaries:

- mechanical to breadth-recon to judgment-recon when a miss would be silent or recognizing a finding takes judgment.
- recon to implementation when success depends on retaining and reconciling context across many places, not merely searching them.
- implementation to hard-reasoning when ambiguity, novelty, or reasoning difficulty dominates. Multi-file or cross-layer changes that touch subtle logic also escalate one step.
- any class to consequential when a wrong result is expensive to unwind.

Ambiguity is a stop sign, not an escalation trigger. Clarify in the main session, or run a recon dispatch, then dispatch the well-defined task.

## Step 3: Pick both knobs

Model tier and reasoning effort are independent controls. Effort moves cost as hard as tier does, and lower effort also produces fewer tool calls and less preamble.

- When a dispatch looks too expensive, step effort down before stepping the tier down.
- When a result comes back too shallow, step effort up before stepping the tier up.
- A strong model at low effort often beats a weak model at high effort. Use it for well-scoped work that still needs recognition of patterns the cheap tier lacks.
- Do not carry effort settings across model generations. The scale is calibrated per model.

## Step 4: Write a self-contained brief

The subagent cannot see the conversation. Every dispatch states:

1. Exact objective and what done looks like.
2. Files, directories, or commands to start from.
3. Constraints: read-only or write, files it may not touch, repo policies.
4. Verification the subagent must run and report, with the exact command and working directory.
5. Output shape: conclusions with file and line references, not file dumps. Compact pass or fail summaries, not raw logs.
6. Stop conditions: return on ambiguity, on a protected boundary, or after two distinct evidence-based attempts fail.

## Step 5: Verify, escalate, or take over

A result of zero tests, zero matches or an empty listing is a weak result: re-check once before returning.

- Verify load-bearing claims from a cheap tier before building on them. Require file and line references, command output, or an independent check.
- A weak result retries once, one effort step up. A second weak result retries one tier up. After that the orchestrator takes over inline.
- A refusal or safety decline is a redirect, not a weak result. Try another model family or handle inline. Do not step up the tier as a response to a refusal.
- Gate a cheap-tier diff with deterministic checks and owner inspection. A mechanical worker may run checks and return output; it is not an LLM reviewer. Reading the diff remains the owner's responsibility.
- Never dispatch a subagent to double-check the orchestrator's own work. Use owner verification, not recursive LLM review loops or implementer/reviewer ping-pong.
- Final review of a high-risk or large diff stays in the main session at high effort.

## Transparency

Delegation is invisible to the user's result but not hidden. When the user asks which model did what, answer plainly with the harness's own record. Never claim a dispatch ran on a tier the harness did not confirm.

Expect routing to save roughly a fraction of the cost of work that was going to be delegated anyway. It cannot make a trivial inline answer cheaper than answering inline.
