const sourceLabels: Record<string, string> = {
  music: "Música",
  video: "Vídeo",
  game: "Jogo",
  programming: "Programação",
  conversation: "Conversa",
  social_media: "Social media",
  course: "Curso",
  book: "Livro",
  routine: "Rotina",
  other: "Outro",
};

type Props = {
  type: string;
  title?: string | null;
  timestamp?: string | null;
};

export function SourcePill({ type, title, timestamp }: Props) {
  const label = sourceLabels[type] ?? type;

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs text-slate-600">
      <span className="font-medium">{label}</span>
      {title ? <span className="text-slate-400">• {title}</span> : null}
      {timestamp ? (
        <span className="text-slate-400">• {timestamp}</span>
      ) : null}
    </span>
  );
}
