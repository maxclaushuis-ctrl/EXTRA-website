#!/usr/bin/env bash
# Zet alles voor EXTRA-test in één keer klaar voor publicatie (TESTOMGEVING=1), zonder verrassingen:
# eerst livegang (site, blog, presentaties), dan de testtak van Job.
#
#   git fetch -q origin job-meting-6 && bash <(git show origin/job-meting-6:scripts/job-testpublicatie.sh)
#
# 1. Controleert de actieve branch (verwacht: patches-okt) en lokale wijzigingen. Andere gewijzigde bestanden
#    dan replit.nix: stop, er wordt niets aangeraakt. Nieuwe, niet-gevolgde bestanden blijven staan.
# 2. Legt de huidige stand vast (voor-job-rustig.txt en de lokale branch voor-job-rustig).
# 3. Voegt origin/livegang en daarna origin/<tak> samen in de actieve branch (geen fast-forward). Wat er al in
#    zit, wordt overgeslagen. Bij een conflict: afgebroken en terug naar de vastgelegde stand.
# 4. Test precies deze commit: npm run job:test en npm run build. Alleen als beide slagen, staat de commit in
#    getest-job-rustig.txt en mag hij gepubliceerd worden.
# Terugzetten met behoud van lokaal werk: git reset --keep voor-job-rustig (of de vorige publicatie in Replit).
set -u
[ "${TESTOMGEVING:-}" = "1" ] || { echo "Alleen in EXTRA-test (TESTOMGEVING=1). Er is niets veranderd."; exit 1; }
TAK=${1:-job-meting-6}
VERWACHT=${2:-patches-okt}
TAKKEN=${3:-"livegang $TAK"}
cd "$(git rev-parse --show-toplevel)" || exit 1

BRANCH=$(git symbolic-ref --short -q HEAD || echo "")
echo "Actieve branch: ${BRANCH:-(geen, losse commit)}"
[ "$BRANCH" = "$VERWACHT" ] || { echo "Stop: verwacht branch $VERWACHT. Er is niets veranderd."; exit 1; }

ANDERS=$(git status --porcelain --untracked-files=no | grep -v ' replit.nix$' || true)
echo "Lokale wijzigingen (gevolgde bestanden):"; git status --short --untracked-files=no | sed 's/^/  /'
[ -z "$ANDERS" ] || { echo "Stop: er zijn lokale wijzigingen naast replit.nix. Er is niets veranderd."; exit 1; }

for T in $TAKKEN; do git fetch -q origin "$T" || { echo "Stop: tak $T niet gevonden op origin. Er is niets veranderd."; exit 1; }; done
VOOR=$(git rev-parse HEAD)
echo "Nu: $(git log --oneline -1 HEAD)"
NODIG=""
for T in $TAKKEN; do
  echo "Tak $T: $(git log --oneline -1 "origin/$T")"
  git merge-base --is-ancestor "origin/$T" HEAD || NODIG="$NODIG $T"
done

if [ -z "$NODIG" ]; then
  echo "Alles zit er al in; niets samengevoegd."
  [ -s voor-job-rustig.txt ] && VOOR=$(head -1 voor-job-rustig.txt)
else
  echo "$VOOR" > voor-job-rustig.txt
  git branch -f voor-job-rustig "$VOOR"
  echo "Vastgelegd voor terugzetten: $VOOR (voor-job-rustig.txt, branch voor-job-rustig)"
  for T in $NODIG; do
    if ! git merge --no-ff --no-edit "origin/$T"; then
      git merge --abort 2>/dev/null
      git reset -q --keep "$VOOR"
      echo "Stop: conflict bij het samenvoegen van $T; afgebroken en terug naar $VOOR. Niet publiceren."
      exit 1
    fi
    echo "Samengevoegd: $T"
  done
fi
GETEST=$(git rev-parse HEAD)
echo "Te testen commit: $(git log --oneline -1 HEAD)"

LOG=$(mktemp -d /tmp/testpublicatie-XXXXXX)
npm run job:test > "$LOG/job-test.txt" 2>&1; T=$?
echo "  npm run job:test: exitcode $T ($(grep -c '✗' "$LOG/job-test.txt") mislukte tests)"
npm run build > "$LOG/build.txt" 2>&1; B=$?
echo "  npm run build: exitcode $B"
if [ "$T" != "0" ] || [ "$B" != "0" ]; then
  echo "Niet publiceren: een test of de build faalde. Uitvoer in $LOG."
  grep '✗' "$LOG/job-test.txt" | head -20
  echo "Terugzetten met behoud van lokaal werk: git reset --keep $VOOR"
  exit 1
fi
[ "$(git rev-parse HEAD)" = "$GETEST" ] || { echo "Stop: HEAD veranderde tijdens het testen. Niet publiceren."; exit 1; }
ANDERS=$(git status --porcelain --untracked-files=no | grep -v ' replit.nix$' || true)
[ -z "$ANDERS" ] || { echo "Stop: de build veranderde gevolgde bestanden. Niet publiceren."; git status --short --untracked-files=no; exit 1; }
{ echo "$GETEST"; date -u +%FT%TZ; } > getest-job-rustig.txt
echo "Getest en klaar om te publiceren: $(git log --oneline -1 HEAD)"
echo "Publiceer nu EXTRA-test. Terugzetten: de vorige publicatie in Replit, of git reset --keep $VOOR en opnieuw publiceren."
