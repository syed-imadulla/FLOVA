// =====================================================================
// FLOVA 2.0 | Shared Financial Intelligence React Hook (Sprint 6B)
// Single coordinated loader + memoized composition layer for HomeScreen,
// InsightsScreen, MoneyScreen, and WishScreen.
// =====================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "../auth/useSession";
import { useDataVersion } from "../data/DataVersionProvider";
import { todayLocalISO } from "../data/dates";
import { monthRange } from "../engine/monthSummary";
import { listTransactions, loadRunwayInput } from "../services/data";
import { listGroupExpenses } from "../services/groupExpenses";
import { listWishGoals } from "../services/wish";
import type {
  GroupExpense,
  ISODate,
  Paise,
  RunwayInput,
  Transaction,
  WishGoal,
} from "../types/contracts";
import type { Wish } from "../wish/types";
import { getActiveWish } from "../wish/wishService";
import {
  composeFinancialIntelligence,
  type FinancialIntelligenceSnapshot,
  type FinancialIntelligenceStatus,
} from "./financialIntelligence";

export {
  composeFinancialIntelligence,
  type FinancialIntelligenceSnapshot,
  type FinancialIntelligenceStatus,
} from "./financialIntelligence";
export {
  FINANCIAL_TERMS,
  formatFinancialAmount,
  type FinancialTermDefinition,
  type FinancialTermKey,
} from "./financialTerminology";

export interface UseFinancialIntelligenceOptions {
  horizonDays?: number;
  dailyRepaymentBudgetPaise?: Paise;
  explicitReservedGoalsPaise?: Paise;
  explicitWishReservationsById?: Record<string, Paise>;
  conservativeFallbackDays?: number;
  month?: string;
}

interface LoadedIntelligenceState {
  runwayInput: RunwayInput;
  monthTransactions: Transaction[];
  wishGoals: WishGoal[];
  localWish: Wish | null;
  creditorNamesById: Record<string, string>;
  todayISO: ISODate;
}

export interface UseFinancialIntelligenceResult {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  status: FinancialIntelligenceStatus | "loading";
  data: FinancialIntelligenceSnapshot | null;
  rawInput: RunwayInput | null;
  reload: () => Promise<void>;
}

function buildCreditorNameMap(
  runwayInput: RunwayInput,
  groupExpenses: GroupExpense[]
): Record<string, string> {
  const namesByPersonId: Record<string, string> = {};
  for (const debt of runwayInput.peerDebts ?? []) {
    if (debt.personId && debt.personName) {
      namesByPersonId[debt.personId] = debt.personName;
    }
  }
  const map: Record<string, string> = { ...namesByPersonId };
  for (const exp of groupExpenses) {
    if (!exp.paid_by_self && exp.paid_by_person_id) {
      const name = namesByPersonId[exp.paid_by_person_id];
      if (name) map[exp.id] = name;
    }
  }
  return map;
}

export function useFinancialIntelligence(
  options: UseFinancialIntelligenceOptions = {}
): UseFinancialIntelligenceResult {
  const { user } = useSession();
  const userId = user?.id;
  const { version } = useDataVersion();

  const [loaded, setLoaded] = useState<LoadedIntelligenceState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const reqRef = useRef(0);
  const hasLoadedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!userId) {
      reqRef.current++;
      hasLoadedRef.current = false;
      if (mountedRef.current) {
        setLoaded(null);
        setLoading(false);
        setRefreshing(false);
        setError(null);
      }
      return;
    }

    const reqId = ++reqRef.current;
    setError(null);
    if (hasLoadedRef.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const todayISO = todayLocalISO();
    const activeMonth = options.month ?? todayISO.slice(0, 7);
    const { from, to } = monthRange(activeMonth);

    try {
      const [runwayInput, monthTransactions, wishGoals, groupExpenses] =
        await Promise.all([
          loadRunwayInput(),
          listTransactions({ from, to }),
          listWishGoals().catch(() => [] as WishGoal[]),
          listGroupExpenses().catch(() => [] as GroupExpense[]),
        ]);

      let localWish: Wish | null = null;
      if (wishGoals.length === 0) {
        localWish = await getActiveWish(userId).catch(() => null);
      }

      if (!mountedRef.current || reqId !== reqRef.current) return;

      hasLoadedRef.current = true;
      setLoaded({
        runwayInput,
        monthTransactions,
        wishGoals,
        localWish,
        creditorNamesById: buildCreditorNameMap(runwayInput, groupExpenses),
        todayISO,
      });
    } catch (err) {
      if (!mountedRef.current || reqId !== reqRef.current) return;
      hasLoadedRef.current = false;
      setLoaded(null);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load financial intelligence"
      );
    } finally {
      if (mountedRef.current && reqId === reqRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [userId, options.month]);

  useEffect(() => {
    void load();
  }, [load, version]);

  const data = useMemo<FinancialIntelligenceSnapshot | null>(() => {
    if (!loaded || error) return null;
    return composeFinancialIntelligence({
      runwayInput: loaded.runwayInput,
      monthTransactions: loaded.monthTransactions,
      wishGoals: loaded.wishGoals,
      localWish: loaded.localWish,
      explicitReservedGoalsPaise: options.explicitReservedGoalsPaise,
      explicitWishReservationsById: options.explicitWishReservationsById,
      dailyRepaymentBudgetPaise: options.dailyRepaymentBudgetPaise,
      creditorNamesById: loaded.creditorNamesById,
      todayISO: loaded.todayISO,
      horizonDays: options.horizonDays,
      conservativeFallbackDays: options.conservativeFallbackDays,
    });
  }, [
    loaded,
    error,
    options.explicitReservedGoalsPaise,
    options.explicitWishReservationsById,
    options.dailyRepaymentBudgetPaise,
    options.horizonDays,
    options.conservativeFallbackDays,
  ]);

  const status: FinancialIntelligenceStatus | "loading" = loading
    ? "loading"
    : error || !data
      ? "unavailable"
      : data.status;

  return {
    loading,
    refreshing,
    error,
    status,
    data,
    rawInput: loaded?.runwayInput ?? null,
    reload: load,
  };
}
