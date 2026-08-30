"use client";

import { useEffect, useState } from "react";
import { useCountry } from "@/contexts/country-context";
import { useCompany } from "@/contexts/company-context";
import { SettingsClient } from "./settings-client";

export default function SettingsPage() {
  const { selectedCountry, loading: countryLoading } = useCountry();
  const { selectedCompany, loading: companyLoading, error: companyError } = useCompany();
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
            // The company settings endpoint (get_all_with_fallback) returns
            // EVERY global section — seed_from_global copies all of
            // AppSettings into CompanySettings at company creation time, not
            // just the sections a company can actually edit. Only
            // classification/scheduler/email are meant to be company-scoped
            // in this UI; whitelist the merge so Pipeline/LLM/RAG/Prompts
            // keep showing country/global data untouched instead of being
            // silently overwritten with global values from the company bundle.
            const COMPANY_SCOPED_SECTIONS = ["classification", "scheduler", "email"] as const;
            for (const key of COMPANY_SCOPED_SECTIONS) {
              if (companyBody[key]) sections[key] = companyBody[key];
            }
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

  if (companyError) {
    return <p className="text-red-600 text-sm">{companyError}</p>;
  }

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
