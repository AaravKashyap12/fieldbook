import { esc } from './util.mjs';
import { icon } from './icons.mjs';
import { taskGuides, taskUrl } from './tasks.mjs';
import { taskArt } from './task-art.mjs';

// Four guides with their own drawings; every other task stays one native
// disclosure away. Outcomes live on the guide pages, not here.
export function discoverySection(tasks, counts) {
  const more = tasks.filter(t => !taskGuides.some(g => g.slug === t.slug));
  return `<section class="wrap tasks-section" aria-labelledby="tasks-title">
<h2 id="tasks-title" class="section-title">Start with <em>the task.</em></h2>
<ul class="task-guides">${taskGuides.map(t => `<li><a href="${taskUrl(t.slug)}">${taskArt(t.slug)}<span class="task-guide-title">${esc(t.name)}</span><span class="task-guide-meta">${counts[t.slug] || 0} skills <span class="task-guide-go">Guide ${icon('chevron')}</span></span></a></li>`).join('')}</ul>
<div class="tasks-foot">${more.length ? `<details class="more-tasks"><summary>Browse ${more.length} more tasks ${icon('plus')}</summary><ul class="task-list">${more.map(t => `<li><a href="${taskUrl(t.slug)}"><span class="task-name">${esc(t.name)}</span><span class="task-n">${counts[t.slug] || 0}</span></a></li>`).join('')}</ul></details>` : ''}<a class="link first-skill" href="/kits/bug-hunt/">First skill? Follow the Bug hunt walkthrough ${icon('chevron')}</a></div>
</section>`;
}
