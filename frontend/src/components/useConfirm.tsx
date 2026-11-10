import { useCallback, useState } from "react";
import { ConfirmModal } from "./ConfirmModal";

type Options = {
  title: string;
  message: string;
  confirmLabel?: string;
};

// Works like window.confirm, but shows a ConfirmModal:
//   const { confirm, modal } = useConfirm();
//   if (!(await confirm({ title: "...", message: "..." }))) return;
// The component must render {modal} somewhere. confirm() resolves to true or false.
export function useConfirm() {
  // The open request. It keeps the function that settles the promise returned by confirm().
  const [request, setRequest] = useState<(Options & { settle: (confirmed: boolean) => void }) | null>(null);

  const confirm = useCallback(
    (options: Options) => new Promise<boolean>((resolve) => setRequest({ ...options, settle: resolve })),
    [],
  );

  function close(confirmed: boolean) {
    request?.settle(confirmed);
    setRequest(null);
  }

  const modal = request && (
    <ConfirmModal
      title={request.title}
      message={request.message}
      confirmLabel={request.confirmLabel}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  );

  return { confirm, modal };
}
