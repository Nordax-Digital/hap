<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://nordax.ai/logo/nordaxai_hor_white_gold.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://nordax.ai/logo/nordaxai_hor_black_gold.svg">
  <img alt="Nordax AI" src="https://nordax.ai/logo/nordaxai_hor_black_gold.svg" width="320">
</picture>

# @nordax/hap

**Human Authorization Protocol — Verification SDK**

Parse, validate, and verify W3C VC 2.0 agent authorization credentials.

[![npm version](https://img.shields.io/npm/v/@nordax/hap?color=cb3837&label=npm)](https://www.npmjs.com/package/@nordax/hap)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](./package.json)
[![Node.js](https://img.shields.io/badge/node-%E2%89%A518-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

[Specification](https://nordax.ai/protocol/hap) · [npm](https://www.npmjs.com/package/@nordax/hap) · [Nordax AI](https://nordax.ai)

</div>

---

## Overview

`@nordax/hap` is the official verification SDK for the [Human Authorization Protocol (HAP)](https://nordax.ai/protocol/hap). It lets any application — AI agent, API gateway, or backend service — verify that an agent has been authorized by a real human before acting on their behalf.

- **Zero runtime dependencies** — pure TypeScript, Node.js built-ins only
- **ESM-only** — tree-shakeable, modern module format
- **Verification only** — no issuance logic, no secrets, no server dependencies

---

## Install

```bash
npm install @nordax/hap
```

```bash
pnpm add @nordax/hap
```

```bash
yarn add @nordax/hap
```

---

## Quick Start

### Verify a credential

```ts
import { verifyHAPCredential } from "@nordax/hap";

const result = await verifyHAPCredential(credential);

if (result.valid) {
  console.log("Agent authorized:", result.credential?.credentialSubject.agent_id);
  console.log("Actions:", result.credential?.credentialSubject.authorization_scope.actions);
} else {
  console.log("Verification failed:", result.status);
  console.log("Errors:", result.errors);
}
```

### Parse and inspect

```ts
import { parseHAPCredential, getAuthorizationScope, isExpired, isActive } from "@nordax/hap";

const credential = parseHAPCredential(jsonFromApi);

const scope = getAuthorizationScope(credential);
console.log("Permitted actions:", scope.actions);
console.log("Spending limit:", scope.spendingLimits?.maxPerTransaction);

console.log("Expired:", isExpired(credential));
console.log("Active:", isActive(credential));
```

### Offline verification

```ts
const result = await verifyHAPCredential(credential, {
  checkStatus: false, // skip the status endpoint — expiry + structure only
});
```

### Custom fetch & timeout

```ts
const result = await verifyHAPCredential(credential, {
  fetch: myCustomFetch,
  statusTimeoutMs: 3000,
});
```

---

## API Reference

### `verifyHAPCredential(credential, options?)`

Full verification pipeline:

| Step | Check | Authoritative? |
|------|-------|:--------------:|
| 1 | **Structure** — conforms to HAP credential schema | Yes |
| 2 | **Expiration** — `expirationDate` vs current UTC | Yes |
| 3 | **Status** — real-time fetch of `credentialStatus.id` endpoint | Yes |

Returns `HAPVerifyResult`:

```ts
interface HAPVerifyResult {
  valid: boolean;
  status: "active" | "expired" | "revoked" | "suspended" | "not_found" | "invalid_signature";
  credential?: HAPCredential;
  authId?: string;
  verifiedAt?: string;
  errors?: string[];
}
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `checkStatus` | `boolean` | `true` | Fetch the status endpoint for revocation check |
| `fetch` | `typeof fetch` | `globalThis.fetch` | Custom fetch implementation |
| `statusTimeoutMs` | `number` | `5000` | Timeout for the status endpoint request |

### `parseHAPCredential(input)`

Validates structural shape of an HAP credential. Throws on invalid input. No network calls.

### `getAuthorizationScope(credential)`

Extracts the `authorization_scope` from a parsed credential.

### `isExpired(credential)`

Returns `true` if the credential is past its `expirationDate`.

### `isActive(credential)`

Returns `true` if current time is between `issuanceDate` and `expirationDate`. Does **not** check revocation — use `verifyHAPCredential` for a full check.

---

## Types

All types are exported for use in your own type definitions:

```ts
import type {
  HAPCredential,        // Full W3C VC 2.0 credential structure
  HAPScope,             // Authorization scope (actions, categories, limits, regions)
  HAPVerifyResult,      // Verification result
  HAPVerifyOptions,     // Options for verifyHAPCredential
  HAPStatusResponse,    // Status endpoint response shape
  HAPStatus,            // "active" | "expired" | "revoked" | "suspended" | ...
  AgentType,            // "ai_assistant" | "api_client" | "automation" | "service_agent"
  VerificationLevel,    // "basic" | "enhanced" | "full"
} from "@nordax/hap";
```

---

## What this SDK does NOT include

This SDK is **verification only**. The following are proprietary to Nordax AI and are not included:

| Not included | Why |
|-------------|-----|
| Credential issuance | Server-side only — requires Ed25519 keys |
| Database access | No ORM or storage dependencies |
| Key management | Signing keys never leave the issuer |
| Authentication | No Clerk, no secrets, no env vars |

---

## Roadmap

| Version | Feature | Status |
|---------|---------|--------|
| **v0.1** | Structure validation, expiration check, status endpoint | ✅ Released |
| v0.2 | Ed25519 signature verification with public key resolver | Planned |
| v0.3 | Credential presentation helpers, scope matching utilities | Planned |

---

## Specification

Read the full HAP specification at **[nordax.ai/protocol/hap](https://nordax.ai/protocol/hap)**

---

## License

[Apache-2.0](./LICENSE) — Copyright 2026 [Northern Axis, LLC](https://nordax.ai)

---

<div align="center">
  <sub>Built by <a href="https://nordax.ai">Nordax AI</a> — the entity trust network for the AI era.</sub>
</div>

Copyright 2026 Northern Axis, LLC DBA Nordax Digital.
