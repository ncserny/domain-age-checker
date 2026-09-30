const tool = {
  name: "check_domain_age", title: "Check domain age",
  description: "Look up a domain's registration date, expiration date, age, and days until expiry using dac.nader.io. Accepts a domain or URL. Registration age alone does not establish legitimacy or safety. Report missing registry data as unavailable. The upstream API may impose a daily rate limit.",
  inputSchema: {
    type: "object", properties: { domain: { type: "string", minLength: 1, maxLength: 2048, description: "A domain name or URL, e.g. example.com or https://example.com/path." } },
    required: ["domain"], additionalProperties: false,
  },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
};
const versions = ["2025-06-18", "2025-03-26", "2024-11-05"];
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const rpcError = (id, code, message) => json({ jsonrpc: "2.0", id, error: { code, message } });
const toolError = (message) => ({ isError: true, content: [{ type: "text", text: message }] });

export function normalizeDomain(input) {
  if (typeof input !== "string" || !input.trim() || input.length > 2048) throw new Error("Enter a domain name or URL.");
  const value = input.trim();
  const url = new URL(value.includes("://") ? value : `https://${value}`);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Enter a public domain name or an HTTP(S) URL without credentials.");
  const domain = url.hostname.toLowerCase().replace(/\.$/, "");
  const labels = domain.split(".");
  if (domain.length > 253 || labels.length < 2 || labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) || !/[a-z]/.test(labels.at(-1))) throw new Error("Enter a valid domain name, such as example.com. IP addresses are not supported.");
  return domain;
}

export async function checkDomain(args, fetcher = fetch) {
  let domain;
  try {
    if (!args || Object.keys(args).some(key => key !== "domain")) throw new Error("Provide only the domain argument.");
    domain = normalizeDomain(args.domain);
  } catch (error) { return toolError(error.message); }
  try {
    const endpoint = new URL("https://api-dac.nader.io");
    endpoint.searchParams.set("domain", domain);
    const response = await fetcher(endpoint, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(20000), redirect: "error" });
    if (response.status === 404) return toolError(`No registration data is available for ${domain}. This does not prove the domain is unregistered.`);
    if (response.status === 429) return toolError("Domain Age Check's upstream rate limit was reached. Try again later.");
    if (!response.ok) return toolError(`Domain Age Check is unavailable (HTTP ${response.status}). Try again later.`);
    const data = await response.json();
    const field = (value) => typeof value === "string" && value.length <= 200 && value.trim() && !/^(n\/?a|unknown|null)$/i.test(value.trim()) ? value : null;
    const result = { domain, created: field(data.created), expires: field(data.expires), age: field(data.age), daysLeft: Number.isFinite(data.daysLeft) ? data.daysLeft : null, checkedAt: new Date().toISOString(), source: "https://dac.nader.io/" };
    if (!result.created && !result.expires && !result.age && result.daysLeft === null) return toolError(`No usable registration data is available for ${domain}.`);
    return { content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: result };
  } catch { return toolError("Domain Age Check could not be reached or returned an invalid response. Try again later."); }
}

const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Domain Age Check for ChatGPT</title><style>:root{font-family:system-ui,sans-serif;color:#f5f7fa;background:#101820}body{margin:0}main{max-width:44rem;margin:10vh auto;padding:2rem}h1{font-size:clamp(2rem,6vw,3.5rem);letter-spacing:-.04em}p{font-size:1.1rem;line-height:1.7;color:#c6d1dc}a{color:#8de5c5}blockquote{margin:2rem 0;padding:1rem 1.5rem;border-left:3px solid #8de5c5;background:#182633}</style></head><body><main><h1>Domain Age Check</h1><p>Ask ChatGPT when a domain was registered, how old it is, and when it expires.</p><blockquote>How old is example.com, and when does it expire?</blockquote><p>Install or connect the Domain Age Check plugin in ChatGPT, then ask about a domain or paste a website URL. The plugin uses the same public lookup service as <a href="https://dac.nader.io/">dac.nader.io</a>.</p><p>Results include registration date, expiration date, age, days remaining, and the lookup time. Registry coverage varies, and the service may limit requests.</p><p>A domain's age alone does not establish whether a website is safe or trustworthy.</p><p>Only the domain name is sent to the lookup service. URL paths, query strings, and fragments are removed.</p></main></body></html>`;

export default {
  async fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === "/" && ["GET", "HEAD"].includes(request.method)) return new Response(request.method === "HEAD" ? null : page, { headers: { "content-type": "text/html; charset=utf-8" } });
    if (path !== "/mcp") return new Response("Not found", { status: 404 });
    if (request.method !== "POST") return new Response(null, { status: 405, headers: { allow: "POST" } });
    if (!request.headers.get("content-type")?.includes("application/json")) return new Response("Expected application/json", { status: 415 });
    const protocol = request.headers.get("mcp-protocol-version");
    if (protocol && !versions.includes(protocol)) return json({ error: "Unsupported MCP protocol version" }, 400);
    let message;
    try {
      const body = await request.text();
      if (body.length > 16384) return new Response("Request too large", { status: 413 });
      message = JSON.parse(body);
    } catch { return rpcError(null, -32700, "Invalid JSON"); }
    if (!message || Array.isArray(message) || message.jsonrpc !== "2.0" || typeof message.method !== "string" || (message.id !== undefined && typeof message.id !== "string" && typeof message.id !== "number")) return rpcError(null, -32600, "Invalid JSON-RPC request");
    if (message.id === undefined) return new Response(null, { status: 202 });
    let result;
    switch (message.method) {
      case "initialize": result = { protocolVersion: versions.includes(message.params?.protocolVersion) ? message.params.protocolVersion : versions[0], capabilities: { tools: { listChanged: false } }, serverInfo: { name: "domain-age-check", version: "1.0.0" }, instructions: "Use check_domain_age for domain registration and expiry lookups. Report unavailable fields honestly. Domain age is not a trust or safety score." }; break;
      case "ping": result = {}; break;
      case "tools/list": result = { tools: [tool] }; break;
      case "tools/call":
        // Sites authenticates visitors and supplies this trusted header.
        if (!request.headers.get("oai-authenticated-user-id")) return json({ error: "Connect the Domain Age Check plugin to perform lookups." }, 401);
        result = message.params?.name === tool.name ? await checkDomain(message.params.arguments) : toolError("Unknown tool."); break;
      default: return rpcError(message.id, -32601, "Method not found");
    }
    return json({ jsonrpc: "2.0", id: message.id, result });
  },
};
