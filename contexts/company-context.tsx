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
  error: string | null;
};

const CompanyContext = createContext<CompanyContextValue>({
  companies: [],
  selectedCompany: null,
  setSelectedCompany: () => {},
  loading: true,
  isSuperAdmin: false,
  error: null,
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        if (isSuperAdmin) {
          // super_admin: GET /api/v1/admin/companies (SuperAdminUser-only)
          // returns the full company list.
          const res = await fetch("/api/proxy/companies");
          const data = await res.json();
          if (cancelled) return;

          const active = Array.isArray(data) ? data.filter((c: Company) => c.active) : [];
          setCompanies(active);

          const storedId = typeof window !== "undefined"
            ? Number(localStorage.getItem("selectedCompanyId"))
            : 0;
          const found = active.find((c) => c.id === storedId) ?? active[0] ?? null;
          setSelectedCompanyState(found);
        } else if (fixedCompanyId) {
          // Non-super_admin: GET /api/v1/admin/companies/{id} is
          // CompanyScopedUser (a company-scoped user can read their own
          // company) — fetch only that one company instead of the list.
          const res = await fetch(`/api/proxy/companies/${fixedCompanyId}`);
          const data = await res.json();
          if (cancelled) return;

          const company: Company | null =
            res.ok && data && typeof data.id === "number" && data.active ? data : null;
          const active = company ? [company] : [];
          setCompanies(active);
          // Fail closed — if the single-company fetch didn't resolve to an
          // active company, selectedCompany stays null rather than falling
          // back to another company.
          setSelectedCompanyState(active.find((c) => c.id === fixedCompanyId) ?? null);
        } else {
          // Non-super_admin with no company_id claim (legacy/bad token).
          // Fail closed: never fall back to the super_admin auto-assign path.
          setCompanies([]);
          setSelectedCompanyState(null);
        }
      } catch {
        if (!cancelled) {
          setCompanies([]);
          setSelectedCompanyState(null);
          setError("Impossible de charger les compagnies.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [fixedCompanyId, isSuperAdmin]);

  function setSelectedCompany(c: Company) {
    if (!isSuperAdmin) return; // locked for non-super_admin
    setSelectedCompanyState(c);
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedCompanyId", String(c.id));
    }
  }

  return (
    <CompanyContext.Provider value={{ companies, selectedCompany, setSelectedCompany, loading, isSuperAdmin, error }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);
