import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mockSupabasePath = path.resolve(__dirname, "mockSupabase.ts");

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "../lib/supabase" || specifier.endsWith("/lib/supabase") || specifier.endsWith("/lib/supabase.ts")) {
    return {
      shortCircuit: true,
      url: pathToFileURL(mockSupabasePath).href,
    };
  }

  if (specifier.startsWith(".") && !specifier.endsWith(".ts") && !specifier.endsWith(".js") && !specifier.endsWith(".json")) {
    try {
      return await nextResolve(specifier + ".ts", context);
    } catch {
      try {
        return await nextResolve(specifier + "/index.ts", context);
      } catch {
        // Fall back to default
      }
    }
  }
  return nextResolve(specifier, context);
}
