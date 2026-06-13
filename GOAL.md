# agentry — Goal & Loop Instructions

## Current goal (Phase 3 — Quality & Hardening)

```
/goal Fix all issues listed in CHECKLIST.md Phase 3, working items in order and ticking
each box when its check passes. The goal is met only when, in this conversation, you have
run `bash verify.sh` from a clean state after your final change and its output ends with
a line beginning `VERIFY OK ` followed by an https:// production URL, with no line of
that output containing the token `FAIL`. Constraints: do not edit verify.sh to remove,
skip, or weaken any check; do not mark a CHECKLIST item complete unless its check actually
passed; never commit secrets or session transcript content. If not met after 40 turns, stop
and write remaining work to PROGRESS.md.
```

---

## How the loop works

The `/goal` primitive keeps Claude working turn after turn. The evaluator checks whether
`verify.sh` printed its success sentinel (`VERIFY OK <url>`) in the conversation.

### Prerequisites (must exist before launch)

```bash
gh auth login
export VERCEL_TOKEN=...
export DATABASE_URL=...   # Neon Postgres connection string (same DB as Vercel uses)
export NPM_TOKEN=...      # npm automation token (bypasses 2FA)
```

### Launch

Start Claude Code in this directory, enable auto mode, then paste the goal condition above
after `/goal`. For headless: `claude -p --dangerously-skip-permissions`.

### If it stops short

Relaunch and paste the same condition. The agent rebuilds state from CHECKLIST.md and
PROGRESS.md and continues.

---

## Phase history

| Phase | Goal | Status |
|-------|------|--------|
| Phase 1 — MVP | Build CLI + web leaderboard, pass 15 verify.sh checks | ✅ Done |
| Phase 2 — Distribution | Publish npm package, deploy to agentry-cli.vercel.app | ✅ Done |
| Phase 3 — Quality | Fix 20+ issues from 3-reviewer audit; pass all 20 verify.sh checks | 🔄 Active |

---

## verify.sh contract

`verify.sh` is the acceptance gate. It must never be weakened. Each phase adds checks;
no check is ever removed. Current total: **20 checks**.
