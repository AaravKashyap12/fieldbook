import { esc, pad } from './util.mjs';
import { icon } from './icons.mjs';
import { dirList } from './parts.mjs';
import { taskArt } from './task-art.mjs';

// Deliberately curated destinations, not a page for every filter combination.
export const taskGuides = [
  {
    slug: 'fix-bug', name: 'Fix a bug', title: 'Debugging Skills for Claude Code & Codex',
    description: 'Compare agent skills for debugging. Choose a workflow to reproduce a bug, investigate its cause and verify the fix in Claude Code or Codex.',
    intro: 'Start with the failing behavior. These skills cover different parts of debugging, from collecting a reproduction to checking whether a repair holds. Choose one that fits the evidence you already have.',
    choose: 'If you cannot reproduce the problem, look for diagnosis and investigation. If the failure is understood, look for a focused repair workflow. Browser testing, error recovery and final verification address different jobs; read the source note before choosing.',
    prepare: 'Give the agent the failing command or user journey, the expected result, the actual result and any relevant logs with secrets removed. State which files it may edit and which systems it must leave alone.',
    checks: ['Reproduce the original failure before changing code. Record the smallest case that still fails.', 'Test one explanation at a time, then make a focused change at the cause.', 'Repeat the original reproduction and relevant regression tests. Report any behavior that could not be checked.'],
    kit: ['bug-hunt', 'Follow the guided Bug hunt'],
  },
  {
    slug: 'write-tests', name: 'Write tests', title: 'Testing Skills for Claude Code & Codex',
    description: 'Find agent skills for test-driven development, browser testing and verification. Compare scope and access before using them in Claude Code or Codex.',
    intro: 'Choose a testing skill around the behavior you need to prove. A unit test, a browser journey and a final verification pass answer different questions, even when they all end with a green check.',
    choose: 'For new behavior, look for a test-driven workflow. For a user journey, look for browser or integration testing that matches your stack. For an existing change, use verification guidance that checks the requirement as well as the code.',
    prepare: 'Provide the acceptance criteria, the repository test commands and any fixtures already available. Keep tests away from production data. Say whether the agent may add test dependencies or start services; neither follows automatically from writing a test.',
    checks: ['Show that a new regression test fails for the intended reason before applying the fix.', 'Cover a meaningful boundary or failure path as well as the happy path, using the public behavior where practical.', 'Run the affected suite again after the final edit. Separate passed checks from skipped or blocked checks.'],
  },
  {
    slug: 'review-code', name: 'Review code', title: 'Code Review Skills for Claude Code & Codex',
    description: 'Compare code review skills for Claude Code and Codex. Scope a review, inspect findings and verify changes with source notes and access labels.',
    intro: 'A useful code review connects a specific change to a concrete failure or unmet requirement. These skills help with requesting a review, inspecting a patch and working through the findings.',
    choose: 'Distinguish reviewing code from preparing a review request or responding to feedback. Choose guidance that fits the change and your stack. Keep the reviewer independent of the implementation when the risk warrants it.',
    prepare: 'Name the base and head revision, the intended behavior and the areas that changed. Ask for findings with file locations, impact and supporting evidence. Say explicitly whether the task is read-only or includes making fixes.',
    checks: ['Check each finding against the current diff and its callers. Separate defects from style preferences.', 'Reproduce important failures where safe, and verify the proposed fix addresses the cause.', 'Rerun affected checks after changes. Resolve review threads only when the finding has been addressed or a decision is recorded.'],
    kit: ['the-review-loop', 'Explore the review loop kit'],
  },
  {
    slug: 'secure-app', name: 'Secure an app', title: 'App Security Skills for Claude Code & Codex',
    description: 'Compare agent skills for application security reviews and launch checks. Read access labels, source evidence and limits before installing.',
    intro: 'Start with the part of the application you need to examine: authentication, input handling, dependencies or deployment exposure. These skills provide workflows and checks; installing one does not establish that an application is secure.',
    choose: 'Match the skill to your application and the review you have authorized. A pre-launch checklist, a framework-specific review and a threat model have different scopes. Compare what each skill can read, change or send over the network.',
    prepare: 'Define the repository, local environment and permitted test targets. Use test accounts and synthetic data. Keep credentials out of prompts and reports, and ask before testing third-party systems or changing production settings.',
    checks: ['Trace the affected input and permission boundaries in the code rather than relying only on scanner output.', 'Use safe negative tests for the specific risk, such as rejected input or access by the wrong test account.', 'Verify each approved fix, record remaining limitations and keep deployment approval separate from a successful local check.'],
    kit: ['launch-week', 'Explore the launch week kit'],
  },
];

export const taskUrl = slug => taskGuides.some(t => t.slug === slug) ? `/tasks/${slug}/` : `/skills/?task=${encodeURIComponent(slug)}`;
export const skillsForTask = (entries, slug) => entries.filter(e => !e.paused && e.tasks.includes(slug)).sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

export function taskPage(task, entries) {
  const list = skillsForTask(entries, task.slug);
  return `<main id="main" class="wrap directory task-guide-page">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/skills/">Directory</a>${icon('chevron')}<span aria-current="page">${esc(task.name)}</span></nav>
<header class="page-head compact guide-cover"><div><h1>${esc(task.name)}<br><em>with agent skills.</em></h1><p class="lede">${esc(task.intro)}</p></div>${taskArt(task.slug)}</header>
<nav class="guide-contents" aria-label="In this guide"><span>In this guide</span><a href="#choose-title">Choose a skill</a><a href="#prepare-title">Prepare</a><a href="#results-title">Compare skills</a><a href="#verify-title">Verify the result</a></nav>
<p class="refine"><a class="link" href="/skills/?task=${esc(task.slug)}">Filter these skills by stack and access ${icon('chevron')}</a></p>
<section class="section" aria-labelledby="choose-title"><h2 id="choose-title">Choose a skill</h2><p class="prose">${esc(task.choose)}</p>${task.kit ? `<a class="link" href="/kits/${esc(task.kit[0])}/">${esc(task.kit[1])} ${icon('chevron')}</a>` : ''}</section>
<section class="section" aria-labelledby="prepare-title"><h2 id="prepare-title">Before you install</h2><p class="prose">${esc(task.prepare)}</p><p class="prose">Open a listing to read its source, access labels and review evidence before copying its install command. The automated scan covers SKILL.md, not referenced files or runtime behavior. <a class="inline-link" href="/review/">Read the review limits</a>.</p></section>
<section class="section" aria-labelledby="results-title"><h2 id="results-title">Skills for this task</h2><p class="prose">${list.length} available ${list.length === 1 ? 'skill' : 'skills'}, listed A to Z. Task labels help narrow the choice; they do not establish fit for your project.</p>${list.length ? dirList(list, `task-${task.slug}`) : '<p class="notice">No skills for this task are currently available. Check the directory for other tasks while reviews are pending.</p>'}</section>
<section class="section" aria-labelledby="verify-title"><h2 id="verify-title">Check the result</h2><ol class="steps">${task.checks.map((s, i) => `<li><span>${pad(i + 1)}</span><p>${esc(s)}</p></li>`).join('')}</ol></section>
<section class="related" aria-labelledby="more-tasks"><h2 id="more-tasks">Explore another task</h2><ul class="related-list">${taskGuides.filter(t => t.slug !== task.slug).map(t => `<li><a href="${taskUrl(t.slug)}"><span class="related-name">${esc(t.name)}</span>${icon('chevron')}</a></li>`).join('')}</ul></section>
</main>`;
}
