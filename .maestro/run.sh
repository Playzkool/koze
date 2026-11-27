#!/bin/sh
# Runs the Maestro flows against Kozé in Expo Go. See README.md.
#   sh .maestro/run.sh                                 all flows
#   sh .maestro/run.sh .maestro/category.yaml          one flow
#   sh .maestro/run.sh --exclude-tags network          offline only
#   METRO_PORT=8082 sh .maestro/run.sh                 Metro on another port
set -e

port="${METRO_PORT:-8081}"
if ! curl -sf "http://127.0.0.1:$port/status" | grep -q 'packager-status:running'; then
  echo "ERROR: Metro is not running on port $port. Start it first: npx expo start --port $port" >&2
  exit 1
fi

# Run every flow unless given one: options alone, such as --exclude-tags, don't name any.
has_flow=false
for arg in "$@"; do
  case "$arg" in
    *.yaml|*.yml|*/) has_flow=true ;;
  esac
done
"$has_flow" || set -- "$@" .maestro/

exec maestro test -e METRO_URL="exp://127.0.0.1:$port" "$@"
