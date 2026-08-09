import Swal, { SweetAlertIcon } from "sweetalert2";

/**
 * Wrapper SweetAlert2 dengan tema FormGua (mengikuti design tokens).
 * Otomatis menyesuaikan light/dark mode lewat CSS variables.
 */

const baseCustomClass = {
  popup: "swal-fg-popup",
  title: "swal-fg-title",
  htmlContainer: "swal-fg-html",
  confirmButton: "swal-fg-confirm",
  cancelButton: "swal-fg-cancel",
  actions: "swal-fg-actions",
  icon: "swal-fg-icon",
  timerProgressBar: "swal-fg-timer",
};

interface SwalOpts {
  title: string;
  text?: string;
  icon?: SweetAlertIcon;
  timer?: number;
}

function fire({ title, text, icon = "info", timer }: SwalOpts) {
  return Swal.fire({
    title,
    text,
    icon,
    timer: timer ?? (icon === "success" ? 1800 : icon === "error" ? 2400 : undefined),
    timerProgressBar: !!timer || icon === "success" || icon === "error",
    showConfirmButton: !(icon === "success" || icon === "error"),
    confirmButtonText: "Oke",
    customClass: baseCustomClass,
    buttonsStyling: false,
    background: "hsl(var(--background))",
    color: "hsl(var(--foreground))",
    showClass: { popup: "swal2-show animate-in fade-in zoom-in-95 duration-200" },
    hideClass: { popup: "swal2-hide animate-out fade-out zoom-out-95 duration-150" },
  });
}

export const popup = {
  success: (title: string, text?: string) => fire({ title, text, icon: "success" }),
  error: (title: string, text?: string) => fire({ title, text, icon: "error" }),
  info: (title: string, text?: string) => fire({ title, text, icon: "info" }),
  warning: (title: string, text?: string) => fire({ title, text, icon: "warning" }),
  question: (title: string, text?: string) => fire({ title, text, icon: "question" }),

  confirm: async (opts: {
    title: string;
    text?: string;
    confirmText?: string;
    cancelText?: string;
    icon?: SweetAlertIcon;
    danger?: boolean;
  }) => {
    const result = await Swal.fire({
      title: opts.title,
      text: opts.text,
      icon: opts.icon ?? (opts.danger ? "warning" : "question"),
      showCancelButton: true,
      confirmButtonText: opts.confirmText ?? "Ya, lanjutkan",
      cancelButtonText: opts.cancelText ?? "Batal",
      reverseButtons: true,
      customClass: {
        ...baseCustomClass,
        confirmButton: opts.danger ? "swal-fg-confirm swal-fg-danger" : "swal-fg-confirm",
      },
      buttonsStyling: false,
      background: "hsl(var(--background))",
      color: "hsl(var(--foreground))",
    });
    return result.isConfirmed;
  },

  toastTopRight: (title: string, icon: SweetAlertIcon = "success") =>
    Swal.fire({
      toast: true,
      position: "top-end",
      icon,
      title,
      showConfirmButton: false,
      timer: 2200,
      timerProgressBar: true,
      customClass: baseCustomClass,
      background: "hsl(var(--background))",
      color: "hsl(var(--foreground))",
    }),
};

export default popup;
