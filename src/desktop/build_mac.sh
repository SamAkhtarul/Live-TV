#!/usr/bin/env bash
set -e

# ==============================================================================
# Live TV - macOS Apple Silicon (arm64) App & DMG Release Builder
# Packages native Cocoa + WebKit + HLS Live TV app into LiveTV-v<version>.dmg
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

VERSION="${1:-3.2}"
BUILD_NUM="${2:-18}"

echo "======================================================================"
echo " Building Live TV for macOS Apple Silicon (arm64)"
echo " Version: $VERSION (Build $BUILD_NUM)"
echo "======================================================================"

BUILD_DIR="$SCRIPT_DIR/build"
APP_NAME="Live TV"
APP_BUNDLE="$BUILD_DIR/$APP_NAME.app"
RELEASES_DIR="$ROOT_DIR/releases"
mkdir -p "$RELEASES_DIR"
DMG_RELEASE="$RELEASES_DIR/LiveTV-v$VERSION.dmg"
DMG_CANONICAL="$RELEASES_DIR/LiveTV.dmg"

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# 1. Compile Native Swift Launcher for Apple Silicon (arm64)
echo "==> Compiling native Swift executable (arm64)..."
swiftc -O -target arm64-apple-macos11.0 \
  "$SCRIPT_DIR/src/controllers/"*.swift \
  "$SCRIPT_DIR/src/services/"*.swift \
  "$SCRIPT_DIR/src/AppDelegate.swift" \
  "$SCRIPT_DIR/src/AppMain.swift" \
  -o "$BUILD_DIR/LiveTV"

# 2. Generate Application Icon
echo "==> Generating AppIcon.icns..."
if [ -f "$SCRIPT_DIR/assets/AppIcon.icns" ]; then
  cp "$SCRIPT_DIR/assets/AppIcon.icns" "$BUILD_DIR/AppIcon.icns"
elif [ -f "/tmp/AppIcon.icns" ]; then
  cp "/tmp/AppIcon.icns" "$BUILD_DIR/AppIcon.icns"
else
  swift "$SCRIPT_DIR/generate_icon.swift"
  iconutil -c icns /tmp/LiveTV.iconset -o "$BUILD_DIR/AppIcon.icns"
fi

# 3. Create .app Bundle Directory Hierarchy
echo "==> Constructing $APP_NAME.app bundle..."
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources"

# Move binary and icon
cp "$BUILD_DIR/LiveTV" "$APP_BUNDLE/Contents/MacOS/LiveTV"
chmod +x "$APP_BUNDLE/Contents/MacOS/LiveTV"
cp "$BUILD_DIR/AppIcon.icns" "$APP_BUNDLE/Contents/Resources/AppIcon.icns"

# Ensure channels catalog is synchronized from SampleChannels.kt & M3U
echo "==> Synchronizing channel catalog..."
node "$SCRIPT_DIR/merge_channels.js"

# Copy Web App Assets
mkdir -p "$APP_BUNDLE/Contents/Resources/web"
cp -R "$SCRIPT_DIR/web/"* "$APP_BUNDLE/Contents/Resources/web/"

# 4. Generate Info.plist
cat <<EOF > "$APP_BUNDLE/Contents/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleExecutable</key>
    <string>LiveTV</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>com.example.livetv.mac</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>Live TV</string>
    <key>CFBundleDisplayName</key>
    <string>Live TV</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>$VERSION</string>
    <key>CFBundleVersion</key>
    <string>$BUILD_NUM</string>
    <key>LSMinimumSystemVersion</key>
    <string>11.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>
    <key>NSSupportsAutomaticGraphicsSwitching</key>
    <true/>
</dict>
</plist>
EOF

# 5. Package into DMG with Applications Symlink
echo "==> Staging DMG distribution image..."
STAGING_DIR="$BUILD_DIR/dmg_staging"
rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR"

cp -R "$APP_BUNDLE" "$STAGING_DIR/"
ln -s /Applications "$STAGING_DIR/Applications"

echo "==> Creating compressed disk image (.dmg)..."
rm -f "$DMG_RELEASE" "$DMG_CANONICAL"
hdiutil create \
  -volname "$APP_NAME" \
  -srcfolder "$STAGING_DIR" \
  -ov \
  -format UDZO \
  "$DMG_RELEASE"

cp "$DMG_RELEASE" "$DMG_CANONICAL"

echo "======================================================================"
echo " macOS Release Build Complete!"
echo " DMG: $DMG_RELEASE"
echo " Canonical DMG: $DMG_CANONICAL"
ls -lh "$DMG_RELEASE"
echo "======================================================================"

