"use client";

import { useEffect, useState } from "react";
import { useCountry } from "@/contexts/country-context";
import { useCompany } from "@/contexts/company-context";
import { SettingsClient } from "./settings-client";

export default function SettingsPage() {
  const { selectedCountry, loading: countryLoading } = useCountry();
  const { selectedCompany, loading: companyLoading } = useCompany();
  const [settings, setSettings] = useState<{ sections: Record<string, Record<string, unknown>>; readonly: Record<string, unknown> }>({ sections: {}, readonly: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (countryLoading || companyLoading) return;

    setLoading(true);
    const baseUrl = selectedCountry
      ? `/api/proxy/countries/${selectedCountry.id}/settings`
      : "/api/proxy/settings";

    const fetches: Promise<void>[] = [
      fetch(baseUrl)
        .then((r) => (r.ok ? r.json() : null))
        .then((body) => {
          if (body === null) return;
          if (selectedCountry) {
            setSettings((prev) => ({ sections: { ...prev.sections, ...body }, readonly: prev.readonly }));
          } else {
            setSettings((prev) => ({
              sections: { ...prev.sections, ...(body.sections ?? {}) },
              readonly: body.readonly ?? {},
            }));
          }
        }),
    ];

    if (selectedCompany) {
      fetches.push(
        fetch(`/api/proxy/companies/${selectedCompany.id}/settings`)
          .then((r) => (r.ok ? r.json() : null))
          .then((body) => {
            if (body === null) return;
            // Company settings only cover classification/scheduler/email —
            // merge those keys over the country/global values so the 3
            // company-scoped tabs show company data while the other 5
            // (pipeline/llm/rag/prompts) keep showing country/global data.
            setSettings((prev) => ({ sections: { ...prev.sections, ...body }, readonly: prev.readonly }));
          })
      );
    }

    Promise.all(fetches)
      .catch(() => setSettings({ sections: {}, readonly: {} }))
      .finally(() => setLoading(false));
  }, [selectedCountry?.id, countryLoading, selectedCompany?.id, companyLoading]);

  if (loading || countryLoading || companyLoading) return <p className="text-slate-500">Chargement...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Paramètres</h1>
        {selectedCountry && (
          <span className="text-sm text-slate-500">
            Pays: <span className="font-medium text-slate-700">{selectedCountry.name}</span>
          </span>
        )}
      </div>
      <SettingsClient
        sections={settings.sections}
        readonly={settings.readonly}
        countryId={selectedCountry?.id}
        companyId={selectedCompany?.id}
      />
    </div>
  );
}
