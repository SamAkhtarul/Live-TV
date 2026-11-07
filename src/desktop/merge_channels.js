#!/usr/bin/env node

/**
 * Extracts and merges all 112 curated primary channels from SampleChannels.kt
 * and 2,879 catalog channels from channels_catalog.m3u into channels.json and channels_data.js.
 * Exactly matches Android LiveTvViewModel channel precedence.
 */

const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "../..");
const sampleChannelsPath = path.join(rootDir, "src/app/src/main/java/com/example/livetv/data/SampleChannels.kt");
const catalogPath = path.join(rootDir, "src/app/src/main/assets/channels_catalog.m3u");
const outJsonPath = path.join(__dirname, "web/channels.json");
const outJsPath = path.join(__dirname, "web/js/channels_data.js");

// 1. Parse SampleChannels.kt
const ktContent = fs.readFileSync(sampleChannelsPath, "utf8");
const channelRegex = /Channel\s*\(\s*id\s*=\s*"([^"]+)"[\s\S]*?name\s*=\s*"([^"]+)"[\s\S]*?streamUrl\s*=\s*"([^"]+)"[\s\S]*?logoUrl\s*=\s*"([^"]*)"[\s\S]*?category\s*=\s*"([^"]*)"(?:[\s\S]*?country\s*=\s*"([^"]*)")?/g;

const sampleChannels = [];
const seenUrls = new Set();
const seenIds = new Set();

let match;
while ((match = channelRegex.exec(ktContent)) !== null) {
  const [_, id, name, streamUrl, logoUrl, category, country] = match;
  const ch = {
    id: id.trim(),
    name: name.trim(),
    streamUrl: streamUrl.trim(),
    logoUrl: (logoUrl || "").trim(),
    category: (category || "Other").trim(),
    country: (country || "International").trim()
  };
  sampleChannels.push(ch);
  seenUrls.add(ch.streamUrl);
  seenIds.add(ch.id);
}

// 2. Parse channels_catalog.m3u
const m3uContent = fs.readFileSync(catalogPath, "utf8");
const lines = m3uContent.split("\n");
const catalogChannels = [];

let curName = "";
let curLogo = "";
let curGroup = "Other";
let curCountry = "";

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.startsWith("#EXTINF:")) {
    const commaIdx = line.indexOf(",");
    if (commaIdx !== -1) curName = line.substring(commaIdx + 1).trim();
    const logoMatch = line.match(/tvg-logo="([^"]+)"/);
    curLogo = logoMatch ? logoMatch[1] : "";
    const groupMatch = line.match(/group-title="([^"]+)"/);
    curGroup = groupMatch ? groupMatch[1] : "Other";
    const countryMatch = line.match(/tvg-country="([^"]+)"/);
    curCountry = countryMatch ? countryMatch[1] : "";
  } else if (line.startsWith("http://") || line.startsWith("https://")) {
    const streamUrl = line.trim();
    if (!seenUrls.has(streamUrl)) {
      seenUrls.add(streamUrl);
      const safeId = curName.toLowerCase().replace(/[^a-z0-9]+/g, "_") + "_" + catalogChannels.length;
      catalogChannels.push({
        id: safeId,
        name: curName || "Channel",
        streamUrl: streamUrl,
        logoUrl: curLogo,
        category: curGroup,
        country: curCountry || "Global"
      });
    }
    curName = "";
    curLogo = "";
    curGroup = "Other";
    curCountry = "";
  }
}

const finalChannels = sampleChannels.concat(catalogChannels);
console.log(`Merged ${finalChannels.length} total channels (${sampleChannels.length} SampleChannels + ${catalogChannels.length} Catalog Channels)`);

fs.writeFileSync(outJsonPath, JSON.stringify(finalChannels, null, 2));
fs.writeFileSync(outJsPath, "window.CHANNELS_DATA = " + JSON.stringify(finalChannels) + ";\n");
console.log("Successfully updated channels.json and channels_data.js!");

