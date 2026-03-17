// ══════════════════════════════════════════════════════════════
// @nordax/hap — Type Definitions
//
// Public types for the Human Authorization Protocol (HAP).
// These types describe the W3C VC 2.0 credential structure
// used by HAP without any issuance or server-side logic.
// ══════════════════════════════════════════════════════════════

/** Agent type classification */
export type AgentType =
  | "ai_assistant"
  | "api_client"
  | "automation"
  | "service_agent";

/** Verification level — determines default credential validity */
export type VerificationLevel = "basic" | "enhanced" | "full";

/** Credential status values */
export type HAPStatus =
  | "active"
  | "expired"
  | "revoked"
  | "suspended"
  | "not_found"
  | "invalid_signature";

/**
 * Structured authorization scope.
 *
 * - `actions` — Required. At least one action verb (e.g. "read", "recommend", "transact").
 * - `categories` — Optional. Restricts authorization to specific business categories.
 * - `spendingLimits` — Optional. Financial constraints on transactions.
 * - `geographicRestrictions` — Optional. Regional constraints using ISO 3166-2 codes.
 */
export interface HAPScope {
  actions: string[];
  categories?: string[];
  spendingLimits?: {
    currency: string;
    maxPerTransaction?: number;
    maxDaily?: number;
  };
  geographicRestrictions?: {
    allowedRegions?: string[];
    deniedRegions?: string[];
  };
}

/**
 * W3C VC 2.0 HAP Authorization Credential.
 *
 * The `principalIdentity` field described in the HAP spec is the raw identity
 * string (email, user ID, etc.) of the human authorizing the agent. It is
 * SHA-256 hashed before storage — only the `principal_hash` appears in the
 * credential. The raw identity is never persisted or transmitted.
 */
export interface HAPCredential {
  "@context": string[];
  id: string;
  type: string[];
  issuer: {
    id: string;
    name: string;
  };
  issuanceDate: string;
  expirationDate: string;
  credentialSubject: {
    id: string;
    type: string;
    agent_id: string;
    agent_type: AgentType;
    principal_hash: string;
    authorization_scope: HAPScope;
    verification_level: VerificationLevel;
  };
  credentialStatus: {
    id: string;
    type: string;
  };
  proof?: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
  };
}

/** Result of credential verification */
export interface HAPVerifyResult {
  valid: boolean;
  status: HAPStatus;
  credential?: HAPCredential;
  authId?: string;
  /** ISO 8601 timestamp of when verification was performed */
  verifiedAt?: string;
  /** Errors encountered during verification (if any) */
  errors?: string[];
}

/** Options for the verify function */
export interface HAPVerifyOptions {
  /**
   * Whether to check the credentialStatus endpoint for real-time
   * revocation status. Defaults to `true`.
   *
   * Set to `false` for offline verification (expiry + structure only).
   */
  checkStatus?: boolean;

  /**
   * Custom fetch implementation. Defaults to global `fetch`.
   * Useful for testing or environments where global fetch is unavailable.
   */
  fetch?: typeof globalThis.fetch;

  /**
   * Timeout in milliseconds for the status endpoint request.
   * Defaults to 5000 (5 seconds).
   */
  statusTimeoutMs?: number;
}

/** Response shape from the HAP status endpoint */
export interface HAPStatusResponse {
  authId: string;
  status: "active" | "expired" | "revoked" | "suspended";
  issuedAt: string;
  validUntil: string;
  revokedAt: string | null;
  revocationReason: string | null;
}
