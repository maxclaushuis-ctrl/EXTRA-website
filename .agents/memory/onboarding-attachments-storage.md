---
name: File attachment storage (Object Storage migration)
description: All app file storage (onboarding PDFs, CVs, WhatsApp-AI attachments) lives in Replit Object Storage; old Supabase files are unrecoverable
---

**All file storage in this app now lives in Replit Object Storage** (App Storage), not Supabase. Supabase is fully retired — there are no remaining `./supabase` imports in `server/`.

- Onboarding-bijlagen → `server/objectStorageBijlagen.ts` (prefix `onboarding-bijlagen/`); `bestandspad` in `onboarding_bijlagen` table holds the full object path.
- CVs and WhatsApp-AI attachments → `server/objectStorageFiles.ts` (generic upload/download/delete + CV/WA wrappers, prefixes `cvs/` and `wa-ai-attachments/`). A CV's `candidates.cvFilename` now stores the full object path (starts `/replit-objstore-`), no longer an http URL.

**Why:** the previous Supabase storage broke repeatedly — multiple Supabase projects that once hosted these files were deleted (hostnames no longer resolve via DNS), so uploads/downloads failed. Candidates could not upload CVs at all once the project died.

**How to apply:** detect Object-Storage-backed files with `isObjectStoragePath()` (path starts `/replit-objstore-`), NOT `startsWith('http')`. Any new file-storage feature should use `objectStorageFiles.ts`, never Supabase.

**Sending fails closed:** onboarding send (`verstuurOnboardingMail` in `onboardingService.ts`) and testmail route refuse to send if any linked attachment can't be loaded. The admin candidate-notification mail bases its "CV bijgevoegd" banner on whether the CV actually loaded (`hasAttachableCv`), not just on `cvFilename` presence.

**Dev and production use SEPARATE databases.** The dev DB (via `DATABASE_URL`) and the deployed production DB are not the same dataset — they can hold very different rows for the same table. When debugging "works in dev but not in prod" data issues, query production read-only (database skill, `environment: "production"`).

**Recovery note:** PDFs whose `bestandspad` points to `uploads/...` (ephemeral local disk, wiped on redeploy) or to a deleted Supabase host are gone — the bytes exist nowhere and must be re-uploaded through the app UI, which now writes to Object Storage.
