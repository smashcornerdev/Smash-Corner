// Test runner only: lets Node load server modules outside Next ("server-only" becomes a no-op).
import { register, createRequire } from "node:module";
register("data:text/javascript," + encodeURIComponent(
  'export async function resolve(s, c, n) { return s === "server-only" ? { url: "data:text/javascript,", shortCircuit: true } : n(s, c); }'
));
const Module = createRequire(import.meta.url)("module");
const load = Module._load;
Module._load = function (request, ...rest) {
  return /(^server-only$)|server-only[\\/]index\.js$/.test(request) ? {} : load.call(this, request, ...rest);
};
