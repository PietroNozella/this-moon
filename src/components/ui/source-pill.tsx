const sourceLabels: Record<string, string> = {
  music: "Musica",
  video: "Video",
  game: "Jogo",
  programming: "Programacao",
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
    <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
      <span className="shrink-0 font-medium">{label}</span>
      {title ? <span className="truncate text-slate-400">- {title}</span> : null}
      {timestamp ? <span className="shrink-0 text-slate-400">- {timestamp}</span> : null}
    </span>
  );
}