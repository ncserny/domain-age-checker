# Domain Age Check plugin

A Sites-hosted ChatGPT plugin exposing the read-only `check_domain_age` MCP tool. It uses `https://api-dac.nader.io?domain=...`, the API behind https://dac.nader.io/.

The tool accepts a domain or an HTTP(S) URL and returns registration date, expiration date, age, days until expiry, lookup time, and source. It removes URL paths and queries before contacting the API. Missing dates remain unavailable; domain age is not a safety or legitimacy score. Upstream rate limits still apply; users of this hosted plugin may share the upstream service's quota.

## Install

In the owner's ChatGPT or Codex account, open Plugins → Personal → Created by you, find **Domain Age Check**, and choose Install or Connect. Sites provisions the plugin and manages OAuth. Public Site access does not by itself establish public plugin-directory distribution; use the plugin's available sharing controls for other users.

Ask: “How old is example.com, and when does it expire?”

## Development

Requires Node.js 20 or newer. No dependencies or API keys are required.

```sh
npm test
npm run build
npm run validate
```

Edit `worker/index.js`. Build output is `dist/server/index.js` plus `dist/.openai/hosting.json`. Deploy through the Sites hosting workflow, with the manifest's `mcp` capability. `POST /mcp` supports initialization, tool discovery, read-only tool calls, and ping over stateless Streamable HTTP JSON responses. Discovery is public; lookups require the trusted Sites authenticated-user header. Do not expose this Worker directly outside the Sites authentication boundary without adding authentication.

Sites maintains the hosting source repository. This directory is also mirrored to the domain-age-checker GitHub repository for review and reuse. To create another Site, remove the existing `project_id` from the manifest and register the new Site; never reuse the owner's identity for a new deployment.
