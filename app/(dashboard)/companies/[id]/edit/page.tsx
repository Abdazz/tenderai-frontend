"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CompanyForm = {
  name: string;
  slug: string;
  logo_url: string;
  subject_prefix: string;
  signature: string;
};

export default function EditCompanyPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [form, setForm] = useState<CompanyForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/proxy/companies/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) =>
        setForm({
          name: data.name ?? "",
          slug: data.slug ?? "",
          logo_url: data.logo_url ?? "",
          subject_prefix: data.subject_prefix ?? "",
          signature: data.signature ?? "",
        })
      )
      .catch(() => setError("Impossible de charger la compagnie."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!form.name) {
      setError("Le nom est requis.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: form.name,
        logo_url: form.logo_url || null,
        subject_prefix: form.subject_prefix || null,
        signature: form.signature || null,
      };
      const resp = await fetch(`/api/proxy/companies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const data = await resp.json();
        setError(data.detail ?? "Erreur lors de la sauvegarde.");
        return;
      }
      router.push("/companies");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-slate-500">Chargement...</p>;
  if (!form) return <p className="text-red-600 text-sm">{error ?? "Compagnie introuvable."}</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Modifier la compagnie</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
          <input
            type="text"
            value={form.slug}
            disabled
            className="w-full border border-slate-200 bg-slate-50 rounded-md px-3 py-2 text-sm font-mono text-slate-500 cursor-not-allowed"
          />
          <p className="text-xs text-slate-400 mt-1">Le slug ne peut pas être modifié après la création.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">URL du logo (optionnel)</label>
          <input
            type="text"
            value={form.logo_url}
            onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
            placeholder="https://..."
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
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
            {saving ? "Sauvegarde..." : "Enregistrer"}
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
