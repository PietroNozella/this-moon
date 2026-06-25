"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label } from "@/components/ui/form";
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
    <main className="grid min-h-dvh place-items-center bg-slate-50 px-4 py-8">
      <div className="grid w-full max-w-5xl gap-8 md:grid-cols-[1fr_420px] md:items-center">
        <section>
          <p className="text-sm font-semibold uppercase text-emerald-700">
            ChunkFlow
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-normal text-slate-950 md:text-5xl">
            Ingles falavel a partir das frases que voce ja encontra.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">
            Capture frases reais, extraia chunks e pratique com repeticão
            espacada. Seus dados ficam salvos no Supabase.
          </p>
        </section>

        <Card className="space-y-5">
          <CardTitle>
            {mode === "signin" ? "Entrar" : "Criar conta"}
          </CardTitle>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" ? (
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" placeholder="Seu nome" required />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="voce@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Minimo 6 caracteres"
                minLength={6}
                required
              />
            </div>

            {error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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

          <p className="text-sm text-slate-500">
            {mode === "signin" ? (
              <>
                Não tem conta?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="font-medium text-emerald-700 hover:underline"
                >
                  Criar conta
                </button>
              </>
            ) : (
              <>
                Ja tem conta?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="font-medium text-emerald-700 hover:underline"
                >
                  Fazer login
                </button>
              </>
            )}
          </p>
        </Card>
      </div>
    </main>
  );
}
