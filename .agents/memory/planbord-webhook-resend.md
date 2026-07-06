---
name: Planbord applicant.ready webhook is safely re-sendable
description: How to re-send a missed applicant.ready webhook and why it is safe
---

The receiving Planbord system is **idempotent** for `applicant.ready`: re-sending for an existing employee/application returns `{"status":"updated"}` and updates the existing candidate instead of creating a duplicate. It reads **only** `data.referralCode` (top-level in `data`) for referral registration — a missing field means the referral is silently dropped.

**How to re-send:** build the payload exactly like `/api/admin/applications/:id/aannemen` does (read the needed records from the production DB read-replica), then call `sendPlanbordWebhook` from a one-off tsx script in the workspace. `PLANBORD_WEBHOOK_URL` and `WEBHOOK_SECRET` are present in the dev workspace env and point to the real Planbord endpoint, so a dev-side script reaches production Planbord.

**Why:** on 2026-07-06 a referral (?ref) was missed because the referral fix wasn't deployed yet; a manual re-send with `referralCode` added registered it retroactively.
