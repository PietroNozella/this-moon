"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { Card, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({
    entries: 0,
    chunks: 0,
    sentences: 0,
    reviews: 0,
  });

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const [
        { count: entries },
        { count: chunks },
        { count: sentences },
        { count: reviews },
      ] = await Promise.all([
        supabase
          .from("learning_entries")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("chunks")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("personal_sentences")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("reviews")
          .select("*", { count: "exact", head: true }),
      ]);

      setCounts({
        entries: entries ?? 0,
        chunks: chunks ?? 0,
        sentences: sentences ?? 0,
        reviews: reviews ?? 0,
      });
    }

    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-emerald-700">Configurações</p>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          Conta e dados
        </h1>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Conta</CardTitle>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p>Email: {user?.email ?? "-"}</p>
            <p>ID: {user?.id ?? "-"}</p>
            <p className="text-xs text-slate-400">
              Gerenciamento de conta pelo Supabase Auth.
            </p>
          </div>
        </Card>

        <Card>
          <CardTitle>Resumo</CardTitle>
          <div className="mt-4 grid gap-3 text-sm text-slate-600">
            <p>Frases: {counts.entries}</p>
            <p>Chunks: {counts.chunks}</p>
            <p>Frases próprias: {counts.sentences}</p>
            <p>Revisões: {counts.reviews}</p>
          </div>
        </Card>
      </section>
    </div>
  );
}
