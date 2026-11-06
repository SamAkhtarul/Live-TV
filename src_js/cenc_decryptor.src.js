/**
 * Live TV — Software CENC (ClearKey) Decryptor for macOS WebKit
 *
 * WebKit's built-in ClearKey CDM deadlocks the media pipeline after ~30s on
 * live DASH streams (black screen, frozen main thread). This module avoids EME
 * entirely: every init/media segment is intercepted through a Shaka response
 * filter, decrypted with WebCrypto AES-128-CTR ('cenc' scheme), and rewritten
 * as clear fMP4 (encv/enca -> original format, sinf/pssh/senc neutralised)
 * before it reaches Media Source Extensions.
 */
(function () {
  "use strict";

  const CONTAINERS = new Set(["moov", "trak", "mdia", "minf", "stbl", "moof", "traf", "mvex", "edts", "dinf"]);

  function u32(d, o) { return ((d[o] << 24) >>> 0) + (d[o + 1] << 16) + (d[o + 2] << 8) + d[o + 3]; }
  function type(d, o) { return String.fromCharCode(d[o + 4], d[o + 5], d[o + 6], d[o + 7]); }
  function setType(d, o, t) { for (let i = 0; i < 4; i++) d[o + 4 + i] = t.charCodeAt(i); }

  function boxSize(d, o, end) {
    let sz = u32(d, o), hdr = 8;
    if (sz === 1) { sz = u32(d, o + 8) * 4294967296 + u32(d, o + 12); hdr = 16; }
    else if (sz === 0) sz = end - o;
    return { sz, hdr };
  }

  function hexToBytes(hex) {
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
  }

  // --- Init segment: convert encrypted sample entries to clear ---
  function clearInitSegment(d) {
    let changed = false;
    function walk(off, end) {
      while (off + 8 <= end) {
        const { sz, hdr } = boxSize(d, off, end);
        if (sz < 8 || off + sz > end) return;
        const t = type(d, off);
        if (t === "pssh") { setType(d, off, "free"); changed = true; }
        else if (CONTAINERS.has(t)) walk(off + hdr, off + sz);
        else if (t === "stsd") walk(off + hdr + 8, off + sz);
        else if (t === "encv" || t === "enca") {
          const childStart = off + 8 + (t === "encv" ? 78 : 28);
          let c = childStart, original = null;
          while (c + 8 <= off + sz) {
            const cb = boxSize(d, c, off + sz);
            if (cb.sz < 8) break;
            if (type(d, c) === "sinf") {
              // find frma inside sinf -> original format
              let s = c + 8;
              while (s + 8 <= c + cb.sz) {
                const sb = boxSize(d, s, c + cb.sz);
                if (sb.sz < 8) break;
                if (type(d, s) === "frma") original = String.fromCharCode(d[s + 8], d[s + 9], d[s + 10], d[s + 11]);
                s += sb.sz;
              }
              setType(d, c, "free");
            }
            c += cb.sz;
          }
          setType(d, off, original || (t === "encv" ? "avc1" : "mp4a"));
          changed = true;
        }
        off += sz;
      }
    }
    walk(0, d.length);
    return changed;
  }

  // --- Media segment: decrypt every moof/mdat pair ---
  async function decryptMediaSegment(d, cryptoKey, ivSize) {
    const jobs = [];
    let off = 0;
    while (off + 8 <= d.length) {
      const { sz } = boxSize(d, off, d.length);
      if (sz < 8 || off + sz > d.length) break;
      if (type(d, off) === "moof") jobs.push(...parseMoof(d, off, sz, ivSize));
      if (type(d, off) === "pssh") setType(d, off, "free");
      off += sz;
    }
    if (!jobs.length) return false;

    await Promise.all(jobs.map(async job => {
      // Gather encrypted byte ranges of a sample into one contiguous buffer (CTR counter continues across subsamples)
      let total = 0;
      for (const r of job.ranges) total += r[1];
      if (!total) return;
      const buf = new Uint8Array(total);
      let p = 0;
      for (const [s, n] of job.ranges) { buf.set(d.subarray(s, s + n), p); p += n; }
      const counter = new Uint8Array(16);
      counter.set(job.iv.subarray(0, Math.min(16, job.iv.length)));
      const plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-CTR", counter, length: 64 }, cryptoKey, buf));
      p = 0;
      for (const [s, n] of job.ranges) { d.set(plain.subarray(p, p + n), s); p += n; }
    }));
    return true;
  }

  function parseMoof(d, moofStart, moofSize, defaultIvSize) {
    const jobs = [];
    const moofEnd = moofStart + moofSize;
    let off = moofStart + 8;
    while (off + 8 <= moofEnd) {
      const { sz } = boxSize(d, off, moofEnd);
      if (sz < 8) break;
      const t = type(d, off);
      if (t === "pssh") setType(d, off, "free");
      if (t === "traf") jobs.push(...parseTraf(d, off, sz, moofStart, defaultIvSize));
      off += sz;
    }
    return jobs;
  }

  function parseTraf(d, trafStart, trafSize, moofStart, ivSize) {
    const end = trafStart + trafSize;
    let baseOffset = moofStart, defaultSampleSize = 0;
    const runs = [];
    let senc = null;
    let off = trafStart + 8;
    while (off + 8 <= end) {
      const { sz } = boxSize(d, off, end);
      if (sz < 8) break;
      const t = type(d, off);
      if (t === "tfhd") {
        const flags = u32(d, off + 8) & 0xffffff;
        let p = off + 16; // after version/flags + track_ID
        if (flags & 0x1) { baseOffset = u32(d, p) * 4294967296 + u32(d, p + 4); p += 8; }
        if (flags & 0x2) p += 4;
        if (flags & 0x8) p += 4;
        if (flags & 0x10) { defaultSampleSize = u32(d, p); p += 4; }
      } else if (t === "trun") {
        const flags = u32(d, off + 8) & 0xffffff;
        const count = u32(d, off + 12);
        let p = off + 16, dataOffset = 0;
        if (flags & 0x1) { dataOffset = u32(d, p) | 0; p += 4; }
        if (flags & 0x4) p += 4;
        const sizes = new Array(count);
        for (let i = 0; i < count; i++) {
          if (flags & 0x100) p += 4;
          if (flags & 0x200) { sizes[i] = u32(d, p); p += 4; } else sizes[i] = defaultSampleSize;
          if (flags & 0x400) p += 4;
          if (flags & 0x800) p += 4;
        }
        runs.push({ dataOffset, sizes });
      } else if (t === "senc") {
        senc = off;
      } else if (t === "saiz" || t === "saio") {
        setType(d, off, "free");
      } else if ((t === "sbgp" || t === "sgpd") && type(d, off + 8) === "seig") {
        // grouping_type sits right after the full-box header
        setType(d, off, "free");
      }
      off += sz;
    }
    if (senc === null) return [];

    // Parse senc
    const sFlags = u32(d, senc + 8) & 0xffffff;
    const sCount = u32(d, senc + 12);
    let p = senc + 16;
    const entries = [];
    for (let i = 0; i < sCount; i++) {
      const iv = d.slice(p, p + ivSize); p += ivSize;
      let subs = null;
      if (sFlags & 0x2) {
        const n = (d[p] << 8) | d[p + 1]; p += 2;
        subs = [];
        for (let k = 0; k < n; k++) { subs.push([(d[p] << 8) | d[p + 1], u32(d, p + 2)]); p += 6; }
      }
      entries.push({ iv, subs });
    }
    setType(d, senc, "free"); // hide encryption info from the clear pipeline

    const jobs = [];
    let idx = 0;
    for (const run of runs) {
      let pos = baseOffset + run.dataOffset;
      for (const size of run.sizes) {
        const e = entries[idx++];
        if (e) {
          const ranges = [];
          if (e.subs) {
            let q = pos;
            for (const [clear, enc] of e.subs) { q += clear; if (enc) ranges.push([q, enc]); q += enc; }
          } else {
            ranges.push([pos, size]);
          }
          if (ranges.length) jobs.push({ iv: e.iv, ranges });
        }
        pos += size;
      }
    }
    return jobs;
  }

  /**
   * Install the decryptor on a Shaka player. Returns true when installed.
   * clearKeys: { kidHex: keyHex }
   */
  async function installSoftwareClearKey(player, clearKeys) {
    const keyHex = Object.values(clearKeys || {})[0];
    if (!keyHex || !window.crypto || !crypto.subtle) return false;
    const cryptoKey = await crypto.subtle.importKey("raw", hexToBytes(keyHex), { name: "AES-CTR" }, false, ["decrypt"]);
    const ivSize = 8;
    const SEGMENT = shaka.net.NetworkingEngine.RequestType.SEGMENT;
    const MANIFEST = shaka.net.NetworkingEngine.RequestType.MANIFEST;

    player.getNetworkingEngine().registerResponseFilter(async (reqType, response) => {
      if (!response.data) return;
      if (reqType === MANIFEST) {
        // Strip ContentProtection so Shaka treats the stream as clear and never touches EME
        try {
          const text = new TextDecoder("utf-8").decode(response.data);
          if (text.indexOf("ContentProtection") !== -1) {
            const stripped = text
              .replace(/<ContentProtection\b[^>]*\/>/g, "")
              .replace(/<ContentProtection\b[\s\S]*?<\/ContentProtection>/g, "");
            response.data = new TextEncoder().encode(stripped).buffer;
          }
        } catch (e) {
          console.warn("[SoftCENC] manifest rewrite failed:", e);
        }
        return;
      }
      if (reqType !== SEGMENT) return;
      const d = new Uint8Array(response.data.slice ? response.data.slice(0) : response.data);
      try {
        // Init segment has moov; media segment has moof
        let hasMoov = false, off = 0;
        while (off + 8 <= d.length) {
          const { sz } = boxSize(d, off, d.length);
          if (sz < 8) break;
          if (type(d, off) === "moov") { hasMoov = true; break; }
          off += sz;
        }
        if (hasMoov) clearInitSegment(d);
        else await decryptMediaSegment(d, cryptoKey, ivSize);
        response.data = d.buffer;
      } catch (e) {
        console.warn("[SoftCENC] segment processing failed:", e);
      }
    });

    // No EME: the manifest filter above removes all DRM signalling
    player.configure({
      manifest: {
        ignoreDrmInfo: true
      },
      drm: {
        clearKeys: {},
        servers: {}
      }
    });
    return true;
  }

  window.LiveTVSoftCENC = { installSoftwareClearKey, clearInitSegment, decryptMediaSegment };
})();
