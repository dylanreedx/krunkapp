"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react";
import { api } from "@/trpc/react";
import { Avatar, AvatarPicker } from "@/components/ui/avatar";

export function OnboardingForm({
  redirectTo,
  currentAvatarId,
}: {
  redirectTo: string;
  currentAvatarId: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarId, setAvatarId] = useState(currentAvatarId);
  const [step, setStep] = useState<"name" | "avatar">("name");
  const [saving, setSaving] = useState(false);

  const updateProfile = api.user.updateProfile.useMutation({
    onSuccess: () => {
      router.push(redirectTo);
      router.refresh();
    },
    onError: () => setSaving(false),
  });

  const handleSubmit = () => {
    setSaving(true);
    updateProfile.mutate({
      displayName: name.trim() || undefined,
      phoneNumber: phone.trim() || undefined,
      avatarId,
    });
  };

  return (
    <div className="w-full text-center">
      {/* Logo */}
      <h1 className="mb-2 font-display text-3xl font-black tracking-tight">
        krun<span className="text-pink">k</span>
      </h1>
      <p className="mb-10 font-body text-sm text-gray-500">
        One more thing before you&apos;re in
      </p>

      {step === "name" ? (
        <div className="animate-[fade-up_0.3s_ease-out]">
          {/* Current avatar */}
          <div className="mb-6 flex justify-center">
            <Avatar avatarId={avatarId} size="lg" />
          </div>

          {/* Name input */}
          <div className="mb-4">
            <label className="mb-2 block text-left font-display text-sm font-bold">
              What should we call you?
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoFocus
              className="w-full rounded-[var(--radius-lg)] border-3 border-black px-4 py-3.5 font-body text-base outline-none transition-colors placeholder:text-gray-300 focus:border-pink"
            />
          </div>

          {/* Phone input */}
          <div className="mb-8">
            <label className="mb-2 block text-left font-display text-sm font-bold">
              Phone number{" "}
              <span className="font-body font-normal text-gray-400">
                (optional — for SMS drops)
              </span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="w-full rounded-[var(--radius-lg)] border-3 border-black px-4 py-3.5 font-body text-base outline-none transition-colors placeholder:text-gray-300 focus:border-pink"
            />
          </div>

          {/* Next button */}
          <button
            type="button"
            onClick={() => setStep("avatar")}
            disabled={!name.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-pink px-6 py-4 font-display text-base font-bold text-white transition-all active:scale-[0.97] disabled:opacity-30"
          >
            Choose your look
            <ArrowRight weight="bold" size={18} />
          </button>

          {/* Skip */}
          <button
            type="button"
            onClick={() => {
              setSaving(true);
              updateProfile.mutate({ avatarId });
            }}
            className="mt-4 font-body text-xs text-gray-400 underline underline-offset-2 transition-colors hover:text-pink"
          >
            Skip for now
          </button>
        </div>
      ) : (
        <div className="animate-[fade-up_0.3s_ease-out]">
          {/* Avatar picker */}
          <AvatarPicker
            selected={avatarId}
            onSelect={(id) => setAvatarId(id)}
          />

          {/* Done button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-pink px-6 py-4 font-display text-base font-bold text-white transition-all active:scale-[0.97] disabled:opacity-50"
          >
            {saving ? "Setting up..." : "Let\u2019s go"}
            {!saving && <ArrowRight weight="bold" size={18} />}
          </button>

          {/* Back */}
          <button
            type="button"
            onClick={() => setStep("name")}
            className="mt-4 font-body text-xs text-gray-400 underline underline-offset-2 transition-colors hover:text-pink"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}
