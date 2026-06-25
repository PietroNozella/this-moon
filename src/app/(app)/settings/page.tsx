"use client";

import { useRef, useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useLocalStore } from "@/components/local-store-provider";

export default function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { state, exportData, importData, resetData } = useLocalStore();
  const [message, setMessage] = useState("");

  function handleExport() {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `chunkflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Backup exportado.");
  }

  function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        importData(String(reader.result ?? ""));
        setMessage("Backup importado com sucesso.");
      } catch {
        setMessage("Nao foi possivel importar esse arquivo.");
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  }

  async function handleReset() {
    const confirmed = window.confirm(
      "Isso apaga todos os dados locais deste navegador. Continuar?",
    );

    if (!confirmed) {
      return;
    }

    await resetData();
    setMessage("Dados locais apagados.");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-emerald-700">Settings</p>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          Dados locais e backup
        </h1>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Modo local</CardTitle>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p>O app nao usa login, banco de dados ou backend.</p>
            <p>Os dados ficam no IndexedDB deste navegador.</p>
            <p>Para trocar de dispositivo, exporte e importe um backup JSON.</p>
          </div>
        </Card>

        <Card>
          <CardTitle>Resumo</CardTitle>
          <div className="mt-4 grid gap-3 text-sm text-slate-600">
            <p>Frases: {state.entries.length}</p>
            <p>Chunks: {state.chunks.length}</p>
            <p>Frases proprias: {state.personalSentences.length}</p>
            <p>Revisoes: {state.reviews.length}</p>
          </div>
        </Card>
      </section>

      <Card className="space-y-4">
        <CardTitle>Backup</CardTitle>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={handleExport}>
            Exportar JSON
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            Importar JSON
          </Button>
          <Button type="button" variant="danger" onClick={handleReset}>
            Limpar dados
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImport}
        />
        {message ? <p className="text-sm text-slate-500">{message}</p> : null}
      </Card>
    </div>
  );
}
