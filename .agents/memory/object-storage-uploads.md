---
name: Object Storage uploads — resumable:false in deployment
description: Why server-side @google-cloud/storage uploads hang in Replit deployments and how to keep them reliable.
---

# Object Storage uploads stall in deployment unless resumable is disabled

The Replit Object Storage integration exposes a `@google-cloud/storage` `Storage`
client (`objectStorageClient`) that authenticates through the Replit sidecar at
`http://127.0.0.1:1106`. Server-side uploads use `bucket(...).file(...).save(buffer, ...)`.

**Rule:** always pass `resumable: false` to `file.save()` for these uploads, and
wrap the call in a hard timeout that fails loudly.

**Why:** `file.save()` defaults to a *resumable* upload — an extra session-init
round trip before the data PUT. In the workspace (dev) this works fine, but in the
Autoscale **deployment** the resumable session init can stall indefinitely. Symptom:
multipart POST/PUT never completes, the request hangs forever (UI stuck on
"Uploaden…"), and there is **no finish log line** (the request logger fires on
response `finish`, which never happens). GET/DELETE on the same routes keep working,
which makes it look like a route/CORS problem when it is actually the upload call.
A single-shot (`resumable: false`) upload is one request — faster and reliable for
the small PDFs/CVs/attachments this app stores.

**How to apply:** any new server-side Object Storage upload helper must use
`resumable: false` and a timeout race (`Promise.race` + `clearTimeout` on settle).
Note the timeout does NOT cancel the underlying `save()`, so a timed-out upload may
still land an orphan object; acceptable for now, reconcile later if retries get noisy.
This bit both the onboarding-bijlagen helper and the shared CV/WhatsApp-AI helper —
they share the same pattern, so fix them together.
