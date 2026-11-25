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
  resetPasswordHandler?: (email: string, options?: any) => Promise<{ data: any; error: any }>;
  updateUserHandler?: (attributes: any) => Promise<{ data: any; error: any }>;
  transactions: Transaction[];
  balanceCheckins: BalanceCheckin[];
  payouts: Payout[];
  profile?: any;
  invoices: any[];
  invoiceItems: any[];
  invoiceSettlements: any[];
  wishGoals: any[];
  wishContributions: any[];
  commitments: any[];
  activeUserId: string;
  people: any[];
  peerDebts: any[];
  debtSettlements: any[];
  expenseGroups: any[];
  expenseGroupMembers: any[];
  groupExpenses: any[];
  groupExpenseSplits: any[];
  groupSettlements: any[];
}

export const mockState: MockState = {
  transactions: [],
  balanceCheckins: [],
  payouts: [],
  profile: null,
  invoices: [],
  invoiceItems: [],
  invoiceSettlements: [],
  wishGoals: [],
  wishContributions: [],
  commitments: [],
  activeUserId: "test-user-id",
  people: [],
  peerDebts: [],
  debtSettlements: [],
  expenseGroups: [],
  expenseGroupMembers: [],
  groupExpenses: [],
  groupExpenseSplits: [],
  groupSettlements: [],
};

export function resetMockState(): void {
  mockState.insertHandler = undefined;
  mockState.selectSingleHandler = undefined;
  mockState.functionsInvokeHandler = undefined;
  mockState.transactions = [];
  mockState.balanceCheckins = [];
  mockState.payouts = [];
  mockState.profile = null;
  mockState.invoices = [];
  mockState.invoiceItems = [];
  mockState.invoiceSettlements = [];
  mockState.wishGoals = [];
  mockState.wishContributions = [];
  mockState.commitments = [];
  mockState.activeUserId = "test-user-id";
  mockState.people = [];
  mockState.peerDebts = [];
  mockState.debtSettlements = [];
  mockState.expenseGroups = [];
  mockState.expenseGroupMembers = [];
  mockState.groupExpenses = [];
  mockState.groupExpenseSplits = [];
  mockState.groupSettlements = [];
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

  ilike(col: string, pattern: string): this {
    const rawPattern = pattern.replace(/^%/, "").replace(/%$/, "").toLowerCase();
    this.items = this.items.filter((item) => (item[col] ?? "").toLowerCase().includes(rawPattern));
    return this;
  }

  lastEqVal?: string;

  eq(col: string, val: string): this {
    if (col === "id") this.lastEqVal = val;
    this.items = this.items.filter((item) => item[col] === val);
    return this;
  }

  single(): Promise<{ data: any; error: any }> {
    if (mockState.selectSingleHandler) return mockState.selectSingleHandler(this.lastEqVal || this.items[0]?.id || "") as any;
    if (this.items.length === 0) return Promise.resolve({ data: null, error: { message: "Row not found" } });
    return Promise.resolve({ data: this.items[0], error: null });
  }

  maybeSingle(): Promise<{ data: any; error: any }> {
    if (mockState.selectSingleHandler) return mockState.selectSingleHandler(this.lastEqVal || this.items[0]?.id || "") as any;
    return Promise.resolve({ data: this.items[0] ?? null, error: null });
  }

  select(): this {
    return this;
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
              if (target) {
                const simulated = { ...target, ...patch };
                const isMineExpense = simulated.type === "expense" && simulated.ownership === "mine";
                if (isMineExpense && !simulated.expense_type) {
                  return {
                    select() {
                      return {
                        single() {
                          return Promise.resolve({
                            data: null,
                            error: { message: 'new row for relation "transactions" violates check constraint "expense_type_rule"' },
                          });
                        },
                      };
                    },
                  };
                }
                if (!isMineExpense && simulated.expense_type !== null && simulated.expense_type !== undefined) {
                  return {
                    select() {
                      return {
                        single() {
                          return Promise.resolve({
                            data: null,
                            error: { message: 'new row for relation "transactions" violates check constraint "expense_type_rule"' },
                          });
                        },
                      };
                    },
                  };
                }
                Object.assign(target, patch);
              }
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

    if (table === "invoices") {
      return {
        select(_cols?: string) {
          return new MockQueryBuilder<any>(mockState.invoices);
        },
        insert(payload: any) {
          return {
            select() {
              return {
                single() {
                  const rec = {
                    ...payload,
                    id: payload.id || "inv-" + Math.random().toString(36).slice(2, 9),
                    status: payload.status || "draft",
                    paid_amount: payload.paid_amount || "0.00",
                    created_at: payload.created_at || new Date().toISOString(),
                  };
                  mockState.invoices.push(rec);
                  return Promise.resolve({ data: rec, error: null });
                },
              };
            },
          };
        },
      };
    }

    if (table === "invoice_items") {
      return {
        select() {
          return new MockQueryBuilder<any>(mockState.invoiceItems);
        },
        insert(payload: any) {
          const items = Array.isArray(payload) ? payload : [payload];
          for (const it of items) {
            mockState.invoiceItems.push({
              ...it,
              id: it.id || "item-" + Math.random().toString(36).slice(2, 9),
            });
          }
          return Promise.resolve({ data: items, error: null });
        },
      };
    }

    if (table === "invoice_settlements") {
      return {
        select() {
          return new MockQueryBuilder<any>(mockState.invoiceSettlements);
        },
        insert(payload: any) {
          return {
            select() {
              return {
                single() {
                  const rec = {
                    ...payload,
                    id: payload.id || "settle-" + Math.random().toString(36).slice(2, 9),
                    created_at: new Date().toISOString(),
                  };
                  mockState.invoiceSettlements.push(rec);

                  // Simulate trigger: update invoice.paid_amount and status
                  const inv = mockState.invoices.find((i) => i.id === payload.invoice_id);
                  if (inv) {
                    const settlements = mockState.invoiceSettlements.filter((s) => s.invoice_id === inv.id);
                    const totalPaid = settlements.reduce((sum, s) => sum + parseFloat(s.amount || "0"), 0);
                    inv.paid_amount = totalPaid.toFixed(2);
                    const totalAmt = parseFloat(inv.total_amount || "0");
                    if (totalPaid >= totalAmt) {
                      inv.status = "paid";
                    } else if (totalPaid > 0) {
                      inv.status = "partially_paid";
                    }
                  }
                  return Promise.resolve({ data: rec, error: null });
                },
              };
            },
          };
        },
      };
    }

    if (table === "wish_goals") {
      return {
        select(_cols?: string) {
          return new MockQueryBuilder<any>(mockState.wishGoals);
        },
        insert(payload: any) {
          return {
            select() {
              return {
                single() {
                  const rec = {
                    ...payload,
                    id: payload.id || "wish-" + Math.random().toString(36).slice(2, 9),
                    status: payload.status || "active",
                    saved_amount: payload.saved_amount || "0.00",
                    created_at: new Date().toISOString(),
                  };
                  mockState.wishGoals.push(rec);
                  return Promise.resolve({ data: rec, error: null });
                },
              };
            },
          };
        },
        update(patch: Record<string, unknown>) {
          return {
            eq(_col: string, val: string) {
              const target = mockState.wishGoals.find((g) => g.id === val);
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

    if (table === "wish_contributions") {
      return {
        select() {
          return new MockQueryBuilder<any>(mockState.wishContributions);
        },
        insert(payload: any) {
          return {
            select() {
              return {
                single() {
                  const rec = {
                    ...payload,
                    id: payload.id || "contrib-" + Math.random().toString(36).slice(2, 9),
                    created_at: new Date().toISOString(),
                  };
                  mockState.wishContributions.push(rec);

                  // Simulate trigger: update goal.saved_amount and status
                  const goal = mockState.wishGoals.find((g) => g.id === payload.goal_id);
                  if (goal) {
                    const contribs = mockState.wishContributions.filter((c) => c.goal_id === goal.id);
                    const totalSaved = contribs.reduce((sum, c) => sum + parseFloat(c.amount || "0"), 0);
                    goal.saved_amount = totalSaved.toFixed(2);
                    const targetAmt = parseFloat(goal.target_amount || "0");
                    if (totalSaved >= targetAmt) {
                      goal.status = "completed";
                    }
                  }
                  return Promise.resolve({ data: rec, error: null });
                },
              };
            },
          };
        },
      };
    }

    if (table === "commitments") {
      return {
        select() {
          return new MockQueryBuilder<any>(mockState.commitments);
        },
        insert(payload: any) {
          return {
            select() {
              return {
                single() {
                  const rec = {
                    ...payload,
                    id: payload.id || "comm-" + Math.random().toString(36).slice(2, 9),
                    created_at: new Date().toISOString(),
                  };
                  mockState.commitments.push(rec);
                  return Promise.resolve({ data: rec, error: null });
                },
              };
            },
          };
        },
      };
    }

    if (table === "people") {
      return {
        select() {
          const own = mockState.people.filter((p) => p.user_id === mockState.activeUserId);
          return new MockQueryBuilder<any>(own);
        },
        insert(payload: any) {
          return {
            select() {
              return {
                single() {
                  const rec = {
                    ...payload,
                    id: payload.id || "person-" + Math.random().toString(36).slice(2, 9),
                    user_id: mockState.activeUserId,
                    is_favorite: payload.is_favorite ?? false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  };
                  mockState.people.push(rec);
                  return Promise.resolve({ data: rec, error: null });
                },
              };
            },
          };
        },
        update(patch: Record<string, unknown>) {
          return {
            eq(col: string, val: string) {
              const target = mockState.people.find((p) => p[col] === val && p.user_id === mockState.activeUserId);
              if (target) Object.assign(target, patch, { updated_at: new Date().toISOString() });
              return {
                select() {
                  return {
                    single() {
                      return target
                        ? Promise.resolve({ data: target, error: null })
                        : Promise.resolve({ data: null, error: { message: "Person not found" } });
                    },
                  };
                },
              };
            },
          };
        },
        delete() {
          return {
            eq(col: string, val: string) {
              const targetIdx = mockState.people.findIndex((p) => p[col] === val && p.user_id === mockState.activeUserId);
              if (targetIdx === -1) return Promise.resolve({ error: null });
              const target = mockState.people[targetIdx];
              const hasDebts = mockState.peerDebts.some((d) => d.person_id === target.id);
              if (hasDebts) {
                return Promise.resolve({
                  error: { code: "23503", message: 'update or delete on table "people" violates foreign key constraint "peer_debts_person_fk"' },
                });
              }
              mockState.people.splice(targetIdx, 1);
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    }

    if (table === "peer_debts") {
      return {
        select() {
          const own = mockState.peerDebts
            .filter((d) => d.user_id === mockState.activeUserId)
            .map((d) => {
              const person = mockState.people.find((p) => p.id === d.person_id && p.user_id === mockState.activeUserId);
              return { ...d, person: person ? { name: person.name } : null };
            });
          return new MockQueryBuilder<any>(own);
        },
        insert(payload: any) {
          return {
            select() {
              return {
                single() {
                  const id = payload.id || "debt-" + Math.random().toString(36).slice(2, 9);
                  if (mockState.peerDebts.some((d) => d.id === id)) {
                    return Promise.resolve({ data: null, error: { code: "23505", message: "duplicate key value violates unique constraint \"peer_debts_pkey\"" } });
                  }
                  const person = mockState.people.find((p) => p.id === payload.person_id && p.user_id === mockState.activeUserId);
                  if (!person) {
                    return Promise.resolve({ data: null, error: { code: "23503", message: 'insert or update on table "peer_debts" violates foreign key constraint "peer_debts_person_fk"' } });
                  }
                  const rec = {
                    ...payload,
                    id,
                    user_id: mockState.activeUserId,
                    status: payload.status ?? "active",
                    created_at: payload.created_at || new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  };
                  mockState.peerDebts.push(rec);
                  return Promise.resolve({ data: rec, error: null });
                },
              };
            },
          };
        },
      };
    }

    if (table === "debt_settlements") {
      return {
        select() {
          const own = mockState.debtSettlements.filter((s) => s.user_id === mockState.activeUserId);
          return new MockQueryBuilder<any>(own);
        },
        insert(payload: any) {
          return {
            select() {
              return {
                single() {
                  const id = payload.id || "settle-" + Math.random().toString(36).slice(2, 9);
                  if (mockState.debtSettlements.some((s) => s.id === id)) {
                    return Promise.resolve({ data: null, error: { code: "23505", message: "duplicate key value violates unique constraint \"debt_settlements_pkey\"" } });
                  }
                  const debt = mockState.peerDebts.find((d) => d.id === payload.debt_id && d.user_id === mockState.activeUserId);
                  if (!debt) {
                    return Promise.resolve({ data: null, error: { code: "23503", message: "Referenced peer_debt not found for user" } });
                  }
                  const expectedDir = debt.direction === "you_owe" ? "repayment_out" : "repayment_in";
                  if (payload.direction !== expectedDir) {
                    return Promise.resolve({ data: null, error: { message: `Invalid settlement direction ${payload.direction} for debt direction ${debt.direction}` } });
                  }
                  if (payload.amount_paise <= 0 || payload.amount_paise > debt.remaining_amount_paise) {
                    return Promise.resolve({ data: null, error: { message: `Overpayment rejected: settlement ${payload.amount_paise} exceeds remaining ${debt.remaining_amount_paise}` } });
                  }
                  debt.remaining_amount_paise -= payload.amount_paise;
                  debt.status = debt.remaining_amount_paise === 0 ? "settled" : "partially_settled";
                  const rec = {
                    ...payload,
                    id,
                    user_id: mockState.activeUserId,
                    settled_at: payload.settled_at || new Date().toISOString(),
                    created_at: payload.created_at || new Date().toISOString(),
                  };
                  mockState.debtSettlements.push(rec);
                  return Promise.resolve({ data: rec, error: null });
                },
              };
            },
          };
        },
      };
    }

    if (table === "expense_groups") {
      return {
        select() {
          return new MockQueryBuilder<any>(mockState.expenseGroups.filter((g) => g.user_id === mockState.activeUserId));
        },
        insert(payload: any) {
          return {
            select() {
              return {
                single() {
                  const rec = {
                    ...payload,
                    id: payload.id || "grp-" + Math.random().toString(36).slice(2, 9),
                    user_id: mockState.activeUserId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  };
                  mockState.expenseGroups.push(rec);
                  return Promise.resolve({ data: rec, error: null });
                },
              };
            },
          };
        },
        delete() {
          return {
            eq(col: string, val: string) {
              const idx = mockState.expenseGroups.findIndex((g) => g[col] === val && g.user_id === mockState.activeUserId);
              if (idx === -1) return Promise.resolve({ error: null });
              const grp = mockState.expenseGroups[idx];
              if (mockState.groupExpenses.some((e) => e.group_id === grp.id)) {
                return Promise.resolve({
                  error: { code: "23503", message: 'update or delete on table "expense_groups" violates foreign key constraint "group_expenses_group_fk"' },
                });
              }
              mockState.expenseGroups.splice(idx, 1);
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    }

    if (table === "expense_group_members") {
      return {
        select() {
          return new MockQueryBuilder<any>(mockState.expenseGroupMembers.filter((m) => m.user_id === mockState.activeUserId));
        },
        insert(payload: any) {
          const rows = Array.isArray(payload) ? payload : [payload];
          const inserted = rows.map((r) => ({
            ...r,
            id: r.id || "mem-" + Math.random().toString(36).slice(2, 9),
            user_id: mockState.activeUserId,
            joined_at: new Date().toISOString(),
          }));
          mockState.expenseGroupMembers.push(...inserted);
          return {
            select() {
              return Promise.resolve({ data: inserted, error: null });
            },
            then(resolve: any) {
              return Promise.resolve({ data: inserted, error: null }).then(resolve);
            },
          };
        },
      };
    }

    if (table === "group_expenses") {
      return {
        select() {
          return new MockQueryBuilder<any>(mockState.groupExpenses.filter((e) => e.user_id === mockState.activeUserId));
        },
        insert(payload: any) {
          return {
            select() {
              return {
                single() {
                  const rec = {
                    ...payload,
                    id: payload.id || "gexp-" + Math.random().toString(36).slice(2, 9),
                    user_id: mockState.activeUserId,
                    created_at: payload.created_at || new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  };
                  mockState.groupExpenses.push(rec);
                  return Promise.resolve({ data: rec, error: null });
                },
              };
            },
          };
        },
      };
    }

    if (table === "group_expense_splits") {
      return {
        select() {
          return new MockQueryBuilder<any>(mockState.groupExpenseSplits.filter((s) => s.user_id === mockState.activeUserId));
        },
        insert(payload: any) {
          const rows = Array.isArray(payload) ? payload : [payload];
          const inserted = rows.map((r) => ({
            ...r,
            id: r.id || "gspl-" + Math.random().toString(36).slice(2, 9),
            user_id: mockState.activeUserId,
            created_at: r.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));
          mockState.groupExpenseSplits.push(...inserted);
          return {
            select() {
              return Promise.resolve({ data: inserted, error: null });
            },
          };
        },
      };
    }

    if (table === "group_settlements") {
      return {
        select() {
          return new MockQueryBuilder<any>(mockState.groupSettlements.filter((s) => s.user_id === mockState.activeUserId));
        },
        insert(payload: any) {
          return {
            select() {
              return {
                single() {
                  const id = payload.id || "gset-" + Math.random().toString(36).slice(2, 9);
                  if (mockState.groupSettlements.some((s) => s.id === id)) {
                    return Promise.resolve({ data: null, error: { code: "23505", message: "duplicate key value violates unique constraint \"group_settlements_pkey\"" } });
                  }
                  const split = mockState.groupExpenseSplits.find((s) => s.id === payload.group_expense_split_id && s.user_id === mockState.activeUserId);
                  if (!split) {
                    return Promise.resolve({ data: null, error: { message: "Referenced group_expense_split not found for user" } });
                  }
                  const expectedDir = split.direction === "you_owe" ? "repayment_out" : "repayment_in";
                  if (payload.direction !== expectedDir) {
                    return Promise.resolve({ data: null, error: { message: `Invalid settlement direction ${payload.direction} for split direction ${split.direction}` } });
                  }
                  if (payload.amount_paise <= 0 || payload.amount_paise > split.remaining_amount_paise) {
                    return Promise.resolve({ data: null, error: { message: `Overpayment rejected: settlement ${payload.amount_paise} exceeds remaining ${split.remaining_amount_paise}` } });
                  }
                  split.remaining_amount_paise -= payload.amount_paise;
                  split.status = split.remaining_amount_paise === 0 ? "settled" : "partially_settled";
                  const rec = {
                    ...payload,
                    id,
                    user_id: mockState.activeUserId,
                    settled_at: payload.settled_at || new Date().toISOString(),
                    created_at: payload.created_at || new Date().toISOString(),
                  };
                  mockState.groupSettlements.push(rec);
                  return Promise.resolve({ data: rec, error: null });
                },
              };
            },
          };
        },
      };
    }

    throw new Error(`Unexpected table ${table} in mock`);
  },
  auth: {
    getUser: async () => Promise.resolve({ data: { user: { id: "test-user-id", email: "test@flova.local" } }, error: null }),
    getSession: async () => Promise.resolve({ data: { session: { user: { id: "test-user-id" } } }, error: null }),
    resetPasswordForEmail: async (email: string, options?: any) => {
      if (mockState.resetPasswordHandler) {
        return mockState.resetPasswordHandler(email, options);
      }
      return { data: {}, error: null };
    },
    updateUser: async (attributes: any) => {
      if (mockState.updateUserHandler) {
        return mockState.updateUserHandler(attributes);
      }
      return { data: { user: { id: "test-user-id" } }, error: null };
    },
    signOut: async () => ({ error: null }),
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
