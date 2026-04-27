const { scryptSync, timingSafeEqual } = require("node:crypto");

const HASH_PREFIX = "scrypt$";

function verifyHashedPassword(password, hash) {
  if (!hash.startsWith(HASH_PREFIX)) return false;
  const [, salt = "", stored = ""] = hash.split("$");
  if (!salt || !stored) return false;
  const derived = scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(stored, "hex");
  if (derived.length !== storedBuf.length) return false;
  return timingSafeEqual(derived, storedBuf);
}

const password = "123123.Mmm";
const hash = "scrypt$9390bfb13e3004e77ecbc02f94bfc9d0$1cd8eb7e470115277145f667fa57d1b74361bf09613e2b0eb21719c3ec570a3c938d5d4c6f246af928eb19e7d58349a19453e36a22f58636b98f45445b96b266";

console.log("Password:", password);
console.log("Match:", verifyHashedPassword(password, hash));
