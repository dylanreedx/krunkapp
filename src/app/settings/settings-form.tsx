"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/trpc/react";
import { authClient } from "@/server/better-auth/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarPicker } from "@/components/ui/avatar";

export function SettingsForm() {
  const router = useRouter();
  const utils = api.useUtils();
  const [profile] = api.user.getProfile.useSuspenseQuery();

  const [displayName, setDisplayName] = useState(
    profile?.displayName ?? profile?.name ?? "",
  );
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber ?? "");
  const [avatarId, setAvatarId] = useState(
    profile?.avatarId ?? "smile-pink",
  );
  const [dropDay, setDropDay] = useState<"friday" | "sunday">("friday");
  const [saved, setSaved] = useState(false);

  const setAvatarMutation = api.user.setAvatar.useMutation({
    onSuccess: () => {
      void utils.user.getProfile.invalidate();
    },
  });

  const updateProfile = api.user.updateProfile.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleAvatarSelect = (id: string) => {
    setAvatarId(id);
    setAvatarMutation.mutate({ avatarId: id });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({
      displayName: displayName || undefined,
      phoneNumber,
    });
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/";
  };

  return (
    <div className="space-y-6">
      {/* Avatar section */}
      <div className="rounded-[var(--radius-xl)] border-3 border-black bg-white p-6">
        <div className="mb-5 flex items-center gap-4">
          <Avatar avatarId={avatarId} size="lg" />
          <div>
            <h2 className="font-display text-lg font-bold uppercase tracking-wide">
              Change your look
            </h2>
            <p className="font-body text-sm text-gray-500">
              Pick a face that fits your vibe
            </p>
          </div>
        </div>
        <AvatarPicker selected={avatarId} onSelect={handleAvatarSelect} />
        {setAvatarMutation.isPending && (
          <p className="mt-2 font-body text-xs text-gray-400">Updating...</p>
        )}
      </div>

      {/* Profile section */}
      <form onSubmit={handleSave}>
        <div className="rounded-[var(--radius-xl)] border-3 border-black bg-white p-6">
          <h2 className="mb-5 font-display text-lg font-bold uppercase tracking-wide">
            Profile
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="displayName"
                className="mb-1.5 block font-display text-xs font-bold uppercase tracking-wide text-gray-600"
              >
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How friends see you"
                className="w-full rounded-[var(--radius-lg)] border-3 border-black px-4 py-2.5 font-body text-sm outline-none transition-colors focus:border-pink"
              />
            </div>

            <div>
              <label
                htmlFor="phoneNumber"
                className="mb-1.5 block font-display text-xs font-bold uppercase tracking-wide text-gray-600"
              >
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full rounded-[var(--radius-lg)] border-3 border-black px-4 py-2.5 font-body text-sm outline-none transition-colors focus:border-pink"
              />
              <p className="mt-1.5 font-body text-xs text-gray-400">
                For SMS notifications when friends send you queues
              </p>
            </div>
          </div>

          {/* Drop day preference */}
          <div className="mt-6">
            <label className="mb-2 block font-display text-xs font-bold uppercase tracking-wide text-gray-600">
              Drop Day
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDropDay("friday")}
                className={`flex-1 rounded-[var(--radius-md)] border-3 px-4 py-2.5 font-display text-sm font-bold uppercase transition-all ${
                  dropDay === "friday"
                    ? "border-pink bg-pink text-white"
                    : "border-black bg-white text-black hover:bg-gray-50"
                }`}
              >
                Friday
              </button>
              <button
                type="button"
                onClick={() => setDropDay("sunday")}
                className={`flex-1 rounded-[var(--radius-md)] border-3 px-4 py-2.5 font-display text-sm font-bold uppercase transition-all ${
                  dropDay === "sunday"
                    ? "border-pink bg-pink text-white"
                    : "border-black bg-white text-black hover:bg-gray-50"
                }`}
              >
                Sunday
              </button>
            </div>
          </div>

          {/* Save */}
          <div className="mt-6 flex items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="rounded-[var(--radius-md)]"
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </Button>
            {saved && (
              <span className="font-display text-xs font-bold uppercase tracking-wide text-green-700">
                Saved
              </span>
            )}
            {updateProfile.isError && (
              <span className="font-display text-xs font-bold uppercase tracking-wide text-red-600">
                Error saving
              </span>
            )}
          </div>
        </div>
      </form>

      {/* Sign out */}
      <div className="rounded-[var(--radius-xl)] border-3 border-black bg-white p-6">
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={handleSignOut}
          className="w-full text-gray-500"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
