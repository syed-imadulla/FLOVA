// Mock Supabase client for service unit testing
import type { BalanceCheckin, Payout, Transaction } from "../../types/contracts";

export function unwrap<T>(result: { data: T | null; error: { message: string } | null }, action: string): T {
  if (result.error) throw new Error(`${action} failed: ${result.error.message}`);
  if (result.data === null) throw new Error(`${action} returned no data`);
  return result.data;
}

export interface MockState {
  insertHandler?: (payload: unknown) => Promise<{ data: unknown; error: unknown }>;
  selectSingleHandler?: (id: string) => Promise<{ data: unknown; error: unknown }>;
  functionsInvokeHandler?: (fnName: string, options?: any) => Promise<{ data: any; error: any }>;
  transactions: Transaction[];
  balanceCheckins: BalanceCheckin[];
  payouts: Payout[];
  profile?: any;
}

export const mockState: MockState = {
  transactions: [],
  balanceCheckins: [],
  payouts: [],
  profile: null,
};

export function resetMockState(): void {
  mockState.insertHandler = undefined;
  mockState.selectSingleHandler = undefined;
  mockState.functionsInvokeHandler = undefined;
  mockState.transactions = [];
  mockState.balanceCheckins = [];
  mockState.payouts = [];
  mockState.profile = null;
}

class MockQueryBuilder<T> implements PromiseLike<{ data: T[]; error: null }> {
  private items: any[];
  private limitCount?: number;

  constructor(items: any[]) {
    this.items = [...items];
  }

  order(col: string, opts?: { ascending?: boolean }): this {
    const asc = opts?.ascending ?? true;
    this.items.sort((a, b) => {
      const valA = a[col] ?? "";
      const valB = b[col] ?? "";
      if (valA < valB) return asc ? -1 : 1;
      if (valA > valB) return asc ? 1 : -1;
      return 0;
    });
    return this;
  }

  gte(col: string, val: string): this {
    this.items = this.items.filter((item) => (item[col] ?? "") >= val);
    return this;
  }

  lte(col: string, val: string): this {
    this.items = this.items.filter((item) => (item[col] ?? "") <= val);
    return this;
  }

  eq(col: string, val: string): any {
    const filtered = this.items.filter((item) => item[col] === val);
    return {
      maybeSingle: async () => {
        if (col === "id" && mockState.selectSingleHandler) {
          return mockState.selectSingleHandler(val);
        }
        return { data: filtered[0] ?? null, error: null };
      },
      single: async () => {
        if (col === "id" && mockState.selectSingleHandler) {
          return mockState.selectSingleHandler(val);
        }
        if (filtered.length === 0) return { data: null, error: { message: "Row not found" } };
        return { data: filtered[0], error: null };
      },
      select: () => ({
        single: async () => {
          if (filtered.length === 0) return { data: null, error: { message: "Row not found" } };
          return { data: filtered[0], error: null };
        },
      }),
    };
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  then<TResult1 = { data: T[]; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: T[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    const result = this.limitCount !== undefined ? this.items.slice(0, this.limitCount) : this.items;
    return Promise.resolve({ data: result as T[], error: null }).then(onfulfilled, onrejected);
  }
}

export const supabase = {
  from(table: string) {
    if (table === "transactions") {
      return {
        insert(payload: unknown) {
          return {
            select() {
              return {
                single() {
                  if (mockState.insertHandler) {
                    return mockState.insertHandler(payload);
                  }
                  const id = (payload as any)?.id;
                  if (id && mockState.transactions.some((t: any) => t.id === id)) {
                    return Promise.resolve({
                      data: null,
                      error: { code: "23505", message: 'duplicate key value violates unique constraint "transactions_pkey"' } as any,
                    });
                  }
                  const ownership = (payload as any)?.ownership ?? "mine";
                  const date = (payload as any)?.transaction_date || "2026-11-21";
                  const amountNum = parseFloat((payload as any)?.amount ?? "0");
                  if (ownership === "mine") {
                    const existingDailySum = mockState.transactions
                      .filter((t: any) => (t.ownership ?? "mine") === "mine" && (t.transaction_date || t.date || "2026-11-21") === date && t.id !== id)
                      .reduce((sum: number, t: any) => sum + parseFloat(t.amount || "0"), 0);
                    if (existingDailySum + amountNum > 1000000.00) {
                      return Promise.resolve({
                        data: null,
                        error: {
                          code: "check_violation",
                          message: `Daily transaction limit of ₹10,00,000 exceeded for ${date}`,
                        } as any,
                      });
                    }
                  }
                  const rec = typeof payload === "object" && payload !== null
                    ? {
                        ...payload,
                        created_at: (payload as any).created_at || "2026-11-21T00:00:00Z",
                        updated_at: "2026-11-21T00:00:00Z",
                      }
                    : payload;
                  mockState.transactions.push(rec as Transaction);
                  return Promise.resolve({ data: rec, error: null });
                },
              };
            },
          };
        },
        select(_cols: string) {
          return new MockQueryBuilder<Transaction>(mockState.transactions);
        },
        update(patch: Record<string, unknown>) {
          return {
            eq(col: string, val: string) {
              const target = mockState.transactions.find((t: any) => t[col] === val);
              if (target) Object.assign(target, patch);
              return {
                select() {
                  return {
                    single() {
                      return Promise.resolve({ data: target ?? null, error: null });
                    },
                  };
                },
              };
            },
          };
        },
      };
    }

    if (table === "balance_checkins") {
      return {
        select(_cols: string) {
          return new MockQueryBuilder<BalanceCheckin>(mockState.balanceCheckins);
        },
        insert(payload: unknown) {
          return {
            select() {
              return {
                single() {
                  const rec = typeof payload === "object" && payload !== null
                    ? {
                        ...payload,
                        id: (payload as any).id || "checkin-" + Math.random().toString(36).slice(2, 9),
                        created_at: (payload as any).created_at || "2026-11-21T00:00:00Z",
                      }
                    : payload;
                  mockState.balanceCheckins.push(rec as BalanceCheckin);
                  return Promise.resolve({ data: rec, error: null });
                },
              };
            },
          };
        },
      };
    }

    if (table === "payouts") {
      return {
        select(_cols: string) {
          return new MockQueryBuilder<Payout>(mockState.payouts);
        },
        insert(payload: unknown) {
          return {
            select() {
              return {
                single() {
                  const rec = typeof payload === "object" && payload !== null
                    ? {
                        ...payload,
                        id: (payload as any).id || "payout-" + Math.random().toString(36).slice(2, 9),
                        created_at: (payload as any).created_at || "2026-11-21T00:00:00Z",
                        updated_at: "2026-11-21T00:00:00Z",
                      }
                    : payload;
                  mockState.payouts.push(rec as Payout);
                  return Promise.resolve({ data: rec, error: null });
                },
              };
            },
          };
        },
      };
    }

    if (table === "profiles") {
      return {
        select(_cols?: string) {
          return {
            single: async () => {
              if (mockState.selectSingleHandler) {
                return mockState.selectSingleHandler("profile");
              }
              return { data: mockState.profile ?? null, error: null };
            },
          };
        },
        update(patch: Record<string, unknown>) {
          return {
            eq(_col: string, _val: string) {
              return {
                select() {
                  return {
                    single: async () => {
                      if (mockState.insertHandler) {
                        return mockState.insertHandler(patch);
                      }
                      const updated = { ...(mockState.profile || {}), ...patch };
                      mockState.profile = updated as any;
                      return { data: updated, error: null };
                    },
                  };
                },
              };
            },
          };
        },
      };
    }

    throw new Error(`Unexpected table ${table} in mock`);
  },
  functions: {
    invoke: async (fnName: string, options?: any) => {
      if (mockState.functionsInvokeHandler) {
        return mockState.functionsInvokeHandler(fnName, options);
      }
      return { data: null, error: { message: `Function ${fnName} not mocked` } };
    },
  },
};
