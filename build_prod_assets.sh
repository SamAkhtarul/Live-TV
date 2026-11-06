#!/usr/bin/env bash
set -e

# ==============================================================================
# Live TV - Production Code Protection & Obfuscation Engine
# Protects intellectual property by transforming source code into heavily
# obfuscated, compressed, and encrypted production assets.
# ==============================================================================

WEB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$WEB_DIR/src_js"
JS_DIR="$WEB_DIR/js"

echo "======================================================================"
echo " 🛡️  Live TV - Building Protected & Obfuscated Production Assets"
echo "======================================================================"

if [ ! -d "$SRC_DIR" ]; then
  mkdir -p "$SRC_DIR"
  cp "$JS_DIR/app.js" "$SRC_DIR/app.src.js"
  cp "$JS_DIR/cenc_decryptor.js" "$SRC_DIR/cenc_decryptor.src.js"
fi

# 0. Bundle modular MVC sources into app.src.js
if [ -f "$SRC_DIR/index.js" ]; then
  echo ">>> [0/3] Bundling modular MVC sources into app.src.js..."
  npx -y esbuild "$SRC_DIR/index.js" --bundle --format=iife --outfile="$SRC_DIR/app.src.js"
fi

# 1. Obfuscate app.src.js -> js/app.js
echo ">>> [1/3] Obfuscating and encrypting app.src.js..."
npx -y javascript-obfuscator "$SRC_DIR/app.src.js" \
  --output "$JS_DIR/app.js" \
  --compact true \
  --target browser \
  --identifier-names-generator hexadecimal \
  --rename-globals false \
  --string-array true \
  --string-array-encoding base64 \
  --string-array-threshold 0.75 \
  --source-map false \
  --numbers-to-expressions true

# 2. Obfuscate cenc_decryptor.src.js -> js/cenc_decryptor.js
echo ">>> [2/3] Obfuscating and encrypting cenc_decryptor.src.js..."
npx -y javascript-obfuscator "$SRC_DIR/cenc_decryptor.src.js" \
  --output "$JS_DIR/cenc_decryptor.js" \
  --compact true \
  --target browser \
  --identifier-names-generator hexadecimal \
  --rename-globals false \
  --string-array true \
  --string-array-encoding base64 \
  --string-array-threshold 0.75 \
  --source-map false \
  --numbers-to-expressions true

# 3. Minify channels_data.js
echo ">>> [3/3] Minifying channels_data.js..."
npx -y terser "$JS_DIR/channels_data.js" -c -m --comments false -o "$JS_DIR/channels_data.js.tmp"
mv "$JS_DIR/channels_data.js.tmp" "$JS_DIR/channels_data.js"

# Verify Syntax
node --check "$JS_DIR/app.js"
node --check "$JS_DIR/cenc_decryptor.js"
node --check "$JS_DIR/channels_data.js"

echo "======================================================================"
echo " ✅ Production assets protected and obfuscated successfully!"
echo "    - js/app.js ($(ls -lh "$JS_DIR/app.js" | awk '{print $5}'))"
echo "    - js/cenc_decryptor.js ($(ls -lh "$JS_DIR/cenc_decryptor.js" | awk '{print $5}'))"
echo "    - js/channels_data.js ($(ls -lh "$JS_DIR/channels_data.js" | awk '{print $5}'))"
echo "======================================================================"

