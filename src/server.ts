import express from "express";
import { requestHandler } from "./index.js";
import { atob, btoa } from "./utils.js";
const app = express();

const port = 8080;

app.get(
  "/proxy/*",
  requestHandler({
    decoder: (url) => {
      const encodedMediaRequest = url.pathname.substring(7);
      const decodedMediaRequest = atob(encodedMediaRequest);
      const mediaRequestPayload: { url: string; headers: any } =
        JSON.parse(decodedMediaRequest);
      return {
        url: new URL(mediaRequestPayload.url),
        headers: mediaRequestPayload.headers,
      };
    },
    encoder: (mediaFile) => {
      const encodedMediaRequest = btoa(JSON.stringify(mediaFile));
      return new URL("http://localhost:8080/proxy/" + encodedMediaRequest);
    },
    defaultHeaders: {
      "User-Agent":
        "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/112.0",
    },
  })
);
app.use("/", express.static("./public"));
app.listen(port, function () {
  console.log(`Express.js HTTP server is listening on port: ${port}`);
});
