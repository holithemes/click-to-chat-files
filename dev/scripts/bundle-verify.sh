#!/bin/bash

# Bundle Verify — sanity-checks the distribution zip produced by `npm run bundle`.
#
# Checks:
#   1. Zip exists and is a plausible size
#   2. Required top-level files/dirs are present
#   3. No dev-only or hidden entries leaked in (dot files, _* files, node_modules,
#      dev/, .claude, vendor, config files)
#   4. Version inside the zip (click-to-chat-files.php header, HT_CTC_FILES_VERSION,
#      readme.txt Stable tag) all agree — and match the working-tree version
#
# Usage: bash dev/scripts/bundle-verify.sh
# Exit codes: 0 = ok, 1 = problems found

set -u
cd "$(dirname "$0")/../.."

ZIP="dev/bundle/click-to-chat-files.zip"
FAIL=0

fail() { echo "❌ $1"; FAIL=1; }
ok()   { echo "✅ $1"; }

echo "── Bundle verification: $ZIP ──"

# 1. Exists + size
if [ ! -f "$ZIP" ]; then
    fail "zip not found — run: npm run bundle"
    exit 1
fi
SIZE=$(stat -f %z "$ZIP" 2>/dev/null || stat -c %s "$ZIP")
if [ "$SIZE" -lt 10000 ]; then
    fail "zip suspiciously small ($((SIZE / 1024)) KB)"
else
    ok "zip size: $((SIZE / 1024)) KB"
fi

LIST=$(unzip -Z1 "$ZIP")

# 2. Required entries
for req in click-to-chat-files.php readme.txt index.php "admin/" "admin2/" "inc/" "tools/"; do
    if echo "$LIST" | grep -q "^${req}"; then
        ok "contains $req"
    else
        fail "missing $req"
    fi
done

# 3. Forbidden entries
FORBIDDEN=$(echo "$LIST" | grep -E '(^|/)\.[^/]|(^|/)_[^/]|^(node_modules|dev|\.claude|\.github|\.husky)/|(^|/)(package(-lock)?\.json|composer\.(json|lock)|webpack\.config\.js|vitest\.config\.js|eslint\.config\.mjs|phpcs\.xml|phpunit\.xml|CLAUDE\.md|AGENTS\.md)$' || true)
if [ -n "$FORBIDDEN" ]; then
    fail "dev-only/hidden entries leaked into zip:"
    echo "$FORBIDDEN" | head -20 | sed 's/^/     /'
else
    ok "no dev-only or hidden files"
fi

# 4. Version consistency inside the zip vs working tree
Z_HEADER=$(unzip -p "$ZIP" click-to-chat-files.php | grep -m1 'Version:' | grep -oE '[0-9.]+')
Z_CONST=$(unzip -p "$ZIP" click-to-chat-files.php | grep -m1 "define(.*HT_CTC_FILES_VERSION" | grep -oE "[0-9]+\.[0-9.]+")
Z_STABLE=$(unzip -p "$ZIP" readme.txt | grep -m1 -i 'Stable tag:' | grep -oE '[0-9.]+')
WT_HEADER=$(grep -m1 'Version:' click-to-chat-files.php | grep -oE '[0-9.]+')

if [ "$Z_HEADER" = "$Z_CONST" ] && [ "$Z_HEADER" = "$Z_STABLE" ] && [ "$Z_HEADER" = "$WT_HEADER" ]; then
    ok "version consistent: $Z_HEADER (header / constant / stable tag / working tree)"
else
    fail "version mismatch — zip header: ${Z_HEADER:-?}, constant: ${Z_CONST:-?}, stable tag: ${Z_STABLE:-?}, working tree: ${WT_HEADER:-?}"
fi

# Changelog entry for this version present in the zip?
if unzip -p "$ZIP" readme.txt | grep -qE "^= *${Z_HEADER} *="; then
    if unzip -p "$ZIP" readme.txt | sed -n "/^= *${Z_HEADER} *=/,/^= /p" | grep -q "TODO"; then
        fail "changelog entry for $Z_HEADER still contains TODO stub"
    else
        ok "changelog entry for $Z_HEADER present"
    fi
else
    fail "no changelog entry for $Z_HEADER in readme.txt"
fi

echo ""
if [ "$FAIL" -eq 1 ]; then
    echo "⚠️  Bundle verification FAILED — fix the issues above and re-bundle."
    exit 1
fi
echo "Bundle looks good: $ZIP"
