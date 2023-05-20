import {
  request as httpRequest,
  type OutgoingHttpHeaders,
  type IncomingHttpHeaders,
} from "node:http";
import { request as httpsRequest } from "node:https";
import { type URL } from "node:url";
import { type Readable } from "node:stream";

function getRequestFn({ isSecure }: { isSecure: boolean }) {
  return isSecure ? httpsRequest : httpRequest;
}

type PayloadResult = {
  data?: string;
  error?: {
    message: string;
    statusCode?: number;
  };
};

export function request({
  url,
  headers,
}: {
  url: URL;
  headers?: OutgoingHttpHeaders;
}) {
  return new Promise<PayloadResult>((resolve) => {
    const isSecure = url.protocol === "https:";
    const requestFn = getRequestFn({ isSecure });

    requestFn(
      url,
      {
        method: "GET",
        headers: {
          ...headers,
          // TODO: Add compression support
          // "accept-encoding": "identity, gzip, deflate, br",
        },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          resolve({
            error: {
              message:
                "GET Request to " +
                url.toString() +
                " has failed with status code " +
                res.statusCode,
              statusCode: res.statusCode,
            },
          });
          return;
        }

        res.setEncoding("utf8");
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res.on("end", () => {
          resolve({ data: rawData });
        });
      }
    )
      .on("error", (err) => {
        console.error({ err });
        resolve({ error: { message: err.message } });
      })
      .end();
  });
}

type StreamResult = {
  stream?: Readable;
  error?: {
    message: string;
    statusCode?: number;
  };
};

export function requestStream({
  url,
  headers,
}: {
  url: URL;
  headers?: OutgoingHttpHeaders;
}) {
  return new Promise<StreamResult>((resolve) => {
    const isSecure = url.protocol === "https:";
    const requestFn = getRequestFn({ isSecure });

    requestFn(url, { method: "GET", headers }, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        resolve({
          error: {
            message:
              "GET Request to " +
              url.toString() +
              " has failed with status code " +
              res.statusCode,
            statusCode: res.statusCode,
          },
        });
        return;
      }

      resolve({ stream: res });
    })
      .on("error", (err) => {
        resolve({ error: { message: err.message } });
      })
      .end();
  });
}

type MetadataResult = {
  data?: {
    headers: Record<string, string[] | undefined>;
    statusCode: number;
  };
  error?: {
    message: string;
    statusCode?: number;
  };
};
export function getContentType({
  url,
  headers,
}: {
  url: URL;
  headers?: OutgoingHttpHeaders;
}) {
  return new Promise<MetadataResult>((resolve) => {
    const isSecure = url.protocol === "https:";
    const requestFn = getRequestFn({ isSecure });

    requestFn(
      url,
      {
        method: "HEAD",
        headers: {
          ...headers,
          // TODO: Add compression support
          // "accept-encoding": "identity, gzip, deflate, br",
        },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          resolve({
            error: {
              message:
                "GET Request to " +
                url.toString() +
                " has failed with status code " +
                res.statusCode,
              statusCode: res.statusCode,
            },
          });
          return;
        }

        res.setEncoding("utf8");
        res.on("data", () => {
          if (res.headersDistinct) {
            resolve({
              data: {
                statusCode: res.statusCode!,
                headers: res.headersDistinct!,
              },
            });
            res.destroy();
            return;
          }
        });
        res.on("end", () => {
          if (res.headersDistinct) {
            resolve({
              data: {
                statusCode: res.statusCode!,
                headers: res.headersDistinct!,
              },
            });
            return;
          }
          resolve({ error: { message: "The stream has ended" } });
        });
      }
    )
      .on("error", (err) => {
        console.error({ err });
        resolve({ error: { message: err.message } });
      })
      .end();
  });
}
