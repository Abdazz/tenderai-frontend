"use client";

import { useCompany } from "@/contexts/company-context";

export function CompanySelector() {
  const { companies, selectedCompany, setSelectedCompany, loading } = useCompany();

  if (loading || companies.length === 0) return null;

  if (companies.length === 1) {
    return (
      <div className="px-4 py-3 border-t border-slate-700">
        <p className="text-xs text-slate-500 mb-1">Compagnie</p>
        <p className="text-sm text-slate-200 font-medium truncate">{companies[0].name}</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-t border-slate-700">
      <p className="text-xs text-slate-500 mb-1">Compagnie</p>
      <select
        value={selectedCompany?.id ?? ""}
        onChange={(e) => {
          const c = companies.find((c) => c.id === Number(e.target.value));
          if (c) setSelectedCompany(c);
        }}
        className="w-full text-sm bg-slate-800 text-slate-100 border border-slate-600 rounded px-2 py-1.5 focus:outline-none focus:border-slate-400 cursor-pointer"
        aria-label="Sélectionner une compagnie"
      >
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
