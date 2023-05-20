# hlsproxy

hlsproxy is a Node.JS library to fetch or proxy HLS streams.
It provides the right primitives for request handlers in Express servers.

## Working principles

M3U file type is a manifest file that contains the references to other media resources.
In other words, the main manifest file unravels an interconnected set of resources, like an upside down tree.

Proxying an HLS request starts with reading the manifest file.
The next step is modifying the URI's of the referenced media resources in order to make the client use the proxy server again for all the resources.
The request handler serves any multimedia content untouched.

hlsproxy exports a request handler and expects a URL encoder and decoder.
When the manifest file is modified, the actual URI of the resource should be embedded into the proxy URL.
The encoder and decoder help the request handler to read and write this information when necessary.
Those functions are also capable of storing additional information in the URL.
For instance, it might be useful to set custom headers for authentication.
If any headers are provided to the request handler as a parameter, the headers will propagate to the proxied calls via encoded information in the URLs.

## Quick Start

## API

## Roadmap

It is planned to implement following features in the upcoming releases.

### Major

[] Generic request handler to support any type of server

### Minor

[] Adding e2e tests
[] Support for redirected URIs
[] Complete HLS manifest parsing capabilities
