import { CaptureForm } from "@/components/forms/capture-form";

export default function CapturePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-candy-blue-700">Captura</p>
        <h1 className="text-3xl font-semibold tracking-normal text-onyx">
          Nova frase
        </h1>
      </div>

      <CaptureForm />
    </div>
  );
}
