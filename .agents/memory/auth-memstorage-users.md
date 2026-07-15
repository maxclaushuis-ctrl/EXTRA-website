---
name: Login gebruikt in-memory users, niet de DB-tabel
description: Waarom een user in de Postgres users-tabel niet kan inloggen in deze test-repl
---
De app gebruikt `MemStorage` (server/storage.ts): gebruikers voor login worden **in code geseed** (admin@extra.nl/admin123 etc.) en leven alleen in het geheugen. De Postgres-tabel `users` wordt wél gebruikt als FK-doel (bv. `crm_companies.eigenaar_user_id`) maar NIET voor login.

**Why:** kostte meerdere debugrondes: Tommy in de DB aanmaken + wachtwoord resetten gaf steeds "Ongeldige inloggegevens" (401 in 1ms = user niet gevonden, geen bcrypt-compare).

**How to apply:** nieuwe inlogbare gebruikers moeten in de MemStorage-constructor worden geseed; als hun id met DB-rijen moet matchen (eigenaarschap-checks) moet het id expliciet gelijk zijn aan de DB-rij. Sales-accounts (Max/Tommy) halen hun wachtwoord uit env-vars `SALES_MAX_PASSWORD`/`SALES_TOMMY_PASSWORD` (development) — nooit hardcoden. Wachtwoordwijzigingen via login zijn niet persistent (memory reset bij herstart).
