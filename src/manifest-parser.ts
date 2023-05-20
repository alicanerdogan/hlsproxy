import { URL } from "node:url";

// https://datatracker.ietf.org/doc/html/rfc8216
// https://developer.apple.com/documentation/http_live_streaming/enabling_low-latency_http_live_streaming_hls
const TAGS_WITH_URI = [
  "#EXT-X-KEY",
  "#EXT-X-MAP",
  "#EXT-X-MEDIA",
  "#EXT-X-I-FRAME-STREAM-INF",
  "#EXT-X-SESSION-DATA",
  "#EXT-X-PART",
  "#EXT-X-PRELOAD-HINT",
  "#EXT-X-RENDITION-REPORT",
] as const;

function isTagLine(line: string) {
  return line.startsWith("#EXT");
}

function isTagLineWithURI(line: string) {
  return TAGS_WITH_URI.some((tag) => line.startsWith(tag));
}

function isCommentLine(line: string) {
  return !isTagLine(line) && line.startsWith("#");
}

function isMediaOrPlaylistLine(line: string) {
  return !!(line && !line.startsWith("#"));
}

function updateURIAttribute(
  tagLine: string,
  replaceFn: (oldUri: string) => string
): string {
  // TODO: Fix parsing and make it stabler
  const uriTag = 'URI="';
  const uriAttrIndex = tagLine.indexOf(uriTag);
  if (uriAttrIndex < 0) {
    return tagLine;
  }

  const closeMarkIndex = tagLine.indexOf('"', uriAttrIndex + uriTag.length + 1);
  if (uriAttrIndex < 0) {
    console.warn("Invalid tagline: " + tagLine);
    return tagLine;
  }

  const uri = tagLine.substring(uriAttrIndex + uriTag.length, closeMarkIndex);
  const newUri = replaceFn(uri);
  const firstPart = tagLine.substring(0, uriAttrIndex + uriTag.length);
  const lastPart = tagLine.substring(closeMarkIndex);
  return firstPart + newUri + lastPart;
}

export function modifyManifest({
  manifest,
  manifestUrl,
  encoder,
}: {
  manifest: string;
  manifestUrl: URL;
  encoder: (mediaURL: URL) => URL;
}): string {
  const lines = manifest.split("\n");
  const modifiedLines: string[] = [];
  const replaceFn = (uri: string) => {
    return encoder(new URL(uri, manifestUrl)).href;
  };

  for (const line of lines) {
    if (isMediaOrPlaylistLine(line)) {
      const url = encoder(new URL(line, manifestUrl)).href;
      modifiedLines.push(url);
    } else if (isTagLineWithURI(line)) {
      modifiedLines.push(updateURIAttribute(line, replaceFn));
    } else {
      modifiedLines.push(line);
    }
  }

  return modifiedLines.join("\n");
}
