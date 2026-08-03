"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { cn } from "@/shared/lib/cn";
import { weddingContent } from "../data/wedding-content";

type CoupleProfile = (typeof weddingContent.couple)[keyof typeof weddingContent.couple];

export function CoupleProfileSection() {
  return (
    <section className="space-y-20 bg-white px-8 py-24">
      <ProfileCard profile={weddingContent.couple.bride} imageSide="left" />
      <ProfileCard profile={weddingContent.couple.groom} imageSide="right" />
    </section>
  );
}

function ProfileCard({ profile, imageSide }: { profile: CoupleProfile; imageSide: "left" | "right" }) {
  const isImageRight = imageSide === "right";

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h4 className="text-sm font-medium uppercase tracking-[0.4em] text-brand-gold">
          {profile.role}
        </h4>
        <p className="mt-1.5 text-sm text-brand-muted">{profile.roleKo}</p>
      </div>

      <div className={cn("flex items-start gap-5", isImageRight && "flex-row-reverse")}>
        <motion.div
          initial={{ opacity: 0, x: isImageRight ? 24 : -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="w-[43%] shrink-0 space-y-3 text-center"
        >
          <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-brand-gold/10 bg-brand-beige/20">
            <Image
              src={profile.imageUrl}
              alt={profile.imageAlt}
              fill
              unoptimized
              className="object-cover object-center"
              sizes="154px"
            />
          </div>
          <h3 className="font-serif text-2xl font-light leading-none">{profile.name}</h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 1 }}
          className="min-w-0 flex-1 pt-1"
        >
          <ProfileFacts facts={profile.facts} align={isImageRight ? "right" : "left"} />
        </motion.div>
      </div>
    </div>
  );
}

function ProfileFacts({ facts, align }: { facts: CoupleProfile["facts"]; align: "left" | "right" }) {
  return (
    <div className={cn("flex flex-col gap-2.5 font-[Inter,ui-sans-serif,system-ui,sans-serif]", align === "right" && "items-end")}>
      {facts.map((fact) => (
        <div
          key={fact.label}
          className={cn(
            "w-full rounded-2xl bg-brand-beige/70 px-3 py-2 shadow-sm shadow-brand-gold/5",
            align === "right" ? "text-right" : "text-left",
          )}
        >
          <span className="mb-0.5 block text-[9px] font-black tracking-[0.18em] text-brand-gold">{fact.label}</span>
          <p className="text-[12px] font-semibold leading-5 text-brand-ink/75">{fact.value}</p>
        </div>
      ))}
    </div>
  );
}
