import { esc } from './util.mjs';
import { icon } from './icons.mjs';
import { taskGuides, taskUrl } from './tasks.mjs';

const outcomes = {
  'fix-bug': 'Reproduce a failure, find its cause, then verify the repair.',
  'write-tests': 'Choose tests that prove the behavior you need.',
  'review-code': 'Scope the review and separate findings from preferences.',
  'secure-app': 'Define the risks, permitted checks and evidence you need.',
};

export function discoverySection(tasks, counts) {
  const more = tasks.filter(t => !taskGuides.some(g => g.slug === t.slug));
  return `<section class="wrap tasks-section" aria-labelledby="tasks-title">
<div class="section-intro"><h2 id="tasks-title" class="section-title">Start with<br><em>the task.</em></h2><p>Choose a guide to compare skills, prepare the work and check the result. Use the directory when you want to filter straight away.</p></div>
<ul class="task-guides">${taskGuides.map(t => `<li><a href="${taskUrl(t.slug)}"><span class="task-guide-title">${esc(t.name)}</span><span class="task-guide-description">${esc(outcomes[t.slug])}</span><span class="task-guide-meta">${counts[t.slug] || 0} available skills<span>Read the guide ${icon('chevron')}</span></span></a></li>`).join('')}</ul>
${more.length ? `<details class="more-tasks"><summary>Browse ${more.length} more tasks ${icon('plus')}</summary><ul class="task-list">${more.map(t => `<li><a href="${taskUrl(t.slug)}"><span class="task-name">${esc(t.name)}</span><span class="task-n">${counts[t.slug] || 0}</span>${icon('chevron', 'task-chevron')}</a></li>`).join('')}</ul></details>` : ''}
<div class="first-skill"><div><h3>Installing your first skill?</h3><p>Follow the Bug hunt walkthrough: choose one skill, read its source and review, then check that your agent loaded it. Copying a command does not run it.</p></div><a class="link" href="/kits/bug-hunt/">Try the guided walkthrough ${icon('chevron')}</a></div>
<p class="section-more"><a class="link" href="/skills/">Browse the full directory ${icon('chevron')}</a><span class="discovery-review">Compare access labels and source evidence. <a class="inline-link" href="/review/">What a review covers</a>.</span></p>
</section>`;
}
