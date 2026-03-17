// ══════════════════════════════════════════════════════════════
// @nordax/hap — Credential Parsing & Helpers
//
// Parse, validate, and inspect HAP credentials without any
// network calls or server-side dependencies.
// ══════════════════════════════════════════════════════════════

import type { HAPCredential, HAPScope, AgentType, VerificationLevel } from "./types.js";

const REQUIRED_CONTEXT = "https://www.w3.org/ns/credentials/v2";
const HAP_CONTEXT = "https://nordax.ai/ns/hap/v1";
const HAP_CREDENTIAL_TYPE = "HAPAuthorizationCredential";
const VC_TYPE = "VerifiableCredential";

const VALID_AGENT_TYPES: AgentType[] = [
  "ai_assistant",
  "api_client",
  "automation",
  "service_agent",
];

const VALID_VERIFICATION_LEVELS: VerificationLevel[] = [
  "basic",
  "enhanced",
  "full",
];

/**
 * Parse and validate the structure of an HAP credential.
 *
 * Throws if the input is not a valid HAP credential. This function
 * validates the structural shape only — it does not verify the
 * cryptographic proof or check revocation status.
 *
 * @param input - A credential object or raw JSON value to parse
 * @returns A typed `HAPCredential`
 * @throws {Error} If the input is not a valid HAP credential
 *
 * @example
 * ```ts
 * import { parseHAPCredential } from "@nordax/hap";
 *
 * const credential = parseHAPCredential(jsonFromApi);
 * console.log(credential.credentialSubject.agent_id);
 * ```
 */
export function parseHAPCredential(
  input: HAPCredential | Record<string, unknown>
): HAPCredential {
  if (!input || typeof input !== "object") {
    throw new Error("HAP credential must be a non-null object");
  }

  const obj = input as Record<string, unknown>;

  // @context
  if (!Array.isArray(obj["@context"])) {
    throw new Error("Missing or invalid @context array");
  }
  const context = obj["@context"] as string[];
  if (!context.includes(REQUIRED_CONTEXT)) {
    throw new Error(
      `@context must include "${REQUIRED_CONTEXT}"`
    );
  }
  if (!context.includes(HAP_CONTEXT)) {
    throw new Error(
      `@context must include HAP namespace "${HAP_CONTEXT}"`
    );
  }

  // id
  if (typeof obj.id !== "string" || !obj.id) {
    throw new Error("Missing or invalid credential id");
  }

  // type
  if (!Array.isArray(obj.type)) {
    throw new Error("Missing or invalid type array");
  }
  const types = obj.type as string[];
  if (!types.includes(VC_TYPE)) {
    throw new Error(`type must include "${VC_TYPE}"`);
  }
  if (!types.includes(HAP_CREDENTIAL_TYPE)) {
    throw new Error(`type must include "${HAP_CREDENTIAL_TYPE}"`);
  }

  // issuer
  const issuer = obj.issuer as Record<string, unknown> | undefined;
  if (!issuer || typeof issuer.id !== "string") {
    throw new Error("Missing or invalid issuer.id");
  }

  // dates
  if (typeof obj.issuanceDate !== "string") {
    throw new Error("Missing or invalid issuanceDate");
  }
  if (typeof obj.expirationDate !== "string") {
    throw new Error("Missing or invalid expirationDate");
  }
  if (isNaN(Date.parse(obj.issuanceDate as string))) {
    throw new Error("issuanceDate is not a valid ISO 8601 date");
  }
  if (isNaN(Date.parse(obj.expirationDate as string))) {
    throw new Error("expirationDate is not a valid ISO 8601 date");
  }

  // credentialSubject
  const subject = obj.credentialSubject as Record<string, unknown> | undefined;
  if (!subject || typeof subject !== "object") {
    throw new Error("Missing or invalid credentialSubject");
  }
  if (typeof subject.id !== "string") {
    throw new Error("Missing credentialSubject.id");
  }
  if (typeof subject.agent_id !== "string") {
    throw new Error("Missing credentialSubject.agent_id");
  }
  if (
    typeof subject.agent_type !== "string" ||
    !VALID_AGENT_TYPES.includes(subject.agent_type as AgentType)
  ) {
    throw new Error(
      `credentialSubject.agent_type must be one of: ${VALID_AGENT_TYPES.join(", ")}`
    );
  }
  if (typeof subject.principal_hash !== "string") {
    throw new Error("Missing credentialSubject.principal_hash");
  }
  if (
    typeof subject.verification_level !== "string" ||
    !VALID_VERIFICATION_LEVELS.includes(
      subject.verification_level as VerificationLevel
    )
  ) {
    throw new Error(
      `credentialSubject.verification_level must be one of: ${VALID_VERIFICATION_LEVELS.join(", ")}`
    );
  }

  // authorization_scope
  const scope = subject.authorization_scope as Record<string, unknown> | undefined;
  if (!scope || typeof scope !== "object") {
    throw new Error("Missing credentialSubject.authorization_scope");
  }
  if (!Array.isArray(scope.actions) || scope.actions.length === 0) {
    throw new Error("authorization_scope.actions must be a non-empty array");
  }

  // credentialStatus
  const status = obj.credentialStatus as Record<string, unknown> | undefined;
  if (!status || typeof status.id !== "string") {
    throw new Error("Missing or invalid credentialStatus.id");
  }
  if (typeof status.type !== "string") {
    throw new Error("Missing or invalid credentialStatus.type");
  }

  return input as unknown as HAPCredential;
}

/**
 * Extract the authorization scope from a credential.
 *
 * @param credential - A parsed HAP credential
 * @returns The structured scope object
 */
export function getAuthorizationScope(credential: HAPCredential): HAPScope {
  return credential.credentialSubject.authorization_scope;
}

/**
 * Check if a credential has expired based on its `expirationDate` field.
 * Per the HAP spec, the `expirationDate` is authoritative — it takes
 * precedence over the status endpoint for expiry determination.
 *
 * @param credential - A parsed HAP credential
 * @returns `true` if the credential is past its expiration date
 */
export function isExpired(credential: HAPCredential): boolean {
  return new Date() > new Date(credential.expirationDate);
}

/**
 * Check if a credential's dates indicate it should be active.
 * This checks both that the issuance date is in the past and
 * the expiration date is in the future. It does NOT check
 * revocation status — use `verifyHAPCredential` for a full check.
 *
 * @param credential - A parsed HAP credential
 * @returns `true` if the credential is within its valid time window
 */
export function isActive(credential: HAPCredential): boolean {
  const now = new Date();
  return (
    now >= new Date(credential.issuanceDate) &&
    now <= new Date(credential.expirationDate)
  );
}
