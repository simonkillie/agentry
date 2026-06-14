# agentry — Goal & Loop Instructions

## Current goal (Phase 4 — UX fixes + submit 500 bug)

```
/goal Complete every item in CHECKLIST.md Phase 4 and verify each works before exiting.
The goal is met only when: (a) a real CLI-style submit WITH a device_hash returns HTTP 200
on the live site (the 500 bug is fixed), (b) the leaderboard renders the rankings table
ABOVE the "Get your score" box, with a CEST-formatted timestamp column and a scroll region
that activates past ~20 rows, (c) the copied agent prompt instructs the agent to ask the user
before submitting, (d) stale verify-*/test records are gone and verify.sh no longer leaves new
ones behind, and (e) `bash verify.sh` ends with `VERIFY OK <https url>` and no FAIL lines.
Constraints: do not weaken verify.sh; never commit secrets; verify live behavior with curl
before declaring done.
```

---

## How the loop works

The `/goal` primitive keeps Claude working turn after turn. "Done" = `verify.sh` printed
`VERIFY OK <url>` in the transcript AND the live-behavior curls in CHECKLIST Phase 4 pass.

### Prerequisites
```bash
export VERCEL_TOKEN=...
export DATABASE_URL=...   # Neon Postgres (same DB Vercel uses)
export NPM_TOKEN=...      # npm automation token
```

---

## Phase history

| Phase | Goal | Status |
|-------|------|--------|
| Phase 1 — MVP | Build CLI + web leaderboard, 15 verify checks | ✅ Done |
| Phase 2 — Distribution | Publish npm, deploy to agentry-cli.vercel.app | ✅ Done |
| Phase 3 — Quality | Fix 20+ audit issues, 20 verify checks | ✅ Done |
| Phase 3.5 — Security | Anonymous handle/device id, body cap, supply-chain review | ✅ Done |
| Phase 4 — UX + 500 fix | Table order, timestamps, scroll, agent-prompt-to-confirm, fix submit 500 | 🔄 Active |

---

## verify.sh contract
`verify.sh` is the acceptance gate; never weaken it. Each phase adds checks; none are removed.
