"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Company = {
  id: number;
  name: string;
  slug: string;
  active: boolean;
  logo_url: string | null;
  subject_prefix: string | null;
  signature: string | null;
};

type CompanyContextValue = {
  companies: Company[];
  selectedCompany: Company | null;
  setSelectedCompany: (c: Company) => void;
  loading: boolean;
  isSuperAdmin: boolean;
};

const CompanyContext = createContext<CompanyContextValue>({
  companies: [],
  selectedCompany: null,
  setSelectedCompany: () => {},
  loading: true,
  isSuperAdmin: false,
});

interface CompanyProviderProps {
  children: ReactNode;
  /** For non-super_admin: the company_id from JWT. When set, selection is locked. */
  fixedCompanyId?: number | null;
  isSuperAdmin: boolean;
}

export function CompanyProvider({ children, fixedCompanyId, isSuperAdmin }: CompanyProviderProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompanyState] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/proxy/companies")
      .then((r) => r.json())
      .then((data: Company[]) => {
        const active = Array.isArray(data) ? data.filter((c) => c.active) : [];
        setCompanies(active);

        if (fixedCompanyId) {
          // Non-super_admin: lock to their assigned company. Fail closed —
          // if the JWT's company_id doesn't resolve, selectedCompany stays
          // null rather than silently falling back to another company.
          const found = active.find((c) => c.id === fixedCompanyId) ?? null;
          setSelectedCompanyState(found);
        } else {
          // super_admin: restore from localStorage or pick first
          const storedId = typeof window !== "undefined"
            ? Number(localStorage.getItem("selectedCompanyId"))
            : 0;
          const found = active.find((c) => c.id === storedId) ?? active[0] ?? null;
          setSelectedCompanyState(found);
        }
      })
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, [fixedCompanyId]);

  function setSelectedCompany(c: Company) {
    if (fixedCompanyId) return; // locked for non-super_admin
    setSelectedCompanyState(c);
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedCompanyId", String(c.id));
    }
  }

  return (
    <CompanyContext.Provider value={{ companies, selectedCompany, setSelectedCompany, loading, isSuperAdmin }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);
