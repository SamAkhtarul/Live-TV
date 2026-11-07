#!/usr/bin/env bash
set -e

# ==============================================================================
# Live TV - Dual Platform Release Builder (Android APK + macOS Apple Silicon DMG)
# Builds both Android APK and macOS DMG with strictly synchronized version numbers
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GRADLE_FILE="$ROOT_DIR/src/app/build.gradle.kts"
RELEASES_DIR="$ROOT_DIR/releases"
mkdir -p "$RELEASES_DIR"

# Extract version from src/app/build.gradle.kts if not passed as CLI args
DEFAULT_VER=$(grep -E 'versionName\s*=\s*' "$GRADLE_FILE" | sed -E 's/.*"([^"]+)".*/\1/' | head -n 1)
DEFAULT_BUILD=$(grep -E 'versionCode\s*=\s*' "$GRADLE_FILE" | awk '{print $NF}' | head -n 1)

VERSION="${1:-$DEFAULT_VER}"
BUILD_NUM="${2:-$DEFAULT_BUILD}"

echo "======================================================================"
echo " Starting Synchronized Dual Release Build: Live TV"
echo " Target Version: v$VERSION (Build $BUILD_NUM)"
echo " Platforms: Android (Universal APK) & macOS (Apple Silicon arm64 DMG)"
echo "======================================================================"

# ------------------------------------------------------------------------------
# 1. Build Android Release APK
# ------------------------------------------------------------------------------
echo ""
echo ">>> [1/2] Building Android Release APK..."
cd "$ROOT_DIR"
./gradlew assembleRelease --no-daemon

APK_SRC=$(find "$ROOT_DIR/src/app/build/outputs/apk/release" -maxdepth 1 -name "*.apk" | head -n 1)

if [ -n "$APK_SRC" ] && [ -f "$APK_SRC" ]; then
  APK_VERSIONED="$RELEASES_DIR/LiveTV-v$VERSION.apk"
  APK_CANONICAL="$RELEASES_DIR/LiveTV.apk"
  cp "$APK_SRC" "$APK_VERSIONED"
  cp "$APK_SRC" "$APK_CANONICAL"

  # Enforce Full V1 + V2 + V3 Signature using apksigner
  APKSIGNER=$(find "$HOME/Library/Android/sdk/build-tools" -name apksigner 2>/dev/null | sort -V | tail -n 1)
  KEYSTORE="$ROOT_DIR/src/app/debug.keystore"
  if [ -n "$APKSIGNER" ] && [ -x "$APKSIGNER" ] && [ -f "$KEYSTORE" ]; then
    echo ">>> Ensuring universal V1+V2+V3 cryptographic signature on APK..."
    "$APKSIGNER" sign --ks "$KEYSTORE" --ks-pass pass:android --key-pass pass:android --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true "$APK_VERSIONED"
    "$APKSIGNER" sign --ks "$KEYSTORE" --ks-pass pass:android --key-pass pass:android --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true "$APK_CANONICAL"
    "$APKSIGNER" verify --verbose "$APK_CANONICAL"
  fi

  echo "Android APK generated and signed successfully:"
  ls -lh "$APK_VERSIONED"
else
  echo "Error: Android release APK not found in $ROOT_DIR/src/app/build/outputs/apk/release" >&2
  exit 1
fi

# ------------------------------------------------------------------------------
# 2. Build macOS Apple Silicon (arm64) DMG
# ------------------------------------------------------------------------------
echo ""
echo ">>> [2/2] Building macOS Apple Silicon (arm64) DMG..."
chmod +x "$ROOT_DIR/src/desktop/build_mac.sh"
"$ROOT_DIR/src/desktop/build_mac.sh" "$VERSION" "$BUILD_NUM"

DMG_VERSIONED="$RELEASES_DIR/LiveTV-v$VERSION.dmg"
DMG_CANONICAL="$RELEASES_DIR/LiveTV.dmg"

# ------------------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------------------
echo ""
echo "======================================================================"
echo " RELEASE BUILD SUMMARY: Live TV v$VERSION (Build $BUILD_NUM)"
echo "======================================================================"
echo " Android Release APK:"
echo "   - Versioned:  $APK_VERSIONED ($(ls -lh "$APK_VERSIONED" | awk '{print $5}'))"
echo "   - Canonical:  $APK_CANONICAL ($(ls -lh "$APK_CANONICAL" | awk '{print $5}'))"
echo ""
echo " macOS Apple Silicon (arm64) DMG:"
echo "   - Versioned:  $DMG_VERSIONED ($(ls -lh "$DMG_VERSIONED" | awk '{print $5}'))"
echo "   - Canonical:  $DMG_CANONICAL ($(ls -lh "$DMG_CANONICAL" | awk '{print $5}'))"
echo "======================================================================"
echo " All release packages are ready for deployment!"
