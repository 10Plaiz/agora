# TEAM_INTERNAL.md

Private team workflow. Keep this file out of public repositories unless reviewed.

This file is a safety/runbook layer, not a daily AI context file. Most AI work should start from `context/PROJECT_GUIDE.md`, `context/DECISIONS.md`, and `context/PROJECT_HANDOFF.md`.

## Public Safety

Never publish:

- secrets, keys, tokens, passwords, `.env` values, or private deployment details
- personal/team-private notes, judging strategy, or unreviewed drafts
- private prompts, internal workflows, screenshots, or logs with sensitive data

Before pushing publicly:

```sh
git status --short
git diff --cached --name-status
git check-ignore -v context/PROJECT_GUIDE.md context/DECISIONS.md context/PROJECT_HANDOFF.md context/TEAM_INTERNAL.md context/UI.md
```

Confirm private context files are ignored and not staged.

## Team Working Loop

1. Read `context/PROJECT_GUIDE.md`.
2. Check `context/DECISIONS.md`.
3. Check `context/PROJECT_HANDOFF.md`.
4. Make the smallest useful change.
5. Update the owning context file if future work depends on the new fact.
6. Log durable decisions in `context/DECISIONS.md`.
7. End meaningful sessions by updating `context/PROJECT_HANDOFF.md`.

## Private Companion Repo

Use this only when the main project repo is public but the team needs shared private context. Keep the companion repo private and limited to:

```text
context/
  PROJECT_GUIDE.md
  DECISIONS.md
  PROJECT_HANDOFF.md
  TEAM_INTERNAL.md
  UI.md
```

Do not store secrets in the private companion repo.

## Setup

1. Create a private GitHub repo named `<project-name>-context-private`.
2. Add active teammates as collaborators.
3. Push only `PROJECT_GUIDE.md`, `DECISIONS.md`, `PROJECT_HANDOFF.md`, `TEAM_INTERNAL.md`, and `UI.md`.
4. Each teammate clones the private repo beside the public project repo:

```sh
git clone <PRIVATE_CONTEXT_REPO_URL> <project-name>-context-private
```

Then copy private context into the public project working tree:

```sh
cd <public-project-repo>
cp -R ../<project-name>-context-private/context/. ./context/
git check-ignore -v context/PROJECT_GUIDE.md context/DECISIONS.md context/PROJECT_HANDOFF.md context/TEAM_INTERNAL.md context/UI.md
```

## Daily Sync

Pull public code with the team's normal fork/upstream workflow. Pull private context, then copy it into the public working tree:

```sh
cd ../<project-name>-context-private
git pull
cd ../<public-project-repo>
cp -R ../<project-name>-context-private/context/. ./context/
```

After updating private context locally, copy it back and push:

```sh
cp context/PROJECT_GUIDE.md ../<project-name>-context-private/context/PROJECT_GUIDE.md
cp context/DECISIONS.md ../<project-name>-context-private/context/DECISIONS.md
cp context/PROJECT_HANDOFF.md ../<project-name>-context-private/context/PROJECT_HANDOFF.md
cp context/TEAM_INTERNAL.md ../<project-name>-context-private/context/TEAM_INTERNAL.md
cp context/UI.md ../<project-name>-context-private/context/UI.md
cd ../<project-name>-context-private
git add context/PROJECT_GUIDE.md context/DECISIONS.md context/PROJECT_HANDOFF.md context/TEAM_INTERNAL.md context/UI.md
git commit -m "Update private context"
git push
```

## Rules

- Public repo owns code and public docs.
- Private companion repo owns private AI/team context.
- Do not commit private context files to the public repo.
- Do not use the private companion repo for code changes.
- Pull private context before starting work.
- Keep this file short; move durable project reasoning to `DECISIONS.md`.
