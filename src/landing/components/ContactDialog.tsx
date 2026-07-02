import { type ReactNode, useState } from "react";
import { CheckCircle2, Loader2, Mail, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { generateBase62Id, setDocumentAtCollectionPath } from "@/lib/dataAccess";
import { CONTACT_EMAIL } from "../constants";
import { notifyContactRequestSlack } from "../submitContactRequest";

type ContactDialogProps = {
  children: ReactNode;
  /** Identifies which button/section triggered the request. */
  source?: string;
};

type Status = "idle" | "submitting" | "success" | "error";

function renderErrorMessage(message: string, email: string) {
  const parts = message.split(email);
  if (parts.length !== 2) {
    return message;
  }
  return (
    <>
      {parts[0]}
      <a href={`mailto:${email}`} className="underline underline-offset-2">
        {email}
      </a>
      {parts[1]}
    </>
  );
}

export function ContactDialog({ children, source = "landing" }: ContactDialogProps) {
  const { t } = useTranslation("landing");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [message, setMessage] = useState("");

  const resetForm = () => {
    setStatus("idle");
    setName("");
    setEmail("");
    setOrganization("");
    setMessage("");
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setTimeout(resetForm, 200);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        organization: organization.trim(),
        message: message.trim(),
        source,
      };

      await notifyContactRequestSlack(payload);

      try {
        const id = generateBase62Id();
        await setDocumentAtCollectionPath("utopia/general/contactRequests", id, {
          ...payload,
          status: "new",
          createdAt: Date.now(),
        });
      } catch (firestoreError) {
        console.error("Firestore backup failed:", firestoreError);
      }

      setStatus("success");
    } catch (error) {
      console.error("Failed to submit contact request:", error);
      setStatus("error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="landing-page max-w-lg gap-0 rounded-3xl border-0 bg-white p-0 shadow-2xl sm:rounded-3xl">
        {status === "success" ? (
          <div className="flex flex-col items-center px-8 py-12 text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--uu-accent)]/20">
              <CheckCircle2 className="h-7 w-7 text-[var(--uu-accent-dark)]" />
            </div>
            <DialogTitle className="landing-display mb-2 text-2xl font-medium text-[var(--uu-ink)]">
              {t("contact.successTitle")}
            </DialogTitle>
            <DialogDescription className="max-w-sm text-sm leading-relaxed text-[var(--uu-muted)]">
              {t("contact.successDescription")}
            </DialogDescription>
            <DialogClose className="landing-btn-primary mt-7 inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-medium text-white">
              {t("contact.close")}
            </DialogClose>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-8 pb-8 pt-8">
            <div className="mb-6">
              <DialogTitle className="landing-display mb-2 text-2xl font-medium text-[var(--uu-ink)]">
                {t("contact.title")}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-[var(--uu-muted)]">
                {t("contact.description")}
              </DialogDescription>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("contact.name")}>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    className={fieldClass}
                    placeholder={t("contact.namePlaceholder")}
                  />
                </Field>
                <Field label={t("contact.email")} required>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    className={fieldClass}
                    placeholder={t("contact.emailPlaceholder")}
                  />
                </Field>
              </div>

              <Field label={t("contact.organization")}>
                <input
                  type="text"
                  value={organization}
                  onChange={(event) => setOrganization(event.target.value)}
                  autoComplete="organization"
                  className={fieldClass}
                  placeholder={t("contact.organizationPlaceholder")}
                />
              </Field>

              <Field label={t("contact.message")} required>
                <textarea
                  required
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={4}
                  className={`${fieldClass} resize-none`}
                  placeholder={t("contact.messagePlaceholder")}
                />
              </Field>
            </div>

            {status === "error" && (
              <p className="mt-4 text-sm text-red-600">
                {renderErrorMessage(
                  t("contact.error", { email: CONTACT_EMAIL }),
                  CONTACT_EMAIL,
                )}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="landing-btn-accent group mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("contact.submitting")}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {t("contact.submit")}
                </>
              )}
            </button>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[var(--uu-muted)]">
              <Mail className="h-3.5 w-3.5" />
              {t("contact.orDirect")}{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="underline underline-offset-2 hover:text-[var(--uu-ink)]"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

const fieldClass =
  "w-full rounded-xl border border-[var(--uu-border)] bg-[var(--uu-surface)] px-4 py-3 text-sm text-[var(--uu-ink)] placeholder:text-[var(--uu-muted)]/60 transition-colors focus:border-[var(--uu-accent-dark)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--uu-accent)]/30";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--uu-muted)]">
        {label}
        {required && <span className="text-[var(--uu-accent-dark)]"> *</span>}
      </span>
      {children}
    </label>
  );
}
