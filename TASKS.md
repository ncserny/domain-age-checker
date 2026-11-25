# Tasks

Things we want to do in domain-age-checker. Tick an item off in the same pull request
that does it, and add new items as they come up. Newest work goes at the top
of its section.

Every open item starts with a tag that says how far an agent may take it on
its own: `[auto]` (do it and merge once the build passes), `[pr]` (do it,
open a pull request for review, never merge), `[draft]` (research or draft
only) or `[nader]` (only Nader). An item without a tag counts as `[nader]`.
Sub-items take their parent's tag unless they carry their own.

An item for another of Nader's projects names its repository after the tag,
like `[pr] (clubkit) …`. An item without one is for this repository.

Every item ends its first line with a stable id, like `<!-- id: launch-post -->`.
It does not show when the file is rendered. Comments, claims and pull requests
in ScalePilot hang off it, so keep the id when an item is reworded, and give a
new item one (lowercase letters, digits and hyphens, unique in this file). The
`<slug>` in a `codex/task-<slug>` branch is the item's id; a pull request can
also name it with a `Task-ID: <id>` line in its body.

An item looks like this:

```markdown
- [ ] [pr] Write the launch post. Added 2026-11-25. <!-- id: launch-post -->
      Notes for the agent, indented under the item: points to make, links.
  - [ ] [nader] Publish it.
```

## How agents work through this file

An agent started with "work on the tasks" takes the first open `[auto]`,
`[pr]` or `[draft]` item from the top that has no open pull request yet,
one item per run. It works on a `codex/task-<id>` branch, follows this
repository's AGENTS.md, ticks the item off in the same pull request and titles
it `Task: <what it does>`. It never invents a story, a quote or a number;
what only Nader can answer goes into the pull request as a question. It leaves
`[nader]` items alone, and never merges anything that is not `[auto]`.

## Next up

What the next run should take first, before everything below.

## Found by the agent

Gaps an agent noticed on its own. Nader moves an item up into his own
sections, retags it or deletes it. Agents only work on these when nothing
above is workable.
