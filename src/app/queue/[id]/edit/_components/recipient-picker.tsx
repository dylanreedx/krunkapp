"use client";

import { useState } from "react";
import { Phone, UserPlus, X } from "@phosphor-icons/react";
import { api } from "@/trpc/react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface Recipient {
  id: string;
  queueId: string;
  userId: string | null;
  phoneNumber: string | null;
  user?: {
    id: string;
    name: string | null;
    displayName: string | null;
    avatarId: string | null;
  } | null;
}

// TODO: Auto-match on signup — when a new user signs up and enters their phone,
// match against queueRecipient.phoneNumber records and populate userId.

export function RecipientPicker({
  queueId,
  recipients,
  editable,
}: {
  queueId: string;
  recipients: Recipient[];
  editable: boolean;
}) {
  const [showSheet, setShowSheet] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const utils = api.useUtils();

  const addPhoneRecipient = api.queue.addPhoneRecipient.useMutation({
    onSuccess: () => {
      setPhone("");
      setError(null);
      setShowSheet(false);
      void utils.queue.getById.invalidate({ queueId });
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const removeRecipient = api.queue.removeRecipient.useMutation({
    onSuccess: () => {
      void utils.queue.getById.invalidate({ queueId });
    },
  });

  // Map recipient userId to friend data for display
  // User data now comes joined from the query, no friend map needed

  const handleSend = () => {
    setError(null);
    const trimmed = phone.trim();

    if (!trimmed) {
      setError("Enter a phone number.");
      return;
    }

    // Check for duplicate phone
    if (recipients.some((r) => r.phoneNumber === trimmed)) {
      setError("This number is already added.");
      return;
    }

    addPhoneRecipient.mutate({ queueId, phoneNumber: trimmed });
  };

  return (
    <div>
      {/* Recipient avatar grid */}
      <div className="flex flex-wrap items-start gap-5">
        {recipients.map((r) => {
          const hasUser = !!r.userId;
          const label = r.user?.displayName ?? r.user?.name ?? r.phoneNumber ?? "?";

          return (
            <div key={r.id} className="flex flex-col items-center gap-2">
              <div className="group relative">
                {hasUser ? (
                  <Avatar
                    avatarId={r.user?.avatarId ?? "smile-pink"}
                    size="lg"
                    className="transition-transform hover:scale-[1.08]"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-3 border-black bg-gray-50 transition-transform hover:scale-[1.08]">
                    <Phone weight="bold" size={24} className="text-gray-500" />
                  </div>
                )}
                {editable && (
                  <button
                    type="button"
                    onClick={() =>
                      removeRecipient.mutate({ queueId, recipientId: r.id })
                    }
                    className="absolute -top-1 -right-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-gray-200 text-gray-500 opacity-0 transition-all hover:bg-pink hover:text-white group-hover:opacity-100"
                  >
                    <X weight="bold" size={14} />
                  </button>
                )}
              </div>
              <span className="max-w-[80px] truncate font-body text-xs font-semibold text-black">
                {hasUser ? (label.split(" ")[0]) : (r.phoneNumber ?? "?")}
              </span>
              <span className="font-body text-[10px] text-gray-400">
                {hasUser ? "On Krunk" : "SMS on drop"}
              </span>
            </div>
          );
        })}

        {/* Add friend circle */}
        {editable && (
          <div
            className="group flex cursor-pointer flex-col items-center gap-2"
            onClick={() => setShowSheet(!showSheet)}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-3 border-dashed border-gray-500 text-gray-500 transition-all group-hover:border-pink group-hover:text-pink group-hover:scale-[1.08]">
              <UserPlus weight="bold" size={20} />
            </div>
            <span className="font-body text-xs font-semibold text-gray-500 transition-colors group-hover:text-pink">
              Add
            </span>
          </div>
        )}
      </div>

      {/* No recipients empty state */}
      {recipients.length === 0 && !editable && (
        <div className="rounded-[var(--radius-xl)] border-3 border-dashed border-gray-200 px-6 py-6 text-center">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-gray-400">
            No listeners yet
          </p>
        </div>
      )}

      {/* Add by phone sheet */}
      {showSheet && editable && (
        <div className="mt-4 origin-top animate-[fade-up_0.3s_ease-out_both] rounded-[var(--radius-xl)] border-3 border-black bg-white p-6">
          <p className="mb-1 font-display text-[0.95rem] font-bold">
            Send to a phone number
          </p>
          <p className="mb-3.5 font-body text-xs text-gray-400">
            They'll get an SMS with the queue link on drop day
          </p>
          <div className="flex gap-2.5">
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="+1 (555) 000-0000"
              className="flex-1 rounded-[14px] border-3 border-black px-[18px] py-3.5 font-body text-[0.95rem] font-medium text-black outline-none transition-colors placeholder:text-gray-300 focus:border-pink"
            />
            <Button
              type="button"
              variant="primary"
              size="md"
              className="shrink-0 rounded-[14px]"
              onClick={handleSend}
              disabled={addPhoneRecipient.isPending}
            >
              {addPhoneRecipient.isPending ? "..." : "Send to"}
            </Button>
          </div>

          {error && (
            <p className="mt-2 font-body text-xs text-red-500">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
