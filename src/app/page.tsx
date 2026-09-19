"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BrandLogo } from "@/components/BrandLogo";
import { ArrowRight, Lock, User, KeyRound, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, isLoading: authLoading } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, push to Hub
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/hub");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Por favor, preencha o Identificador (Username).");
      return;
    }
    if (!password) {
      setError("Por favor, preencha a Chave de Acesso (Password).");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await login(username.trim(), password);
      router.push("/hub");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha na autenticação.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#08090C] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-500 tracking-widest uppercase">
            Iniciando Subsistemas...
          </span>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#08090C] text-[#E0E6ED] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle orbital background lines */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
        <div className="w-[600px] h-[600px] rounded-full border border-sky-500/20 border-dashed animate-[spin_120s_linear_infinite]" />
        <div className="absolute w-[900px] h-[900px] rounded-full border border-indigo-500/15 border-dotted" />
      </div>

      {/* Main Glass Login Card */}
      <div className="relative z-10 w-full max-w-md bg-[#0E1118]/80 border border-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl shadow-sky-950/40">
        {/* Brand Typography Logo */}
        <div className="mb-8">
          <BrandLogo size="lg" showSubtitle={true} />
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-mono flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Frictionless Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">
              Identificador (Username)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Seu nome ou callsign"
                autoComplete="username"
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/70 focus:ring-1 focus:ring-sky-500/40 text-sm font-sans transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">
              Chave de Acesso (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha secreta"
                autoComplete="current-password"
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500/70 focus:ring-1 focus:ring-sky-500/40 text-sm font-sans transition-all"
                required
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full group flex items-center justify-center gap-2.5 py-3.5 px-6 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all font-mono disabled:opacity-50"
            >
              <span>{isSubmitting ? "Autenticando..." : "Entrar no Sistema"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>

        {/* Frictionless Explanatory Notice */}
        <div className="mt-6 pt-5 border-t border-white/5 flex items-start gap-2.5 text-slate-500">
          <Sparkles className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] font-mono leading-relaxed">
            <strong className="text-slate-400 font-semibold">Acesso sem atrito:</strong> Se você já possui cadastro, sua chave será validada. Se for o seu primeiro acesso com este identificador, sua conta será criada automaticamente no banco de dados.
          </p>
        </div>
      </div>

      {/* Footer minimal info */}
      <footer className="mt-8 text-center text-[11px] font-mono text-slate-600">
        SSSystem • RPG de Estratégia e Macro-Gestão Espacial
      </footer>
    </main>
  );
}
