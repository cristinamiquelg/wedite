"use client";

import { useEffect, useRef } from "react";

// Stripe's embedded payment form (beta). Stripe.js has to be loaded from
// js.stripe.com (never bundled), and the versioned URL below is the one that
// ships initCheckoutFormSdk.
const STRIPE_JS_URL = "https://js.stripe.com/dahlia/stripe.js";

type StripeForm = { mount(target: string | HTMLElement): void; on(event: string, handler: (e: unknown) => void): void; destroy?: () => void };
type StripeCheckout = {
  createForm(options: { layout: string }): StripeForm;
  loadActions(): Promise<{ type?: string; actions?: StripeActions } & Partial<StripeActions>>;
};
type StripeActions = { confirm(options: { formConfirmEvent: unknown }): Promise<{ type?: string; error?: unknown } | void> };
type StripeInstance = {
  initCheckoutFormSdk(options: { clientSecret: string; appearance: unknown }): StripeCheckout;
};
type StripeFactory = (publishableKey: string, options: { betas: string[] }) => StripeInstance;

let loading: Promise<StripeFactory> | null = null;

function loadStripeJs(): Promise<StripeFactory> {
  const existing = (window as unknown as { Stripe?: StripeFactory }).Stripe;
  if (existing) return Promise.resolve(existing);
  loading ??= new Promise<StripeFactory>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = STRIPE_JS_URL;
    script.async = true;
    script.onload = () => {
      const factory = (window as unknown as { Stripe?: StripeFactory }).Stripe;
      if (factory) resolve(factory);
      else reject(new Error("Stripe.js did not load"));
    };
    script.onerror = () => {
      loading = null;
      reject(new Error("Stripe.js failed to load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

const appearance = {
  theme: "flat",
  labels: "auto",
  inputs: "spaced",
  variables: {
    borderRadius: "4px",
    colorBackground: "#ffffff",
    colorDanger: "#df1b41",
    colorPrimary: "#b5583a",
    colorSuccess: "#5f6b4f",
    colorText: "#211d1a",
    fontFamily: "Inter",
    fontSizeBase: "16px",
    spacingUnit: "4px",
  },
};

export default function StripeEmbeddedForm({
  clientSecret,
  publishableKey,
  onError,
}: {
  clientSecret: string;
  publishableKey: string;
  onError: () => void;
}) {
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  });

  useEffect(() => {
    let cancelled = false;
    let form: StripeForm | null = null;
    (async () => {
      try {
        const Stripe = await loadStripeJs();
        if (cancelled) return;
        const stripe = Stripe(publishableKey, { betas: ["custom_checkout_payment_form_1"] });
        const checkout = stripe.initCheckoutFormSdk({ clientSecret, appearance });
        form = checkout.createForm({ layout: "expanded" });
        form.mount("#checkout-form");
        const loaded = await checkout.loadActions();
        const actions = (loaded.actions ?? loaded) as StripeActions;
        form.on("confirm", async (event) => {
          const result = await actions.confirm({ formConfirmEvent: event });
          if (result && (result as { type?: string }).type === "error") onErrorRef.current();
        });
      } catch (err) {
        console.error("stripe form failed", err);
        if (!cancelled) onErrorRef.current();
      }
    })();
    return () => {
      cancelled = true;
      form?.destroy?.();
    };
  }, [clientSecret, publishableKey]);

  return <div id="checkout-form" />;
}
