import { it, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { modifyManifest } from "./manifest-parser.js";
import { btoa } from "./utils.js";

type ManifestRequest = {
  slug: string;
  url: string;
  headers?: Record<string, string>;
};
const sources: ManifestRequest[] = [
  {
    slug: "tears_of_steel",
    url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
  },
  {
    slug: "fMP4",
    url: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8",
  },
  {
    slug: "MP4",
    url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8",
  },
  {
    slug: "live_akamai",
    url: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8",
  },
  {
    slug: "live_akamai_2",
    url: "https://moctobpltc-i.akamaihd.net/hls/live/571329/eight/playlist.m3u8",
  },
  {
    slug: "skip_armstrong_stereo",
    url: "https://d3rlna7iyyu8wu.cloudfront.net/skip_armstrong/skip_armstrong_stereo_subs.m3u8",
  },
  {
    slug: "skip_armstrong_multichannel",
    url: "https://d3rlna7iyyu8wu.cloudfront.net/skip_armstrong/skip_armstrong_multichannel_subs.m3u8",
  },
  {
    slug: "azure_hlsv4",
    url: "http://amssamples.streaming.mediaservices.windows.net/91492735-c523-432b-ba01-faba6c2206a2/AzureMediaServicesPromo.ism/manifest(format=m3u8-aapl)",
  },
  {
    slug: "azure_hlsv4_2",
    url: "http://amssamples.streaming.mediaservices.windows.net/69fbaeba-8e92-4740-aedc-ce09ae945073/AzurePromo.ism/manifest(format=m3u8-aapl)",
  },
  {
    slug: "azure_4k_hlsv4",
    url: "http://amssamples.streaming.mediaservices.windows.net/634cd01c-6822-4630-8444-8dd6279f94c6/CaminandesLlamaDrama4K.ism/manifest(format=m3u8-aapl)",
  },
  {
    slug: "skip_armstrong_multi_language",
    url: "https://d3rlna7iyyu8wu.cloudfront.net/skip_armstrong/skip_armstrong_multi_language_subs.m3u8",
  },
  {
    slug: "tennis_tv",
    url: "https://ed-t1.edghst.me/plyvivo/ze6ag0narapagu202afe/chunklist.m3u8",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/113.0",
      Referer: "https://www.nolive.me/",
    },
  },
];

declare global {
  export const fetch: any;
}

function getManifestFilepath(manifestReq: ManifestRequest) {
  return join("./src", "./tests/", manifestReq.slug + ".m3u8");
}

function getModifiedManifestFilepath(manifestReq: ManifestRequest) {
  return join("./src", "./tests/", manifestReq.slug + ".modified.m3u8");
}

async function downloadManifest(manifestReq: ManifestRequest) {
  const res = await fetch(manifestReq.url, { headers: manifestReq.headers });
  const body = await res.text();
  writeFileSync(getManifestFilepath(manifestReq), body);
}

async function downloadAllManifestFiles() {
  return await Promise.all(sources.map((src) => downloadManifest(src)));
}

const shouldUpdate = false;

describe("modify_m3u8_content", {}, () => {
  it("static file manifest", async () => {
    for (const manifestReq of sources) {
      const content = readFileSync(getManifestFilepath(manifestReq)).toString();
      const modifiedContent = modifyManifest({
        manifest: content,
        manifestUrl: new URL(manifestReq.url),
        encoder: (mediaFile) => {
          const encodedMediaRequest = btoa(JSON.stringify(mediaFile));
          return new URL("http://localhost:8080/proxy/" + encodedMediaRequest);
        },
      });

      if (shouldUpdate) {
        writeFileSync(
          getModifiedManifestFilepath(manifestReq),
          modifiedContent
        );
        continue;
      }

      const expected = readFileSync(
        getModifiedManifestFilepath(manifestReq)
      ).toString();
      assert.deepStrictEqual(modifiedContent, expected);
    }
  });
});
