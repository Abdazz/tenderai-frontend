"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Company = {
  id: number;
  name: string;
  slug: string;
  active: boolean;
};

type Country = { id: number; name: string; code: string };
type Subscription = { country_id: number; enabled: boolean };

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    fetch("/api/proxy/companies")
      .then((r) => r.json())
      .then((data) => setCompanies(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  async function toggleActive(company: Company) {
    await fetch(`/api/proxy/companies/${company.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !company.active }),
    });
    setCompanies((prev) =>
      prev.map((c) => (c.id === company.id ? { ...c, active: !c.active } : c))
    );
  }

  async function expandSubscriptions(company: Company) {
    if (expandedId === company.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(company.id);
    const [countriesRes, subsRes] = await Promise.all([
      fetch("/api/proxy/countries"),
      fetch(`/api/proxy/companies/${company.id}/countries`),
    ]);
    setAllCountries(countriesRes.ok ? await countriesRes.json() : []);
    setSubscriptions(subsRes.ok ? await subsRes.json() : []);
  }

  async function toggleSubscription(companyId: number, countryId: number, currentlyEnabled: boolean) {
    if (currentlyEnabled) {
      await fetch(`/api/proxy/companies/${companyId}/countries/${countryId}`, { method: "DELETE" });
    } else {
      await fetch(`/api/proxy/companies/${companyId}/countries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country_id: countryId }),
      });
    }
    const subsRes = await fetch(`/api/proxy/companies/${companyId}/countries`);
    setSubscriptions(subsRes.ok ? await subsRes.json() : []);
  }

  if (loading) return <p className="text-slate-500">Chargement...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Compagnies</h1>
        <Link
          href="/companies/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
        >
          Ajouter une compagnie
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Nom</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <>
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono">{c.slug}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {c.active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => expandSubscriptions(c)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Pays abonnés
                    </button>
                    <button
                      onClick={() => toggleActive(c)}
                      className="text-xs text-slate-500 hover:text-slate-700 underline"
                    >
                      {c.active ? "Désactiver" : "Activer"}
                    </button>
                  </td>
                </tr>
                {expandedId === c.id && (
                  <tr key={`${c.id}-subs`} className="bg-slate-50">
                    <td colSpan={4} className="px-4 py-3">
                      <div className="flex flex-wrap gap-3">
                        {allCountries.map((country) => {
                          const sub = subscriptions.find((s) => s.country_id === country.id);
                          const enabled = sub?.enabled ?? false;
                          return (
                            <label key={country.id} className="flex items-center gap-1.5 text-xs">
                              <input
                                type="checkbox"
                                checked={enabled}
                                onChange={() => toggleSubscription(c.id, country.id, enabled)}
                                className="h-3.5 w-3.5 rounded border-input"
                              />
                              {country.name} ({country.code})
                            </label>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Aucune compagnie configurée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
