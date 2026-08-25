"use client";

import { Check, Pencil, Plug, Plus, Trash2, X } from "lucide-react";
import { ImagePicker } from "@/components/image-picker";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  createCharger,
  deleteCharger,
  updateCharger,
} from "@/app/admin/actions";
import {
  Button,
  Card,
  Field,
  Notice,
  StockBadge,
  inputClass,
  inputErrorClass,
} from "@/components/ui";
import { formatMoney } from "@/lib/money";
import type { ActionResult, ChargerView } from "@/lib/types";

type FieldErrors = Record<string, string> | undefined;

function fieldClass(error?: string) {
  return error ? inputErrorClass : inputClass;
}

function ChargerFields({
  charger,
  errors,
}: {
  charger?: ChargerView;
  errors: FieldErrors;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="Name" error={errors?.name}>
          <input
            name="name"
            defaultValue={charger?.name ?? ""}
            placeholder="VoltSupply 65W USB-C GaN"
            className={fieldClass(errors?.name)}
            required
          />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="Description" error={errors?.description}>
          <textarea
            name="description"
            defaultValue={charger?.description ?? ""}
            placeholder="Wattage, connector type, cable length, what it fits…"
            className={`${fieldClass(errors?.description)} min-h-24 resize-y`}
            required
          />
        </Field>
      </div>

      <Field label="Price (PKR)" error={errors?.price}>
        <input
          name="price"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={charger?.price ?? ""}
          placeholder="59.00"
          className={fieldClass(errors?.price)}
          required
        />
      </Field>

      <Field label="Discount (%)" error={errors?.discount}>
        <input
          name="discount"
          type="number"
          step="0.01"
          min="0"
          max="100"
          defaultValue={charger?.discount ?? 0}
          className={fieldClass(errors?.discount)}
        />
      </Field>

      <Field
        label="Stock"
        hint="Pieces available. Shown to customers on the storefront."
        error={errors?.stock}
      >
        <input
          name="stock"
          type="number"
          step="1"
          min="0"
          defaultValue={charger?.stock ?? 0}
          className={fieldClass(errors?.stock)}
        />
      </Field>

      <div className="sm:col-span-2">
        <ImagePicker currentSrc={charger?.imageSrc} error={errors?.imageFile} />
      </div>

      <label className="flex items-center gap-3 sm:col-span-2">
        <input
          type="checkbox"
          name="isAvailable"
          defaultChecked={charger?.isAvailable ?? true}
          className="h-4 w-4 accent-[#2563eb]"
        />
        <span className="text-sm text-muted">Listed on the storefront</span>
      </label>
    </div>
  );
}

export function ChargerCreateForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    createCharger,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the form once a charger is created so the next one starts blank.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <Card className="p-6">
      <form ref={formRef} action={formAction}>
        <ChargerFields errors={state?.fieldErrors} />
        <Notice result={state} />
        <Button type="submit" size="lg" disabled={pending} className="mt-6">
          <Plus className="h-[18px] w-[18px]" />
          {pending ? "Adding…" : "Add to catalogue"}
        </Button>
      </form>
    </Card>
  );
}

function DeleteButton({ chargerId }: { chargerId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    deleteCharger,
    null,
  );
  const [confirming, setConfirming] = useState(false);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={chargerId} />
      {confirming ? (
        <>
          {/* The server also requires this, so an unconfirmed POST is inert. */}
          <input type="hidden" name="confirm" value="yes" />
          <Button type="submit" variant="danger" size="sm" disabled={pending}>
            <Check className="h-4 w-4" />
            {pending ? "Deleting…" : "Confirm"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirming(false)}
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setConfirming(true)}
          className="hover:!bg-danger-soft hover:!text-danger"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      )}
      {state?.message ? (
        <span
          className={`text-sm ${state.ok ? "text-success" : "text-danger"}`}
        >
          {state.message}
        </span>
      ) : null}
    </form>
  );
}

export function ChargerEditor({ charger }: { charger: ChargerView }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    updateCharger,
    null,
  );
  const [open, setOpen] = useState(false);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start gap-4 p-5">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-canvas">
          {charger.imageSrc ? (
            // Uploads are served from our own route; legacy rows may still hold
            // an external URL, so neither goes through the Image optimiser.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={charger.imageSrc}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <Plug className="h-6 w-6 text-subtle" strokeWidth={1.5} />
          )}
        </span>

        <div className="min-w-48 flex-1">
          <h3 className="font-semibold tracking-[-0.01em]">{charger.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted">
            {charger.description}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <StockBadge stock={charger.stock} isAvailable={charger.isAvailable} />
            {charger.discount > 0 ? (
              <span className="rounded-full border border-danger/30 bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger">
                {charger.discount}% off
              </span>
            ) : null}
          </div>
        </div>

        <div className="text-right">
          <p className="text-xl font-bold tracking-[-0.02em]">
            {formatMoney(charger.finalPrice)}
          </p>
          {charger.discount > 0 ? (
            <p className="mt-0.5 text-sm text-subtle line-through">
              {formatMoney(charger.price)}
            </p>
          ) : null}
          <p className="mt-1 text-sm text-muted">
            <span className="font-semibold text-ink">{charger.stock}</span> pcs
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line bg-canvas px-5 py-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {open ? "Close" : "Edit"}
        </Button>
        <DeleteButton chargerId={charger.id} />
      </div>

      {open ? (
        <form action={formAction} className="border-t border-line p-5">
          <input type="hidden" name="id" value={charger.id} />
          <ChargerFields charger={charger} errors={state?.fieldErrors} />
          <Notice result={state} />
          <Button type="submit" disabled={pending} className="mt-5">
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      ) : null}
    </Card>
  );
}
