"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { readFileAsDataUrl } from "@/lib/files";

interface ProfileHeroCardProps {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  /** e.g. "Super Admin", "Institution Admin" — shown as a badge under the name. */
  roleLabel: string;
  /** Secondary line under the role badge — e.g. an institution name. */
  subtitle?: string;
  onAvatarChange: (url: string) => void;
}

/**
 * Shared profile-page header — large avatar with an upload affordance,
 * name, role badge, and contact info. Used by both `/super-admin/profile`
 * and `/dashboard/profile` so the two look and behave identically even
 * though the data underneath is different (see each page for what's
 * "particular to them").
 */
export function ProfileHeroCard({
  firstName,
  lastName,
  email,
  phone,
  avatarUrl,
  roleLabel,
  subtitle,
  onAvatarChange,
}: ProfileHeroCardProps) {
  const [preview, setPreview] = useState(avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = await readFileAsDataUrl(file);
    setPreview(url);
    onAvatarChange(url);
  };

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both overflow-hidden duration-500">
      <div className="h-20 bg-primary" />
      <CardContent className="-mt-10 flex flex-col items-center gap-3 text-center sm:-mt-12 sm:flex-row sm:items-end sm:text-left">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Change profile photo"
          className="group relative size-24 shrink-0 cursor-pointer rounded-full ring-4 ring-card sm:size-28"
        >
          <Avatar className="size-full">
            <AvatarImage src={preview} alt={`${firstName} ${lastName}`} />
            <AvatarFallback className="bg-tertiary text-2xl font-semibold text-tertiary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-white opacity-0 transition-colors group-hover:bg-black/40 group-hover:opacity-100">
            <Camera className="size-6" />
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
          />
        </button>

        <div className="min-w-0 flex-1 space-y-1 pt-1 sm:pt-0">
          <h2 className="text-lg font-semibold text-foreground">
            {firstName} {lastName}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <Badge className="bg-secondary text-secondary-foreground">
              {roleLabel}
            </Badge>
            {subtitle && (
              <span className="text-sm text-muted-foreground">{subtitle}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {email}
            {phone ? ` · ${phone}` : ""}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
