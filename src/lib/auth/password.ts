import { hash, compare } from "bcrypt";

const BCRYPT_COST = 12;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, BCRYPT_COST);
}

export async function verifyPassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  return compare(plain, hashed);
}
