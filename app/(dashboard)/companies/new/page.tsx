"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCompanyPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", slug: "", logo_url: "", subject_prefix: "", signature: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.slug) {
      setError("Nom et slug sont requis.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: form.name,
        slug: form.slug,
        logo_url: form.logo_url || null,
        subject_prefix: form.subject_prefix || null,
        signature: form.signature || null,
      };
      const resp = await fetch("/api/proxy/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const data = await resp.json();
        setError(data.detail ?? "Erreur lors de la création.");
        return;
      }
      router.push("/companies");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Nouvelle compagnie</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="ex. Acme Corp"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="ex. acme-corp"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Préfixe sujet email (optionnel)</label>
          <input
            type="text"
            value={form.subject_prefix}
            onChange={(e) => setForm({ ...form, subject_prefix: e.target.value })}
            placeholder="ex. [ACME]"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Signature email (optionnel)</label>
          <input
            type="text"
            value={form.signature}
            onChange={(e) => setForm({ ...form, signature: e.target.value })}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Création..." : "Créer la compagnie"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/companies")}
            className="px-4 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-100"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
