#!/usr/bin/env bash
# Voor- en nameting van Job in EXTRA-test (TESTOMGEVING=1).
#
#   bash scripts/job-meting.sh [tak] [nameting-commit] [voormeting-commit]
#
# Nameting: de exacte commit van de testpublicatie, zoals scripts/job-testpublicatie.sh die vastlegde in
# getest-job-rustig.txt (de samengevoegde commit op patches-okt die op EXTRA-test staat). Voormeting: de stand
# daarvoor (voor-job-rustig.txt), dus de vorige testpublicatie. Zonder die bestanden: <tak> en <tak>~1.
# Beide metingen draaien met de testrunner van de nameting (dezelfde gesprekken, dezelfde controles); de runner
# werkt ook op de oudere Job-code. Elke meting draait in een nieuwe tijdelijke map met een eigen git-worktree.
# Per stap de volledige uitvoer (<stap>.txt) en de eigen exitcode (<stap>.code). Elk archief bevat commit.txt.
set -u
[ "${TESTOMGEVING:-}" = "1" ] || { echo "Alleen in EXTRA-test (TESTOMGEVING=1)."; exit 1; }
W=$(git rev-parse --show-toplevel) || exit 1
TAK=${1:-job-meting-6}
git -C "$W" fetch -q origin "$TAK" || { echo "Tak $TAK niet gevonden op origin."; exit 1; }
eerste() { [ -s "$W/$1" ] && head -1 "$W/$1" || true; }
NA_IN=${2:-$(eerste getest-job-rustig.txt)}
VOOR_IN=${3:-$(eerste voor-job-rustig.txt)}
BRON_NA="exacte commit van de testpublicatie (getest-job-rustig.txt)"
[ -n "${2:-}" ] && BRON_NA="opgegeven commit"
[ -n "$NA_IN" ] || { NA_IN="origin/$TAK"; BRON_NA="tak $TAK"; }
[ -n "$VOOR_IN" ] || VOOR_IN="$NA_IN~1"
NA=$(git -C "$W" rev-parse --verify "$NA_IN^{commit}") || { echo "Nameting-commit $NA_IN onbekend."; exit 1; }
VOOR=$(git -C "$W" rev-parse --verify "$VOOR_IN^{commit}") || { echo "Voormeting-commit $VOOR_IN onbekend."; exit 1; }
HUIDIG=$(git -C "$W" rev-parse HEAD)
[ "$HUIDIG" = "$NA" ] || echo "Let op: de werkmap staat op $HUIDIG, gemeten wordt $NA ($BRON_NA)."
STEMPEL=$(date +%Y%m%d-%H%M%S)
echo "Meting $STEMPEL: voor $VOOR, na $NA ($BRON_NA)"
RUNNER_BESTANDEN="scripts/job-gesprekstest.ts scripts/jobGesprekken.ts scripts/job-gesprekstest-vergelijk.ts scripts/job-gesprekstest.test.ts scripts/tsconfig.gesprekstest.json"

stap() { local n=$1; shift; "$@" > "uit/$n.txt" 2>&1; echo $? > "uit/$n.code"; echo "  $n: exitcode $(cat "uit/$n.code")"; }

meet() {
  local naam=$1 commit=$2 voorUit=${3:-} D f
  D=$(mktemp -d "/tmp/meting-$naam-$STEMPEL-XXXXXX") || return 1
  git -C "$W" worktree add -q --detach "$D/repo" "$commit" || return 1
  cd "$D/repo" || return 1
  # Dezelfde testrunner en gesprekken als de nameting, ook op de oudere code.
  for f in $RUNNER_BESTANDEN; do git -C "$W" show "$NA:$f" > "$f" 2>/dev/null || echo "  (runnerbestand $f ontbreekt in $NA)"; done
  ln -s "$W/node_modules" node_modules
  mkdir uit
  { echo "meting $naam $STEMPEL"; echo "commit $commit"; git log --oneline -1; echo "tak $TAK"; echo "testrunner uit $NA"
    [ "$naam" = "na" ] && echo "bron: $BRON_NA"; echo "gestart $(date -u +%FT%TZ)"; } > uit/commit.txt
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
