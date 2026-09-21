#!/usr/bin/env bash
# Visi sargai vienu paleidimu (DARBO-SISTEMA A6). Paleisti iš repo šaknies:
#   bash tools/sargai.sh
# mygtukai.test reikia veikiančio peržiūros serverio + playwright; sesija/migracija
# reikia backend/auth.js kopijos testų kataloge - jie praleidžiami, jei aplinka jų nepalaiko.
cd "$(dirname "$0")/.." || exit 1
ok=0; bl=0; praleista=0
for f in backend/testai/*.test.js; do
  n=$(basename "$f" .test.js)
  out=$(timeout 120 node "$f" 2>&1); kodas=$?
  paskut=$(printf '%s\n' "$out" | grep -v '^\s*$' | tail -1)
  if printf '%s' "$out" | grep -q "Cannot find module '\(playwright\|\./auth\.js\|\./planai\)'"; then
    praleista=$((praleista+1)); printf '  –  %-22s praleista (aplinka)\n' "$n"
  elif [ $kodas -eq 0 ]; then ok=$((ok+1)); printf '  ✓  %-22s %s\n' "$n" "$paskut"
  else bl=$((bl+1)); printf '  ✗  %-22s %s\n' "$n" "$paskut"; fi
done
echo "Sargai: $ok žali, $bl krenta, $praleista praleisti"
[ $bl -eq 0 ]
