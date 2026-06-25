type Props = {
  phrase: string;
  translation?: string | null;
  naturalPhrase?: string | null;
};

export function PhraseBlock({ phrase, translation, naturalPhrase }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-2xl font-semibold leading-10 tracking-tight text-slate-950">
        {phrase}
      </p>
      {translation ? (
        <p className="mt-2 text-sm italic text-slate-500">{translation}</p>
      ) : null}
      {naturalPhrase ? (
        <p className="mt-2 text-sm text-slate-500">
          <span className="font-medium text-slate-600">Natural: </span>
          {naturalPhrase}
        </p>
      ) : null}
    </div>
  );
}
