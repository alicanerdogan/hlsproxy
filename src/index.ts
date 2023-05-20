import { OutgoingHttpHeaders } from "node:http";
import { URL } from "node:url";
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import { modifyManifest } from "./manifest-parser.js";
import {
  getContentType,
  request as requestNative,
  requestStream,
} from "./connection.js";

export function setCORSHeaders(res: ExpressResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400");
}

export type MediaFileRequest = {
  url: URL;
  headers?: OutgoingHttpHeaders;
};

export type DecodeMediaFileRequestFn = (requestURL: URL) => MediaFileRequest;
export type EncodeMediaFileRequestFn = (
  encodedRequest: MediaFileRequest
) => URL;

export type ResponseHandlerParameters = {
  decoder: DecodeMediaFileRequestFn;
  encoder: EncodeMediaFileRequestFn;
  defaultHeaders?: OutgoingHttpHeaders;
};

function isManifestFile(contentType: string | undefined) {
  return [
    "application/vnd.apple.mpegurl",
    "application/x-mpegurl",
    "audio/mpegurl",
    "audio/x-mpegurl",
  ].includes(contentType?.toLowerCase() ?? "");
}

export type MediaType = "m3u8" | "ts" | "key";

export function requestHandler({
  decoder,
  encoder,
  defaultHeaders,
}: ResponseHandlerParameters) {
  return async (request: ExpressRequest, response: ExpressResponse) => {
    try {
      const mediaFileRequest = decoder(
        new URL(request.protocol + "://" + request.hostname + request.url)
      );

      const metadata = await getContentType(mediaFileRequest);
      if (!metadata.data || metadata.error) {
        throw new Error(
          metadata.error?.message ??
            "Metadata cannot be read for " + mediaFileRequest.url.href
        );
      }

      const contentType = metadata.data.headers["content-type"]?.at(0);
      response.setHeader("content-type", contentType || "");
      setCORSHeaders(response);

      if (isManifestFile(contentType)) {
        const { data, error } = await requestNative({
          url: mediaFileRequest.url,
          headers: mediaFileRequest.headers,
        });

        if (error || !data) {
          console.error({ error });
          response.writeHead(500);
          response.end();
          return;
        }

        const modifiedManifest = modifyManifest({
          manifest: data,
          manifestUrl: mediaFileRequest.url,
          encoder: (url: URL) =>
            encoder({ url, headers: mediaFileRequest.headers }),
        });

        // TODO: support redirects
        response.writeHead(200, { "Content-Type": "application/x-mpegURL" });
        response.end(modifiedManifest);
        return;
      }

      const clientHeaders: OutgoingHttpHeaders = {};
      const range = request.headers.range;
      if (range) {
        clientHeaders["range"] = range;
      }
      const ifRange = request.headers["if-range"];
      if (ifRange) {
        clientHeaders["if-range"] = ifRange;
      }

      const { stream, error } = await requestStream({
        url: mediaFileRequest.url,
        headers: { ...mediaFileRequest.headers, ...clientHeaders },
      });

      if (error || !stream) {
        console.error({ error });
        response.writeHead(500);
        response.end();
        return;
      }

      stream.pipe(response);
    } catch (error) {
      console.error({ error });
      response.writeHead(500);
      response.end();
      return;
    }
  };
}
