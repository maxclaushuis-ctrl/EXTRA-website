#!/usr/bin/env bash
# Voor- en nameting van Job in EXTRA-test (TESTOMGEVING=1). Gebruik: bash scripts/job-meting.sh [tak]
#
# De tak heeft twee commits bovenop livegang: <tak>~1 is de oude Job met de bijgewerkte testrunner (voormeting),
# <tak> is de testversie (nameting). Elke meting draait in een nieuwe tijdelijke map met een eigen git-worktree,
# zodat er nooit oude uitvoer wordt ingepakt. De werkmap van EXTRA-test blijft ongemoeid, op de archieven na.
# Per stap de volledige uitvoer (<stap>.txt) en de eigen exitcode (<stap>.code). Elk archief bevat commit.txt.
# De nameting wordt vergeleken met de voormeting van dezelfde run (zelfde tijdstempel in de archiefnaam).
set -u
[ "${TESTOMGEVING:-}" = "1" ] || { echo "Alleen in EXTRA-test (TESTOMGEVING=1)."; exit 1; }
W=$(git rev-parse --show-toplevel) || exit 1
TAK=${1:-job-meting-5}
git -C "$W" fetch -q origin "$TAK" || { echo "Tak $TAK niet gevonden op origin."; exit 1; }
VOOR=$(git -C "$W" rev-parse "origin/$TAK~1") || exit 1
NA=$(git -C "$W" rev-parse "origin/$TAK") || exit 1
STEMPEL=$(date +%Y%m%d-%H%M%S)
echo "Meting $STEMPEL: voor $VOOR, na $NA"

stap() { local n=$1; shift; "$@" > "uit/$n.txt" 2>&1; echo $? > "uit/$n.code"; echo "  $n: exitcode $(cat "uit/$n.code")"; }

meet() {
  local naam=$1 commit=$2 voorUit=${3:-} D
  D=$(mktemp -d "/tmp/meting-$naam-$STEMPEL-XXXXXX") || return 1
  git -C "$W" worktree add -q --detach "$D/repo" "$commit" || return 1
  cd "$D/repo" || return 1
  ln -s "$W/node_modules" node_modules
  mkdir uit
  { echo "meting $naam $STEMPEL"; echo "commit $commit"; git log --oneline -1; echo "tak $TAK"; echo "gestart $(date -u +%FT%TZ)"; } > uit/commit.txt
  echo "$naam ($commit) in $D"
  stap tsc npx tsc --tsBuildInfoFile "$D/tsbuildinfo"
  stap tsc-runner npx tsc -p scripts/tsconfig.gesprekstest.json
  stap build npm run build
  stap tests npm run job:test
  stap runnertest npx tsx scripts/job-gesprekstest.test.ts
  JOB_TEST_SET=v2 JOB_TEST_UIT=uit/gesprekstest.txt stap gesprekstest npm run job:gesprekstest
  if [ -n "$voorUit" ]; then
    { echo "voormeting: $voorUit"; cat "$voorUit/commit.txt"; } > uit/vergeleken-met.txt
    stap vergelijking npx tsx scripts/job-gesprekstest-vergelijk.ts "$voorUit/gesprekstest.json" uit/gesprekstest.json
  fi
  echo "klaar $(date -u +%FT%TZ)" >> uit/commit.txt
  tar czf "$W/meting-$STEMPEL-$naam.tgz" -C "$D/repo" uit && echo "  archief: meting-$STEMPEL-$naam.tgz"
  UIT="$D/repo/uit"
}

UIT=""
meet voor "$VOOR" || { echo "Voormeting kon niet starten."; exit 1; }
VOOR_UIT=$UIT
meet na "$NA" "$VOOR_UIT" || { echo "Nameting kon niet starten."; exit 1; }
echo "Klaar. Stuur meting-$STEMPEL-voor.tgz en meting-$STEMPEL-na.tgz."
