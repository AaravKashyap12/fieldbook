# Reviewing a submission

Fieldbook lists fewer skills on purpose. A skill is listed only when every step below passes. Reply on the issue either way, with the reason.

## 1. Run the automated checks

```sh
npm run review -- owner/repo/skill
npm run review -- owner/repo/skill path/to/SKILL.md   # if the folder is not in a standard place
```

This fetches the published `SKILL.md` and reports frontmatter problems and scanner matches (rule and line only). It does not run the skill.

A match is a prompt to read, not a verdict:

- **Defensive mention** (the skill lists commands it blocks, or quotes an injection phrase as something to distrust): clear it with a reason in the entry's `cleared` object and bind that approval to the exact full source SHA-256 in `clearedSha256`.
- **Real behaviour** (it pipes remote code to a shell, reads or prints secrets, bypasses an agent's safety prompts, hides instructions): decline, and say which line.

## 2. Read the whole skill

Read `SKILL.md` and any file it tells the agent to load. Answer each question:

| Question | A pass looks like |
| --- | --- |
| Is it engineering work? | It changes how an agent plans, builds, tests, debugs, reviews, secures or ships software. |
| Does the description say when to use it? | A reader could predict which tasks trigger it and which do not. |
| Is it scoped? | It does one job. Anything it touches beyond reading is stated or obvious from its steps. |
| Does it depend on something unstated? | Wrappers that call other skills, required MCP servers or CLIs are called out in the note. |
| Is it licensed? | The repository or the skill folder has a licence file. No licence, no listing yet. |
| Does it install? | `npx skills add owner/repo --skill name` finds it. |
| Is it alive? | Updated in the last twelve months, or small and stable enough not to need it. |
| Is the source established? | An official vendor or organisation repository, or 100+ GitHub stars, or 1,000+ skills.sh installs; and the repository is at least 60 days old. Fieldbook originals are exempt. |
| Does it stay inside its job? | No skills whose job is to find and install other skills: they would install unreviewed skills. |

## 3. Write the listing

Add an entry to `content/directory.json`:

```json
{
  "id": "owner/repo/skill-folder",
  "path": "path/to/skill-folder/SKILL.md",
  "name": "Readable name",
  "category": "plan | build | debug | review | security | performance | ship | agents | stack",
  "license": "MIT",
  "access": ["edits", "docs", "commands", "git", "subagents", "browser", "mcp", "network"],
  "summary": "One line on what it does, in your own words.",
  "note": "One or two sentences a user would want before installing: what stands out, and any catch.",
  "addedAt": "YYYY-MM-DD"
}
```

- `name` is readable title case ("Azure cloud migration"), never the folder slug.
- `access` lists only what the instructions ask the agent to do. Leave it empty for guidance-only skills.
- Write the summary and note yourself. Do not copy the skill's description.
- Add the maintainer to `content/authors.json` if they are new.
- Add `"readAt": "YYYY-MM-DD"` only when a person has read `SKILL.md` and every file it tells the agent to load, end to end. It shows the Read in full mark. Agents never set it. Submissions are read in full before they are listed, so they always carry it.

Then run `npm run daily`, open the new page, and reply on the issue with the link.

## 4. Declining

Say which step failed and what would change the answer (for example, "add a licence file and reply here"). Close the issue with the `not-yet` label.
