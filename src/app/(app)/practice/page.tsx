import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

const modes = [
  {
    title: "Speaking",
    description: "Repita frases salvas e marque o que saiu natural.",
    href: "/review",
  },
  {
    title: "Listening",
    description: "Use trechos curtos e capture palavras reconhecidas.",
    href: "/capture",
  },
  {
    title: "Roleplay",
    description: "Responda cenários simples de rotina, jogos e código.",
    href: "/library",
  },
];

export default function PracticePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-emerald-700">Prática</p>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          Prática ativa
        </h1>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {modes.map((mode) => (
          <Card key={mode.title}>
            <CardTitle>{mode.title}</CardTitle>
            <p className="mt-2 min-h-16 text-sm leading-6 text-slate-500">
              {mode.description}
            </p>
            <ButtonLink href={mode.href} className="mt-5" variant="secondary">
              Começar
            </ButtonLink>
          </Card>
        ))}
      </section>
    </div>
  );
}
