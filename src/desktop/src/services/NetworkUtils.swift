import Foundation
import CoreImage
import Network

public func generateQRCodeSVG(from string: String) -> String {
    guard let filter = CIFilter(name: "CIQRCodeGenerator") else { return "" }
    filter.setValue(string.data(using: .utf8), forKey: "inputMessage")
    filter.setValue("M", forKey: "inputCorrectionLevel")
    guard let ciImage = filter.outputImage else { return "" }
    let extent = ciImage.extent
    let width = Int(extent.width)
    let height = Int(extent.height)

    let context = CIContext()
    guard let cgImage = context.createCGImage(ciImage, from: extent),
          let data = cgImage.dataProvider?.data,
          let bytes = CFDataGetBytePtr(data) else {
        return ""
    }

    var rects = ""
    for y in 0..<height {
        for x in 0..<width {
            let offset = (y * cgImage.bytesPerRow) + (x * 4)
            if bytes[offset] == 0 {
                rects += "<rect x=\"\(x)\" y=\"\(height - 1 - y)\" width=\"1\" height=\"1\" fill=\"#000000\"/>"
            }
        }
    }
    return "<svg viewBox=\"0 0 \(width) \(height)\" width=\"180\" height=\"180\" xmlns=\"http://www.w3.org/2000/svg\" shape-rendering=\"crispEdges\"><rect width=\"100%\" height=\"100%\" fill=\"#ffffff\"/>\(rects)</svg>"
}

public func getLocalIPAddress() -> String {
    var address = "127.0.0.1"
    var ifaddr: UnsafeMutablePointer<ifaddrs>?
    guard getifaddrs(&ifaddr) == 0, let firstAddr = ifaddr else { return address }
    for ptr in sequence(first: firstAddr, next: { $0.pointee.ifa_next }) {
        let flags = Int32(ptr.pointee.ifa_flags)
        let addr = ptr.pointee.ifa_addr.pointee
        if (flags & (IFF_UP|IFF_RUNNING|IFF_LOOPBACK)) == (IFF_UP|IFF_RUNNING) {
            if addr.sa_family == UInt8(AF_INET) {
                var hostname = [CChar](repeating: 0, count: Int(NI_MAXHOST))
                if getnameinfo(ptr.pointee.ifa_addr, socklen_t(ptr.pointee.ifa_addr.pointee.sa_len),
                               &hostname, socklen_t(hostname.count),
                               nil, socklen_t(0), NI_NUMERICHOST) == 0 {
                    let name = String(cString: hostname)
                    if !name.hasPrefix("127.") && !name.hasPrefix("169.254.") {
                        address = name
                        break
                    }
                }
            }
        }
    }
    freeifaddrs(ifaddr)
    return address
}

public func getLocalHostName() -> String {
    let raw = ProcessInfo.processInfo.hostName
    if raw.hasSuffix(".local") { return raw }
    return "\(raw).local"
}
