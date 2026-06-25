"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const result =
        mode === "signin"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: { data: { name: String(formData.get("name") ?? "") } },
            });

      if (result.error) {
        setError(
          result.error.message === "Invalid login credentials"
            ? "Email ou senha incorretos."
            : result.error.message,
        );
        return;
      }

      if (mode === "signup") {
        setMode("signin");
        setError("Conta criada! Faça login.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-6xl">
        <div className="grid gap-8 md:grid-cols-[1fr_400px] md:items-center">
          <section className="hidden md:block">
            <p className="text-xs font-semibold uppercase tracking-wider text-candy-blue-700">
              ChunkFlow
            </p>
            <h1 className="mt-3 max-w-xl text-5xl font-semibold tracking-tight text-slate-950">
              Inglês falável a partir das frases que você já encontra.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">
              Pequenos trechos. Frases reais. Prática todos os dias.
            </p>
          </section>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            <p className="text-base font-semibold text-slate-900 md:hidden">
              ChunkFlow
            </p>
            <p className="mt-1 text-sm text-slate-500 md:hidden">
              Continue sua prática diária de inglês.
            </p>
            <h2 className="hidden text-xl font-semibold text-slate-900 md:block">
              {mode === "signin" ? "Entrar" : "Criar conta"}
            </h2>
            <p className="mt-1 hidden text-sm text-slate-500 md:block">
              {mode === "signin"
                ? "Continue sua prática diária de inglês."
                : "Crie sua conta e comece hoje."}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === "signup" ? (
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" name="name" required />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" name="password" type="password" minLength={6} required />
              </div>

              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              <Button type="submit" className="w-full" size="lg" disabled={pending}>
                {pending
                  ? "Aguarde..."
                  : mode === "signin"
                    ? "Entrar"
                    : "Criar conta"}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              {mode === "signin" ? (
                <>
                  Não tem conta?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="font-medium text-candy-blue-700 hover:underline"
                  >
                    Criar conta
                  </button>
                </>
              ) : (
                <>
                  Já tem conta?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className="font-medium text-candy-blue-700 hover:underline"
                  >
                    Fazer login
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
