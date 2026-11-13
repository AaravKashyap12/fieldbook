import { esc, rise, plural } from './util.mjs';
import { icon } from './icons.mjs';
import { codeBlock, dirList, installCaution } from './parts.mjs';

export function kitAvailability(kit) {
  const available = kit.entries.filter(e => !e.paused).length;
  return `${available} of ${kit.entries.length} available · ${kit.entries.length - available} paused`;
}

const startingOptions = [
  ['mattpocock/skills/diagnosing-bugs', 'Start here for a reproducible failure', 'Build a fast failing loop, then narrow down the cause. Also covers flaky bugs.'],
  ['obra/superpowers/systematic-debugging', 'When you need a structured investigation', 'Work through root-cause investigation before trying a fix.'],
  ['addyosmani/agent-skills/debugging-and-error-recovery', 'When a change may have caused the regression', 'Triage the failure and use repository history to find where it began.']
];

export function bugHuntJourney(kit) {
  if (kit.slug !== 'bug-hunt') return '';
  const byId = new Map(kit.entries.map(e => [e.id, e]));
  const choices = startingOptions.map(([id, title, why]) => ({ entry: byId.get(id), title, why })).filter(c => c.entry);
  const starter = choices.find(c => !c.entry.paused)?.entry;
  const verifier = byId.get('obra/superpowers/verification-before-completion');
  const prompt = starter ? `Use the ${starter.skill} skill to investigate this bug.\n\nExpected behavior: [what should happen]\nActual behavior: [what happens instead]\nReproduction: [steps, command, and a redacted error or log]\nProject and constraints: [stack, relevant paths, and what may be changed]\n\nFirst reproduce the failure and report the failing check. Trace the root cause with file and line references before proposing the smallest fix. Add a regression test where practical. Run the original reproduction and relevant project checks after the change. Report exact commands, results, and anything not verified. Do not merge, deploy, or change production.` : '';
  return `<section class="section bug-journey" aria-labelledby="journey-title"><h2 id="journey-title">From failing check to verified fix</h2><p class="prose">Choose one investigation skill to start. These are alternatives, not four skills you need to run at once.</p>
<ol class="journey-steps">
<li><h3>1. Choose your starting skill</h3><ul class="journey-choices">${choices.map(({entry: e, title, why}) => `<li><h4>${esc(title)}</h4><a class="inline-link" href="${e.url}">${esc(e.name)}</a><p>${esc(why)}</p><p class="journey-status">${e.paused ? `Paused: ${esc(e.reviewReason)} Read the review; no install command is available.` : e.retained ? 'Available with a retained review. Read the refresh warning before installing.' : 'Available. Check the review, access labels and source before installing.'}</p></li>`).join('')}</ul>${starter ? '' : '<p class="notice">All starting skills are paused. Wait for a new review before using this guided workflow.</p>'}</li>
<li><h3>2. Install one and confirm it loaded</h3><p>${starter ? `Open <a class="inline-link" href="${starter.url}#install-title">${esc(starter.name)}’s installation instructions</a>, or choose another available starter above.` : 'Installation instructions will return when a starting skill becomes available.'} You need Node.js and npm for the Skills CLI. Choose your coding agent and project scope, then confirm the skill appears in that agent’s installed skills and ask it to identify the instructions it loaded. If it cannot, resolve installation before debugging.</p>${installCaution(starter ? [starter] : [])}</li>
<li><h3>3. Give the agent a useful starting prompt</h3>${starter ? `${codeBlock(prompt, `Starter prompt for ${starter.name}`, 'bug-starter-prompt')}<p class="install-help">Replace the bracketed context and remove secrets from logs. If you chose a different available skill, change the skill name.</p>` : '<p>No starter prompt is offered while every starting skill is paused.</p>'}</li>
<li><h3>4. Ask for evidence, not just a fix</h3><ul class="bullets"><li>A repeatable failure, or a clear account of what prevents reproduction.</li><li>A root-cause explanation tied to code, logs or a controlled experiment.</li><li>A small change and a regression test that fails before the fix and passes after it, where practical.</li><li>The exact verification commands, their results and remaining gaps. A proposed test is not a passing test.</li></ul></li>
<li><h3>5. Verify before calling it done</h3><p>Rerun the original failure, the regression test and the relevant project checks. Check nearby behavior and the final diff; leave any blocked checks visibly unverified.</p>${verifier && !verifier.paused ? `<p>For a separate finishing pass, install <a class="inline-link" href="${verifier.url}">${esc(verifier.name)}</a> after reading its review.</p>${codeBlock(`Use the ${verifier.skill} skill to check this fix. Rerun the original reproduction and relevant checks against the final code. Report the commands, exit results, regression coverage, and anything unverified. Do not claim success from earlier output.`, 'Verification prompt', 'bug-verification-prompt')}` : `<p class="notice">${verifier ? `${esc(verifier.name)} is paused: ${esc(verifier.reviewReason)}` : 'The verification skill is unavailable.'} Use your project’s checks and review the evidence yourself.</p>`}</li>
</ol></section>`;
}

// Editorial guidance for an existing kit; no new install or activation behavior.
export function launchWeekGuide(kit) {
  if (kit.slug !== 'launch-week') return '';
  return `<section class="section" aria-labelledby="launch-guide-title">
<h2 id="launch-guide-title">A pre-launch checklist for an AI-built app</h2>
<p class="prose">Fieldbook’s Launch week kit helps you choose agent skills for a security review, performance investigation or release check. Start with the gap in your evidence. Installing every skill does not make an app production-ready, and a passing local check does not authorize deployment.</p>
<nav class="guide-contents" aria-label="In this launch guide"><span>In this guide</span><a href="#launch-choice-title">Choose a check</a><a href="#launch-brief-title">Prepare a brief</a><a href="#launch-evidence-title">Collect evidence</a><a href="#launch-stop-title">Stop conditions</a></nav>
<h3 id="launch-choice-title">Choose the check you need</h3>
<ul class="bullets">
<li><strong>Unknown exposure:</strong> start with an application-security review. Name the login, authorization, input and dependency boundaries that matter. Use <a class="inline-link" href="/tasks/secure-app/">the security skill guide</a> to scope permitted tests before picking a skill.</li>
<li><strong>A slow page:</strong> measure a reproducible page and journey before changing code. Record the device, network conditions and metric, then compare under the same conditions. A performance skill needs the tools and access stated in its listing.</li>
<li><strong>An unproven release path:</strong> inspect build checks, environment requirements and the recovery procedure. Distinguish a code rollback from reversing a data migration; restoring an older build may not restore changed data.</li>
<li><strong>Uncertain behavior:</strong> use <a class="inline-link" href="/tasks/write-tests/">the testing guide</a> for the critical journey, then <a class="inline-link" href="/tasks/review-code/">review the final patch</a>. Keep failed, skipped and blocked checks visible.</li>
</ul>
<p class="prose">The listings below describe each member’s scope and requested access. Read its review and source before installing one. Paused members remain visible for context but are excluded from install commands. A retained scan is not a check of today’s upstream instructions.</p>
<h3 id="launch-brief-title">Write a bounded launch brief</h3>
<p class="prose">Replace the bracketed details before handing this to your agent. This is an illustrative brief, not evidence of a completed audit or a claim that a particular skill will cover every risk.</p>
<blockquote class="prose">Review [repository and revision] for [critical user journey] before launch. Begin read-only. Identify the project’s build and test commands and propose the checks needed for this journey. Permitted test targets: [local or staging URL and synthetic accounts]. Out of scope: [systems and data]. Ask before running commands that send data or change state. Separate confirmed defects from risks you could not test. For each finding, give the relevant path, evidence, impact and smallest proposed fix. Do not deploy, run migrations, change production settings, or contact third-party systems.</blockquote>
<p class="prose">For example, an app that saves private notes needs evidence that account B cannot read account A’s notes. A successful login test only checks login. Use synthetic notes and test accounts in an authorized environment, and test the server’s permission check rather than only hiding a button.</p>
<h3 id="launch-evidence-title">Collect evidence before deciding to ship</h3>
<ul class="bullets">
<li><strong>Revision:</strong> the exact commit or working tree checked, plus the environment and relevant configuration without secrets.</li>
<li><strong>Critical journey:</strong> what was attempted, expected and observed, including one meaningful failure or permission boundary.</li>
<li><strong>Commands:</strong> the actual build and test results from the final code, not a list of commands the agent intends to run.</li>
<li><strong>Recovery:</strong> who can revert a release, what happens to stored data and whether the recovery procedure was exercised. Label an untested plan as untested.</li>
<li><strong>Decision:</strong> unresolved issues, their impact, the person accepting any remaining risk and the separate approval to deploy.</li>
</ul>
<h3 id="launch-stop-title">When to stop the launch</h3>
<p class="prose">Stop when a required check fails, a private-data boundary is untested, a secret appears in output or the recovery plan cannot account for a destructive change. Investigate and rerun the affected checks after a fix. A scanner result, an install count or a skill’s review label cannot decide these questions for your project.</p>
<p class="prose">Fieldbook’s automated scan covers SKILL.md, not every referenced file or runtime behavior. <a class="inline-link" href="/review/">Read what the review does and does not establish</a>.</p>
</section>`;
}

export function kitPage(kit) {
  const available = kit.entries.filter(e => !e.paused);
  const paused = kit.entries.filter(e => e.paused);
  return `<main id="main" class="wrap" data-directory><nav class="crumbs" aria-label="Breadcrumb"><a href="/kits/">Kits</a>${icon('chevron')}<span aria-current="page">${esc(kit.name)}</span></nav><header class="page-head compact"><h1 ${rise(0)}>${esc(kit.name)}</h1><p class="lede" ${rise(1)}>${esc(kit.blurb)}</p><p class="kit-availability">${kitAvailability(kit)}</p></header>${bugHuntJourney(kit)}${launchWeekGuide(kit)}<section class="section kit-install" aria-labelledby="kit-install-title"><h2 id="kit-install-title">${kit.slug === 'bug-hunt' ? 'Optional: install the available skills' : 'Install the available skills'}</h2><p class="prose">${kit.slug === 'bug-hunt' ? 'You can start with one skill. This block collects all currently available members if you want the wider kit.' : 'Read each skill’s review and access labels below before installing.'}</p>${paused.length ? `<p class="notice">${plural(paused.length, 'skill')} paused and excluded from the commands: ${paused.map(e => `<a class="inline-link" href="${e.url}">${esc(e.name)}</a>`).join(', ')}.</p>` : ''}${available.length ? `${installCaution(available)}${codeBlock(available.map(e => e.install).join('\n'), `${available.length} available install commands`, 'kit-commands')}<p class="install-help">Each command asks which agents to install for; add <code>-g</code> to install globally. Confirm installation in your chosen agent.</p>` : '<p class="notice">All skills in this kit are paused; no installation commands are available.</p>'}</section><section class="section" aria-labelledby="kit-skills-title"><h2 id="kit-skills-title">In this kit</h2>${dirList(kit.entries, 'kit')}</section></main>`;
}
