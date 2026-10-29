import { useEffect, useRef } from "react";

import type { IFormCore } from "@form-core/form-interface";

export type FormMiddlewareFn = (context: {
  form: any;
  fieldId?: string;
}) => void | Promise<void>;

export function useFormMiddleware(
  form: IFormCore<any>,
  middleware?: Array<FormMiddlewareFn>
) {
  const middlewareRef = useRef(new Set<FormMiddlewareFn>());

  useEffect(() => {
    if (middleware && Array.isArray(middleware)) {
      const registered = middlewareRef.current;
      for (const fn of middleware) {
        if (!registered.has(fn)) {
          form.use(fn);
          registered.add(fn);
        }
      }
    }
  }, [middleware, form]);
}
