# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- `CONTEXT.md` at the repo root, or
- `CONTEXT-MAP.md` at the repo root if it exists: it points at one `CONTEXT.md` per context. Read each one relevant to the topic.
- `docs/adr/`: read ADRs that touch the area you're about to work in.

If any of these files do not exist, proceed silently. Do not flag their absence or suggest creating them upfront. The `/domain-modeling` skill creates them when terms or decisions are resolved.

## File structure

This is a single-context repo:

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

## Use the glossary's vocabulary

When your output names a domain concept, use the term as defined in `CONTEXT.md`. Do not use synonyms that the glossary avoids.

If the concept you need is not in the glossary, reconsider whether you are inventing language the project does not use. If the project needs a new term, note it for `/domain-modeling`.

## Flag ADR conflicts

If your output contradicts an existing ADR, state the conflict instead of silently overriding it:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_
