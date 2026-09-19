"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getCampaign } from "@/lib/db";

export default function CampaignRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }

    if (user && resolvedParams.id) {
      getCampaign(resolvedParams.id).then((camp) => {
        if (!camp) {
          router.push("/hub");
          return;
        }

        const isGM = camp.gmUsername.toLowerCase() === user.username.toLowerCase();
        if (isGM) {
          router.replace(`/campaign/${resolvedParams.id}/gm`);
        } else {
          router.replace(`/campaign/${resolvedParams.id}/player`);
        }
      }).catch(() => {
        router.push("/hub");
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [user, authLoading, resolvedParams.id, router]);

  return (
    <div className="min-h-screen bg-[#08090C] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-slate-400">
          {loading ? "Roteando para o setor estelar..." : "Conectando..."}
        </span>
      </div>
    </div>
  );
}
