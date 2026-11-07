import Cocoa

let scriptDir = URL(fileURLWithPath: CommandLine.arguments[0]).deletingLastPathComponent().path
let projectDir = URL(fileURLWithPath: scriptDir).deletingLastPathComponent().path

let sourceCandidatePaths = [
    "\(projectDir)/desktop/assets/app_icon_source.jpg",
    "\(projectDir)/desktop/assets/app_icon.png",
    "/Users/SAM/.gemini/antigravity/brain/2c326a2c-12b5-4eb4-b950-12c1f53daa68/.user_uploaded/media_1793436457016_f8804079.jpg"
]

var sourceImage: NSImage? = nil
for p in sourceCandidatePaths {
    if FileManager.default.fileExists(atPath: p), let img = NSImage(contentsOfFile: p) {
        sourceImage = img
        print("Using source icon from: \(p)")
        break
    }
}

guard let src = sourceImage,
      let tiff = src.tiffRepresentation,
      let rep = NSBitmapImageRep(data: tiff),
      let cgSrc = rep.cgImage else {
    print("Error: Could not load source icon image")
    exit(1)
}

// Crop to the squircle content (bounds 34, 11, 574, 574)
let cropRect = CGRect(x: 34, y: 11, width: 574, height: 574)
guard let croppedCG = cgSrc.cropping(to: cropRect) else {
    print("Error: Could not crop source icon image")
    exit(1)
}
let croppedNSImage = NSImage(cgImage: croppedCG, size: NSSize(width: 574, height: 574))

func renderMacIcon(size: CGFloat) -> NSImage {
    let img = NSImage(size: NSSize(width: size, height: size))
    img.lockFocus()

    guard let ctx = NSGraphicsContext.current?.cgContext else {
        img.unlockFocus()
        return img
    }

    ctx.interpolationQuality = .high

    let squircleSize = size * 0.8046875 // 824 / 1024 standard macOS squircle
    let originX = (size - squircleSize) / 2.0
    let originY = (size - squircleSize) / 2.0
    let squircleRect = CGRect(x: originX, y: originY, width: squircleSize, height: squircleSize)
    let cornerRadius = squircleSize * 0.224

    // 1. Subtle drop shadow
    ctx.saveGState()
    ctx.setShadow(offset: CGSize(width: 0, height: -size * 0.025), blur: size * 0.04, color: NSColor.black.withAlphaComponent(0.35).cgColor)
    let squirclePath = NSBezierPath(roundedRect: squircleRect, xRadius: cornerRadius, yRadius: cornerRadius)
    NSColor.black.setFill()
    squirclePath.fill()
    ctx.restoreGState()

    // 2. Draw cropped image clipped to squircle
    ctx.saveGState()
    squirclePath.addClip()
    croppedNSImage.draw(in: squircleRect, from: NSRect(origin: .zero, size: NSSize(width: 574, height: 574)), operation: .sourceOver, fraction: 1.0)
    ctx.restoreGState()

    img.unlockFocus()
    return img
}

func renderSquareIcon(size: CGFloat, roundRadiusRatio: CGFloat = 0.224) -> NSImage {
    let img = NSImage(size: NSSize(width: size, height: size))
    img.lockFocus()
    guard let ctx = NSGraphicsContext.current?.cgContext else {
        img.unlockFocus()
        return img
    }
    ctx.interpolationQuality = .high

    let rect = CGRect(x: 0, y: 0, width: size, height: size)
    let cornerRadius = size * roundRadiusRatio
    let path = NSBezierPath(roundedRect: rect, xRadius: cornerRadius, yRadius: cornerRadius)

    ctx.saveGState()
    path.addClip()
    croppedNSImage.draw(in: rect, from: NSRect(origin: .zero, size: NSSize(width: 574, height: 574)), operation: .sourceOver, fraction: 1.0)
    ctx.restoreGState()

    img.unlockFocus()
    return img
}

func renderCircleIcon(size: CGFloat) -> NSImage {
    let img = NSImage(size: NSSize(width: size, height: size))
    img.lockFocus()
    guard let ctx = NSGraphicsContext.current?.cgContext else {
        img.unlockFocus()
        return img
    }
    ctx.interpolationQuality = .high

    let rect = CGRect(x: 0, y: 0, width: size, height: size)
    let path = NSBezierPath(ovalIn: rect)

    ctx.saveGState()
    path.addClip()
    croppedNSImage.draw(in: rect, from: NSRect(origin: .zero, size: NSSize(width: 574, height: 574)), operation: .sourceOver, fraction: 1.0)
    ctx.restoreGState()

    img.unlockFocus()
    return img
}

func savePNG(image: NSImage, path: String) {
    guard let tiff = image.tiffRepresentation,
          let rep = NSBitmapImageRep(data: tiff),
          let png = rep.representation(using: .png, properties: [:]) else {
        print("Failed to render PNG for \(path)")
        return
    }
    let url = URL(fileURLWithPath: path)
    try? FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
    try? png.write(to: url)
}

let fm = FileManager.default

// 1. Generate macOS .iconset
let iconsetDir = "/tmp/LiveTV.iconset"
try? fm.removeItem(atPath: iconsetDir)
try? fm.createDirectory(atPath: iconsetDir, withIntermediateDirectories: true)

let macSizes: [(String, CGFloat)] = [
    ("icon_16x16.png", 16),
    ("icon_16x16@2x.png", 32),
    ("icon_32x32.png", 32),
    ("icon_32x32@2x.png", 64),
    ("icon_128x128.png", 128),
    ("icon_128x128@2x.png", 256),
    ("icon_256x256.png", 256),
    ("icon_256x256@2x.png", 512),
    ("icon_512x512.png", 512),
    ("icon_512x512@2x.png", 1024)
]

for (name, size) in macSizes {
    let img = renderMacIcon(size: size)
    savePNG(image: img, path: "\(iconsetDir)/\(name)")
}
print("macOS iconset generated at \(iconsetDir)")

// 2. Generate Web Assets (icon.png, favicon.png)
savePNG(image: renderSquareIcon(size: 512, roundRadiusRatio: 0.224), path: "\(projectDir)/desktop/web/icon.png")
savePNG(image: renderSquareIcon(size: 32, roundRadiusRatio: 0.224), path: "\(projectDir)/desktop/web/favicon.png")
print("Web icons saved to desktop/web/")

// 3. Generate Android Mipmap Icons
let androidSizes: [(String, CGFloat)] = [
    ("mipmap-mdpi", 48),
    ("mipmap-hdpi", 72),
    ("mipmap-xhdpi", 96),
    ("mipmap-xxhdpi", 144),
    ("mipmap-xxxhdpi", 192)
]

for (folder, size) in androidSizes {
    let resDir = "\(projectDir)/app/src/main/res/\(folder)"
    let squareImg = renderSquareIcon(size: size, roundRadiusRatio: 0.16)
    let roundImg = renderCircleIcon(size: size)
    savePNG(image: squareImg, path: "\(resDir)/ic_launcher.png")
    savePNG(image: roundImg, path: "\(resDir)/ic_launcher_round.png")
}
print("Android launcher icons generated for all mipmap buckets!")
