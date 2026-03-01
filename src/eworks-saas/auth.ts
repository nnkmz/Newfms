import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { DomainError } from "./service.js";
import { USER_ROLES, type UserRole } from "./types.js";

export interface AuthUser {
  id: string;
  tenantId: string;
  username: string;
  fullName: string;
  role: UserRole;
  passwordHash: string;
  isActive: boolean;
}

export interface LoginInput {
  tenantId: string;
  username: string;
  password: string;
}

export interface AuthTokenPayload {
  iss: string;
  sub: string;
  tid: string;
  usr: string;
  rol: UserRole;
  name: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  username: string;
  role: UserRole;
  fullName: string;
}

export interface LoginResult {
  accessToken: string;
  tokenType: "Bearer";
  expiresInSeconds: number;
  user: AuthenticatedUser;
}

interface SeedUser {
  id: string;
  tenantId: string;
  username: string;
  fullName: string;
  role: UserRole;
  password: string;
}

interface AuthServiceOptions {
  jwtSecret?: string;
  tokenTtlSeconds?: number;
  users?: AuthUser[];
}

const DEFAULT_TOKEN_TTL_SECONDS = 60 * 60 * 8; // 8 jam

const DEFAULT_SEED_USERS: SeedUser[] = [
  {
    id: "usr_admin_uitm",
    tenantId: "uitm",
    username: "admin",
    fullName: "UiTM Admin",
    role: "admin",
    password: "admin123!",
  },
  {
    id: "usr_helpdesk_uitm",
    tenantId: "uitm",
    username: "helpdesk",
    fullName: "UiTM Helpdesk",
    role: "helpdesk",
    password: "helpdesk123!",
  },
  {
    id: "usr_technician_uitm",
    tenantId: "uitm",
    username: "technician",
    fullName: "UiTM Technician",
    role: "technician",
    password: "tech123!",
  },
  {
    id: "usr_requestor_uitm",
    tenantId: "uitm",
    username: "requestor",
    fullName: "UiTM Requestor",
    role: "requestor",
    password: "requestor123!",
  },
];

function asNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new DomainError(400, "VALIDATION_ERROR", `Medan '${fieldName}' mesti teks dan tidak kosong.`);
  }
  return value.trim();
}

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function assertRole(value: string): UserRole {
  if ((USER_ROLES as readonly string[]).includes(value)) {
    return value as UserRole;
  }
  throw new DomainError(400, "VALIDATION_ERROR", `Peranan pengguna tidak sah: '${value}'.`);
}

function hashPassword(plainPassword: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(plainPassword, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

function verifyPassword(plainPassword: string, passwordHash: string): boolean {
  const parts = passwordHash.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }

  const salt = Buffer.from(parts[1], "base64url");
  const expected = Buffer.from(parts[2], "base64url");
  const derived = scryptSync(plainPassword, salt, expected.length);
  if (derived.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(derived, expected);
}

function parseUsersFromEnv(): AuthUser[] | undefined {
  const raw = process.env.EWORKS_AUTH_USERS_JSON;
  if (!raw || raw.trim().length === 0) {
    return undefined;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new DomainError(500, "AUTH_CONFIG_ERROR", "EWORKS_AUTH_USERS_JSON bukan JSON yang sah.");
  }

  if (!Array.isArray(parsed)) {
    throw new DomainError(500, "AUTH_CONFIG_ERROR", "EWORKS_AUTH_USERS_JSON mesti array.");
  }

  const users: AuthUser[] = [];
  for (const item of parsed) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw new DomainError(500, "AUTH_CONFIG_ERROR", "Setiap item EWORKS_AUTH_USERS_JSON mesti objek.");
    }

    const objectItem = item as Record<string, unknown>;
    const role = assertRole(asNonEmptyString(objectItem.role, "role"));
    const plainPassword = asNonEmptyString(objectItem.password, "password");
    users.push({
      id: asNonEmptyString(objectItem.id, "id"),
      tenantId: asNonEmptyString(objectItem.tenantId, "tenantId"),
      username: asNonEmptyString(objectItem.username, "username"),
      fullName: asNonEmptyString(objectItem.fullName, "fullName"),
      role,
      passwordHash: hashPassword(plainPassword),
      isActive: objectItem.isActive === false ? false : true,
    });
  }

  return users;
}

function buildDefaultUsers(): AuthUser[] {
  return DEFAULT_SEED_USERS.map((item) => ({
    id: item.id,
    tenantId: item.tenantId,
    username: item.username,
    fullName: item.fullName,
    role: item.role,
    passwordHash: hashPassword(item.password),
    isActive: true,
  }));
}

export class EworksAuthService {
  private readonly jwtSecret: string;
  private readonly tokenTtlSeconds: number;
  private readonly users: AuthUser[];

  constructor(options: AuthServiceOptions = {}) {
    this.jwtSecret = options.jwtSecret ?? process.env.EWORKS_JWT_SECRET ?? "change-this-in-production";
    this.tokenTtlSeconds = options.tokenTtlSeconds ?? DEFAULT_TOKEN_TTL_SECONDS;
    this.users = options.users ?? parseUsersFromEnv() ?? buildDefaultUsers();
  }

  login(rawInput: unknown): LoginResult {
    if (typeof rawInput !== "object" || rawInput === null || Array.isArray(rawInput)) {
      throw new DomainError(400, "VALIDATION_ERROR", "Payload login mesti objek JSON.");
    }
    const input = rawInput as Record<string, unknown>;
    const tenantId = asNonEmptyString(input.tenantId, "tenantId");
    const username = asNonEmptyString(input.username, "username");
    const password = asNonEmptyString(input.password, "password");

    const user = this.users.find(
      (item) => item.tenantId === tenantId && item.username.toLowerCase() === username.toLowerCase(),
    );

    if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
      throw new DomainError(401, "INVALID_CREDENTIALS", "Username atau kata laluan tidak sah.");
    }

    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + this.tokenTtlSeconds;
    const payload: AuthTokenPayload = {
      iss: "uitm-eworks-saas",
      sub: user.id,
      tid: user.tenantId,
      usr: user.username,
      rol: user.role,
      name: user.fullName,
      iat: issuedAt,
      exp: expiresAt,
    };
    const token = this.signJwt(payload);

    return {
      accessToken: token,
      tokenType: "Bearer",
      expiresInSeconds: this.tokenTtlSeconds,
      user: {
        userId: user.id,
        tenantId: user.tenantId,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
      },
    };
  }

  verifyAccessToken(accessToken: string): AuthenticatedUser {
    const payload = this.verifyJwt(accessToken);
    return {
      userId: payload.sub,
      tenantId: payload.tid,
      username: payload.usr,
      role: payload.rol,
      fullName: payload.name,
    };
  }

  getDemoAccounts(): Array<{
    tenantId: string;
    username: string;
    role: UserRole;
    password: string;
  }> {
    return DEFAULT_SEED_USERS.map((item) => ({
      tenantId: item.tenantId,
      username: item.username,
      role: item.role,
      password: item.password,
    }));
  }

  private signJwt(payload: AuthTokenPayload): string {
    const encodedHeader = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const encodedPayload = toBase64Url(JSON.stringify(payload));
    const signature = createHmac("sha256", this.jwtSecret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64url");
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private verifyJwt(token: string): AuthTokenPayload {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new DomainError(401, "INVALID_TOKEN", "Token JWT tidak sah.");
    }

    const [encodedHeader, encodedPayload, receivedSignature] = parts;
    const expectedSignature = createHmac("sha256", this.jwtSecret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64url");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const receivedBuffer = Buffer.from(receivedSignature, "utf8");
    if (expectedBuffer.length !== receivedBuffer.length || !timingSafeEqual(expectedBuffer, receivedBuffer)) {
      throw new DomainError(401, "INVALID_TOKEN_SIGNATURE", "Signature token tidak sah.");
    }

    let headerRaw: unknown;
    let payloadRaw: unknown;
    try {
      headerRaw = JSON.parse(fromBase64Url(encodedHeader));
      payloadRaw = JSON.parse(fromBase64Url(encodedPayload));
    } catch {
      throw new DomainError(401, "INVALID_TOKEN", "Kandungan token tidak sah.");
    }

    if (typeof headerRaw !== "object" || headerRaw === null || Array.isArray(headerRaw)) {
      throw new DomainError(401, "INVALID_TOKEN", "Header token tidak sah.");
    }
    const header = headerRaw as Record<string, unknown>;
    if (header.alg !== "HS256") {
      throw new DomainError(401, "INVALID_TOKEN_ALG", "Algoritma token tidak disokong.");
    }

    if (typeof payloadRaw !== "object" || payloadRaw === null || Array.isArray(payloadRaw)) {
      throw new DomainError(401, "INVALID_TOKEN", "Payload token tidak sah.");
    }
    const payload = payloadRaw as Record<string, unknown>;

    const exp = Number(payload.exp);
    const iat = Number(payload.iat);
    if (!Number.isFinite(exp) || !Number.isFinite(iat)) {
      throw new DomainError(401, "INVALID_TOKEN", "Token tidak mempunyai iat/exp yang sah.");
    }

    const now = Math.floor(Date.now() / 1000);
    if (exp <= now) {
      throw new DomainError(401, "TOKEN_EXPIRED", "Token telah tamat tempoh.");
    }

    const role = assertRole(asNonEmptyString(payload.rol, "payload.rol"));
    return {
      iss: asNonEmptyString(payload.iss, "payload.iss"),
      sub: asNonEmptyString(payload.sub, "payload.sub"),
      tid: asNonEmptyString(payload.tid, "payload.tid"),
      usr: asNonEmptyString(payload.usr, "payload.usr"),
      rol: role,
      name: asNonEmptyString(payload.name, "payload.name"),
      iat,
      exp,
    };
  }
}
