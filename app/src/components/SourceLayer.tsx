"use client";
import { useEffect, useRef, type ReactNode } from "react";
/** Native top layer keeps sources usable above existing record/profile dialogs. */
export default function SourceLayer({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="overlay source-layer"
      aria-label="Original source"
      onCancel={onClose}
      onClose={onClose}
    >
      {children}
    </dialog>
  );
}
