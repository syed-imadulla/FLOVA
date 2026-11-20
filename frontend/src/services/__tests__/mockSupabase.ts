// Mock Supabase client for service unit testing
export function unwrap<T>(result: { data: T | null; error: { message: string } | null }, action: string): T {
  if (result.error) throw new Error(`${action} failed: ${result.error.message}`);
  if (result.data === null) throw new Error(`${action} returned no data`);
  return result.data;
}

export interface MockState {
  insertHandler?: (payload: unknown) => Promise<{ data: unknown; error: unknown }>;
  selectSingleHandler?: (id: string) => Promise<{ data: unknown; error: unknown }>;
}

export const mockState: MockState = {};

export const supabase = {
  from(table: string) {
    if (table !== "transactions") {
      throw new Error(`Unexpected table ${table} in mock`);
    }
    return {
      insert(payload: unknown) {
        return {
          select() {
            return {
              single() {
                if (mockState.insertHandler) {
                  return mockState.insertHandler(payload);
                }
                const data = typeof payload === "object" && payload !== null ? { ...payload, created_at: "2026-11-21T00:00:00Z" } : payload;
                return Promise.resolve({ data, error: null });
              },
            };
          },
        };
      },
      select(_cols: string) {
        let queriedId: string | null = null;
        return {
          eq(col: string, val: string) {
            if (col === "id") queriedId = val;
            return {
              maybeSingle() {
                if (mockState.selectSingleHandler) {
                  return mockState.selectSingleHandler(queriedId ?? "");
                }
                return Promise.resolve({ data: null, error: null });
              },
            };
          },
        };
      },
    };
  },
};
