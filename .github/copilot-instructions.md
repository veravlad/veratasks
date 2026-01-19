# GitHub Copilot Instructions for This Project

These instructions are **mandatory guidelines** for GitHub Copilot when generating or modifying code in this repository.  
Copilot must **read and follow these rules before providing any suggestions**.

---

## 🧩 Project Setup Rules

1. **TypeScript only**. Do not generate JavaScript.
2. Follow **strict typing**. Avoid `any` and `unknown` unless absolutely necessary.
3. All code and documentation must be in **English**.
4. **User-facing labels** can be in **Spanish**, but everything else is English.

---

## 📦 Libraries & Tools

- **date-fns** – All date handling.
- **react-hook-form** – Form state management.
- **Zod** + **zodResolver** – Form validation schemas.
- **Axios** – API requests.
- **React Query** – Server state management.
- **shadcn/ui** – UI components.
- **lucide-react** – Icons.

> Copilot must not suggest alternative libraries.

---

## 🧰 Project Structure Guidelines

- **Custom hooks:** `/hooks`  
  Examples: localStorage access, timers, media queries.

- **Reusable utils, types, constants:** `/utils`

- **Components:** Use **shadcn/ui**, never custom unstyled components unless required.

- **Icons:** Use **lucide-react** only.

---

## 🔒 Coding Rules

1. **No `console.log()`** left in the code.
2. Always use **JSDoc** for comments.
3. Do not bypass **React Query** for API calls.
4. Avoid generating code that uses unsafe practices.
5. Always use **date-fns** for date manipulation; do not use native `Date` methods directly.
6. Form validation must use **react-hook-form + zod**.
7. Write code for **reusability**: extract repeated logic into hooks or utils.

---

## ✅ Quality Assurance Rules

**MANDATORY:** After any code generation or modification, Copilot must:

1. **Always run `pnpm lint`** to check ESLint compliance.
2. **Always run `pnpm build`** or equivalent TypeScript compilation check.
3. **Fix ALL errors** before considering the task complete.
4. **Never leave TypeScript errors unresolved**.
5. **Never leave ESLint errors unresolved**.
6. **ESLint warnings can be ignored** - only errors need to be fixed.

### Validation Commands:
```bash
pnpm lint    # Must pass with 0 errors (warnings are acceptable)
pnpm build   # Must complete successfully
```

**Zero tolerance policy:** Any TypeScript or ESLint error must be immediately fixed. Warnings are acceptable and can be ignored.

---

## 📝 Examples

### Date formatting
```ts
import { format } from "date-fns";

/**
 * Formats a date into a readable string.
 * @param date - Date instance
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return format(date, "dd/MM/yyyy");
}
```


### Form validation

```ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

const form = useForm({ resolver: zodResolver(schema) });

```