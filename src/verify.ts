// ══════════════════════════════════════════════════════════════
// @nordax/hap — Credential Verification
//
// Pure verification logic — no database access, no issuance,
// no server-side secrets. Uses only the credential's own fields
// and the public status endpoint.
//
// Signature verification is not included in v0.1. The verify
// function checks expiration and real-time status. Ed25519
// signature verification will be added in v0.2 with an optional
// public key resolver callback.
// ══════════════════════════════════════════════════════════════

import type {
  HAPCredential,
  HAPVerifyResult,
  HAPVerifyOptions,
  HAPStatusResponse,
} from "./types.js";
import { parseHAPCredential, isExpired } from "./parse.js";

/**
 * Verify an HAP authorization credential.
 *
 * Performs two checks:
 * 1. **Expiration** — compares `expirationDate` against the current UTC time.
 *    The expiration date is authoritative per the HAP spec.
 * 2. **Real-time status** — fetches the `credentialStatus.id` endpoint to
 *    confirm the credential has not been revoked or suspended.
 *
 * @param credential - The HAP credential object (or raw JSON to be parsed)
 * @param options - Optional configuration for status checking and fetch
 * @returns A verification result with validity, status, and any errors
 *
 * @example
 * ```ts
 * import { verifyHAPCredential } from "@nordax/hap";
 *
 * const result = await verifyHAPCredential(credential);
 * if (result.valid) {
 *   console.log("Agent is authorized:", result.credential?.credentialSubject.agent_id);
 * } else {
 *   console.log("Verification failed:", result.status, result.errors);
 * }
 * ```
 */
export async function verifyHAPCredential(
  credential: HAPCredential | Record<string, unknown>,
  options: HAPVerifyOptions = {}
): Promise<HAPVerifyResult> {
  const {
    checkStatus = true,
    fetch: fetchFn = globalThis.fetch,
    statusTimeoutMs = 5000,
  } = options;

  const errors: string[] = [];
  const now = new Date().toISOString();

  // Step 0: Parse and validate structure
  let parsed: HAPCredential;
  try {
    parsed = parseHAPCredential(credential);
  } catch (err) {
    return {
      valid: false,
      status: "invalid_signature",
      verifiedAt: now,
      errors: [err instanceof Error ? err.message : "Invalid credential structure"],
    };
  }

  const authId = parsed.id;

  // Step 1: Check expiration (authoritative per spec)
  if (isExpired(parsed)) {
    return {
      valid: false,
      status: "expired",
      credential: parsed,
      authId,
      verifiedAt: now,
      errors: ["Credential has expired"],
    };
  }

  // Step 2: Check proof exists
  if (!parsed.proof?.proofValue) {
    errors.push("Missing proof or proofValue — signature verification skipped");
  }

  // Note: Ed25519 signature verification is planned for v0.2.
  // In v0.1 we rely on the status endpoint + expiration check.

  // Step 3: Real-time status check
  if (checkStatus) {
    const statusUrl = parsed.credentialStatus?.id;
    if (!statusUrl) {
      return {
        valid: false,
        status: "invalid_signature",
        credential: parsed,
        authId,
        verifiedAt: now,
        errors: ["Credential is missing credentialStatus.id endpoint"],
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), statusTimeoutMs);

      const response = await fetchFn(statusUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        if (response.status === 404) {
          return {
            valid: false,
            status: "not_found",
            credential: parsed,
            authId,
            verifiedAt: now,
            errors: [`Status endpoint returned 404 for ${authId}`],
          };
        }
        errors.push(`Status endpoint returned HTTP ${response.status}`);
      } else {
        const statusData = (await response.json()) as HAPStatusResponse;

        if (statusData.status !== "active") {
          return {
            valid: false,
            status: statusData.status,
            credential: parsed,
            authId,
            verifiedAt: now,
            errors: [
              `Credential status is "${statusData.status}"${
                statusData.revocationReason
                  ? `: ${statusData.revocationReason}`
                  : ""
              }`,
            ],
          };
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Status check failed";
      errors.push(`Status endpoint unreachable: ${message}`);
      // Per spec, relying parties SHOULD treat unreachable status endpoints
      // as a soft failure — we continue but include the error
    }
  }

  return {
    valid: true,
    status: "active",
    credential: parsed,
    authId,
    verifiedAt: now,
    errors: errors.length > 0 ? errors : undefined,
  };
}
