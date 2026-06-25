import Link from "next/link";

type Props = {
  phrase: string | null;
};

export function RecentActivity({ phrase }: Props) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/[0.02]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            Atividade recente
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Últimos itens salvos ou praticados.
          </p>
        </div>
        <Link
          href="/library"
          className="text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          Ver biblioteca
        </Link>
      </div>

      {phrase ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <span className="inline-flex rounded-full bg-candy-blue-500/25 px-2.5 py-1 text-xs font-medium text-candy-blue-950">
            Último chunk
          </span>
          <p className="mt-3 text-base font-medium text-slate-950">
            {phrase}
          </p>
          <p className="mt-1 text-sm text-slate-500">Capturado hoje</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-500">
            Nenhuma atividade ainda.
          </p>
          <Link
            href="/capture"
            className="mt-2 inline-block text-sm font-medium text-candy-blue-700 hover:underline"
          >
            Capture seu primeiro chunk
          </Link>
        </div>
      )}
    </div>
  );
}
