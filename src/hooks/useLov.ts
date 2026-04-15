import { useState, useEffect } from "react";
import { apiCall } from "@/api/client";

export interface LovOption {
  value: string;
  label: string;
}

// Session-level cache so LOVs survive component remounts without re-fetching
const lovCache = new Map<string, LovOption[]>();

/** Clear all cached LOV data. Call on logout so the next session fetches fresh data. */
export function clearLovCache(): void {
  lovCache.clear();
}

export function useLov(
  opReq: string,
  valueField: string,
  labelField: string,
  params?: Record<string, string>
): { options: LovOption[]; loading: boolean } {
  const cacheKey = params ? `${opReq}::${JSON.stringify(params)}` : opReq;
  const cached = lovCache.get(cacheKey);

  const [options, setOptions] = useState<LovOption[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (lovCache.has(cacheKey)) return;
    let cancelled = false;
    setLoading(true);

    apiCall<{ records: Record<string, string>[] }>(opReq, params)
      .then((res) => {
        if (cancelled) return;
        const opts = (res.records ?? []).map((r) => ({
          value: r[valueField] ?? "",
          label: r[labelField] ?? r[valueField] ?? "",
        }));
        lovCache.set(cacheKey, opts);
        setOptions(opts);
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // cacheKey encodes all relevant inputs; params object identity doesn't matter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  return { options, loading };
}
