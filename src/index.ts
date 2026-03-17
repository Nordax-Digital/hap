// ══════════════════════════════════════════════════════════════
// @nordax/hap — Public API
// ══════════════════════════════════════════════════════════════

export { verifyHAPCredential } from "./verify.js";
export {
  parseHAPCredential,
  getAuthorizationScope,
  isExpired,
  isActive,
} from "./parse.js";
export type {
  HAPCredential,
  HAPScope,
  HAPVerifyResult,
  HAPVerifyOptions,
  HAPStatusResponse,
  HAPStatus,
  AgentType,
  VerificationLevel,
} from "./types.js";
