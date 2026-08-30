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

    let cancelled = false;
    setLoading(true);

    async function loadSettings() {
      const baseUrl = selectedCountry
        ? `/api/proxy/countries/${selectedCountry!.id}/settings`
        : "/api/proxy/settings";

      try {
        const baseRes = await fetch(baseUrl);
        const baseBody = baseRes.ok ? await baseRes.json() : null;
        if (cancelled) return;

        let sections: Record<string, Record<string, unknown>>;
        let readonly: Record<string, unknown>;
        if (baseBody === null) {
          sections = {};
          readonly = {};
        } else if (selectedCountry) {
          sections = baseBody;
          readonly = {};
        } else {
          sections = baseBody.sections ?? {};
          readonly = baseBody.readonly ?? {};
        }

        if (selectedCompany) {
          const companyRes = await fetch(`/api/proxy/companies/${selectedCompany.id}/settings`);
          const companyBody = companyRes.ok ? await companyRes.json() : null;
          if (cancelled) return;
          if (companyBody !== null) {
            // Company settings only cover classification/scheduler/email —
            // merge those keys over the country/global values so the 3
            // company-scoped tabs show company data while the other 5
            // (pipeline/llm/rag/prompts) keep showing country/global data.
            // This overlay is applied strictly after the base bundle above,
            // so response ordering between the two fetches can't matter.
            sections = { ...sections, ...companyBody };
          }
        }

        if (!cancelled) setSettings({ sections, readonly });
      } catch {
        if (!cancelled) setSettings({ sections: {}, readonly: {} });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSettings();
    return () => { cancelled = true; };
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
