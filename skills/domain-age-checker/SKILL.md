---
name: domain-age-checker
description: Look up a domain's registration date, expiration date, age, and days until expiration. Use when a user asks how old a site or domain is, when a domain was registered, when it expires, whether it looks established, or whether a URL/domain looks credible based on age.
---

# Domain Age Checker

## Description

Check any domain's registration date, expiration date, age, and days until expiration. Useful for verifying domain legitimacy, checking how established a website is, or monitoring domain expiration.

## API Endpoint

```text
GET https://api-dac.nader.io?domain={domain}
```

## Parameters

- `domain` (required): The domain name to look up (e.g. "google.com"). URLs are automatically cleaned.

## Example request

```text
GET https://api-dac.nader.io?domain=google.com
```

## Example Response

```json
{
  "domain": "google.com",
  "created": "September 15, 1997",
  "expires": "September 14, 2028",
  "age": "28 years, 5 months",
  "daysLeft": 920
}
```

## Error Codes

- `400`: Missing domain parameter
- `404`: Domain not found or no registration data available
- `429`: Rate limit exceeded (50 requests/day)

If the API returns an error, explain it plainly and ask for a different domain only when needed.

## Usage Instructions

When a user asks about a domain's age, registration date, or expiration, make a GET request to the endpoint above with the domain as a query parameter. Parse the JSON response and present the information naturally.

## Link

- Web app: https://dac.nader.io
