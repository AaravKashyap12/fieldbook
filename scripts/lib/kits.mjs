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
<li><h3>2. Install one and confirm it loaded</h3><p>${starter ? `Open <a class="inline-link" href="${starter.url}#install-title">${esc(starter.name)}’s installation instructions</a>, or choose another available starter above.` : 'Installation instructions will return when a starting skill becomes available.'} You need Node.js and npm for the Skills CLI. Choose your coding agent and project scope, then confirm the skill appears in that agent’s installed skills and ask it to identify the instructions it loaded. If it cannot, resolve installation before debugging.</p>${installCaution}</li>
<li><h3>3. Give the agent a useful starting prompt</h3>${starter ? `${codeBlock(prompt, `Starter prompt for ${starter.name}`, 'bug-starter-prompt')}<p class="install-help">Replace the bracketed context and remove secrets from logs. If you chose a different available skill, change the skill name.</p>` : '<p>No starter prompt is offered while every starting skill is paused.</p>'}</li>
<li><h3>4. Ask for evidence, not just a fix</h3><ul class="bullets"><li>A repeatable failure, or a clear account of what prevents reproduction.</li><li>A root-cause explanation tied to code, logs or a controlled experiment.</li><li>A small change and a regression test that fails before the fix and passes after it, where practical.</li><li>The exact verification commands, their results and remaining gaps. A proposed test is not a passing test.</li></ul></li>
<li><h3>5. Verify before calling it done</h3><p>Rerun the original failure, the regression test and the relevant project checks. Check nearby behavior and the final diff; leave any blocked checks visibly unverified.</p>${verifier && !verifier.paused ? `<p>For a separate finishing pass, install <a class="inline-link" href="${verifier.url}">${esc(verifier.name)}</a> after reading its review.</p>${codeBlock(`Use the ${verifier.skill} skill to check this fix. Rerun the original reproduction and relevant checks against the final code. Report the commands, exit results, regression coverage, and anything unverified. Do not claim success from earlier output.`, 'Verification prompt', 'bug-verification-prompt')}` : `<p class="notice">${verifier ? `${esc(verifier.name)} is paused: ${esc(verifier.reviewReason)}` : 'The verification skill is unavailable.'} Use your project’s checks and review the evidence yourself.</p>`}</li>
</ol></section>`;
}

export function kitPage(kit) {
  const available = kit.entries.filter(e => !e.paused);
  const paused = kit.entries.filter(e => e.paused);
  return `<main id="main" class="wrap" data-directory><nav class="crumbs" aria-label="Breadcrumb"><a href="/kits/">Kits</a>${icon('chevron')}<span aria-current="page">${esc(kit.name)}</span></nav><header class="page-head compact"><h1 ${rise(0)}>${esc(kit.name)}</h1><p class="lede" ${rise(1)}>${esc(kit.blurb)}</p><p class="kit-availability">${kitAvailability(kit)}</p></header>${bugHuntJourney(kit)}<section class="section kit-install" aria-labelledby="kit-install-title"><h2 id="kit-install-title">${kit.slug === 'bug-hunt' ? 'Optional: install the available skills' : 'Install the available skills'}</h2><p class="prose">${kit.slug === 'bug-hunt' ? 'You can start with one skill. This block collects all currently available members if you want the wider kit.' : 'Read each skill’s review and access labels below before installing.'}</p>${paused.length ? `<p class="notice">${plural(paused.length, 'skill')} paused and excluded from the commands: ${paused.map(e => `<a class="inline-link" href="${e.url}">${esc(e.name)}</a>`).join(', ')}.</p>` : ''}${available.length ? `${installCaution}${codeBlock(available.map(e => e.install).join('\n'), `${available.length} available install commands`, 'kit-commands')}<p class="install-help">Each command asks which agents to install for; add <code>-g</code> to install globally. Confirm installation in your chosen agent.</p>` : '<p class="notice">All skills in this kit are paused; no installation commands are available.</p>'}</section><section class="section" aria-labelledby="kit-skills-title"><h2 id="kit-skills-title">In this kit</h2>${dirList(kit.entries, 'kit')}</section></main>`;
}
