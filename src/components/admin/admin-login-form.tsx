"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import { loginAdminAction } from "@/lib/admin-actions";
import type { Locale } from "@/types/cms";

type Copy = {
  email: string;
  password: string;
  submit: string;
};

export function AdminLoginForm({ locale, copy }: { locale: Locale; copy: Copy }) {
  const [show, setShow] = useState(false);

  return (
    <form action={loginAdminAction} className="admin-login-form space-y-5">
      <input type="hidden" name="locale" value={locale} />

      <label className="admin-field">
        <span className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-foreground-soft" aria-hidden />
          {copy.email}
        </span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          defaultValue="mohammad.alfarras@gmail.com"
          required
          className="admin-input-lg"
        />
      </label>

      <label className="admin-field">
        <span className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-foreground-soft" aria-hidden />
          {copy.password}
        </span>
        <div className="relative">
          <input
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            className="admin-input-lg pe-12"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute end-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-foreground-muted transition hover:bg-white/8 hover:text-foreground"
            aria-label={show ? (locale === "ar" ? "إخفاء كلمة المرور" : "Hide password") : locale === "ar" ? "إظهار كلمة المرور" : "Show password"}
          >
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </label>

      <button type="submit" className="button-primary-shell min-h-14 w-full justify-center text-base font-bold">
        {copy.submit}
      </button>
    </form>
  );
}
