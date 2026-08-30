"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useCompany } from "@/contexts/company-context";

export type Country = {
  id: number;
  name: string;
  code: string;
  locale: string;
  active: boolean;
};

type CountryContextValue = {
  countries: Country[];
  selectedCountry: Country | null;
  setSelectedCountry: (c: Country) => void;
  loading: boolean;
  isSuperAdmin: boolean;
  role: "super_admin" | "company_admin" | "company_viewer";
};

const CountryContext = createContext<CountryContextValue>({
  countries: [],
  selectedCountry: null,
  setSelectedCountry: () => {},
  loading: true,
  isSuperAdmin: false,
  role: "company_viewer",
});

interface CountryProviderProps {
  children: ReactNode;
  /** For non-super_admin: the country_id from JWT. When set, selection is locked. */
  fixedCountryId?: number | null;
  isSuperAdmin: boolean;
  role: "super_admin" | "company_admin" | "company_viewer";
}

export function CountryProvider({ children, fixedCountryId, isSuperAdmin, role }: CountryProviderProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountryState] = useState<Country | null>(null);
  const [loading, setLoading] = useState(true);
  const { selectedCompany, loading: companyLoading } = useCompany();

  useEffect(() => {
    if (companyLoading) return;
    if (!selectedCompany) {
      setCountries([]);
      setSelectedCountryState(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function loadCountries() {
      try {
        const subsRes = await fetch(`/api/proxy/companies/${selectedCompany!.id}/countries`);
        const subs: { country_id: number; enabled: boolean }[] = await subsRes.json();
        // The subscription endpoint returns {country_id, enabled} pairs, not
        // full Country objects (see CompanyCountrySubscriptionRead on the
        // backend) — cross-reference against the full catalog to get
        // name/code/locale for display.
        const subscribedIds = new Set(
          (Array.isArray(subs) ? subs : []).filter((s) => s.enabled).map((s) => s.country_id)
        );

        const catalogRes = await fetch("/api/proxy/countries");
        const allCountries: Country[] = await catalogRes.json();
        if (cancelled) return;

        const active = (Array.isArray(allCountries) ? allCountries : [])
          .filter((c) => c.active && subscribedIds.has(c.id));
        setCountries(active);

        if (fixedCountryId) {
          const found = active.find((c) => c.id === fixedCountryId) ?? null;
          setSelectedCountryState(found);
        } else {
          const storedId = typeof window !== "undefined"
            ? Number(localStorage.getItem("selectedCountryId"))
            : 0;
          const found = active.find((c) => c.id === storedId) ?? active[0] ?? null;
          setSelectedCountryState(found);
        }
      } catch {
        if (!cancelled) setCountries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCountries();
    return () => { cancelled = true; };
  }, [fixedCountryId, selectedCompany?.id, companyLoading]);

  function setSelectedCountry(c: Country) {
    if (fixedCountryId) return; // locked for non-super_admin
    setSelectedCountryState(c);
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedCountryId", String(c.id));
    }
  }

  return (
    <CountryContext.Provider value={{ countries, selectedCountry, setSelectedCountry, loading, isSuperAdmin, role }}>
      {children}
    </CountryContext.Provider>
  );
}

export const useCountry = () => useContext(CountryContext);
