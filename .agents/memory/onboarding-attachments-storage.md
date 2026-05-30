---
name: Onboarding attachment storage
description: How onboarding e-mail PDF attachments are stored and why old ones are unrecoverable
---

Onboarding-bijlagen (PDF attachments on onboarding e-mails) are stored in **Replit Object Storage** (App Storage), via `server/objectStorageBijlagen.ts` (server-side buffer upload/download/delete under the `onboarding-bijlagen/` prefix in the private bucket). `bestandspad` in the `onboarding_bijlagen` table holds the full object path (starts with `/replit-objstore-`).

**Why:** the previous Supabase storage broke twice — two different Supabase projects that once hosted these PDFs were deleted (their hostnames no longer resolve via DNS). Mails were silently sent without attachments because uploads/downloads failed quietly.

**Sending fails closed:** both the real send (`verstuurOnboardingMail` in `onboardingService.ts`) and the testmail route refuse to send if any linked attachment cannot be loaded — better a clear error than a mail missing its PDF.

**CV uploads and WhatsApp-AI attachments still use Supabase** (`server/supabase.ts`) intentionally — only onboarding-bijlagen were moved.

**Dev and production use SEPARATE databases.** The dev DB (via `DATABASE_URL`) and the deployed production DB are not the same dataset — they can hold very different rows for the same table. When debugging "works in dev but not in prod" data issues, query production read-only (database skill, `environment: "production"`).

**Recovery note:** PDFs whose `bestandspad` points to `uploads/...` (ephemeral local disk, wiped on redeploy) or to a deleted Supabase host are gone — the bytes exist nowhere and must be re-uploaded through the app UI, which now writes to Object Storage.
