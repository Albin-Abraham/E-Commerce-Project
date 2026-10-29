# 🔥 Loading System

A lightweight, scalable UI loading handling system built using GoF patterns:

- Singleton (Event Bus)
- Observer (UI subscriptions)
- Factory (Context creation)

## Why use it?

✔ Centralized loading state  
✔ Avoids prop drilling & local flags  
✔ Works with Pages, Forms, Modals, Buttons  
✔ Extensible & testable  
✔ Minimal API → no overengineering

---

## Creating a Loader

```ts
import { LoaderFactory, UIScope } from "@/core/loading";

const loginLoader = LoaderFactory.create("LOGIN_FORM", UIScope.Form);
```
