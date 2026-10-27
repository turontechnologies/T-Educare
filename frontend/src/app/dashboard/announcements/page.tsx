"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { AnnouncementDialog } from "@/components/features/announcements/announcement-dialog";
import { AnnouncementFeed } from "@/components/features/announcements/announcement-feed";
import { useAnnouncements } from "@/hooks/use-announcements";
import type { Announcement } from "@/types/announcement";

export default function AnnouncementsPage() {
  const { data: allAnnouncements = [] } = useAnnouncements();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | undefined>();

  const [channel, setChannel] = useState("");
  const [recipient, setRecipient] = useState("");
  const [search, setSearch] = useState("");

  const recipientOptions = useMemo(
    () =>
      Array.from(new Set(allAnnouncements.map((a) => a.targetLabel))).sort(),
    [allAnnouncements],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allAnnouncements.filter((a) => {
      if (channel === "App" && !a.sendViaApp) return false;
      if (channel === "Email" && !a.sendViaEmail) return false;
      if (recipient && a.targetLabel !== recipient) return false;
      if (query && !a.headline.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [allAnnouncements, channel, recipient, search]);

  const sent = filtered.filter((a) => a.status === "SENT");
  const scheduled = filtered.filter((a) => a.status === "SCHEDULED");
  const draft = filtered.filter((a) => a.status === "DRAFT");

  const openEdit = (announcement: Announcement) => {
    setEditing(announcement);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Administrator", "Announcements"]} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-primary">Announcements</h1>
        <Button
          className="gap-1.5 rounded-md"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          Create Announcement
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Channel</Label>
          <Select
            value={channel || null}
            onValueChange={(value) => setChannel(value ?? "")}
            items={[
              { label: "All Channels", value: "" },
              { label: "App", value: "App" },
              { label: "Email", value: "Email" },
            ]}
          >
            <SelectTrigger className="h-10 w-44 justify-between rounded-md">
              <SelectValue placeholder="All Channels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Channels</SelectItem>
              <SelectItem value="App">App</SelectItem>
              <SelectItem value="Email">Email</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Recipient</Label>
          <Select
            value={recipient || null}
            onValueChange={(value) => setRecipient(value ?? "")}
            items={[
              { label: "All Recipients", value: "" },
              ...recipientOptions.map((option) => ({
                label: option,
                value: option,
              })),
            ]}
          >
            <SelectTrigger className="h-10 w-56 justify-between rounded-md">
              <SelectValue placeholder="All Recipients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Recipients</SelectItem>
              {recipientOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto space-y-1.5">
          <Label
            htmlFor="announcements-search"
            className="text-xs text-muted-foreground"
          >
            Search:
          </Label>
          <Input
            id="announcements-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 w-56"
          />
        </div>
      </div>

      <Tabs defaultValue="sent">
        <TabsList variant="line">
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="scheduled">
            Scheduled ({scheduled.length})
          </TabsTrigger>
          <TabsTrigger value="draft">Draft ({draft.length})</TabsTrigger>
        </TabsList>

        <TabsContent
          value="sent"
          className="animate-in fade-in slide-in-from-bottom-1 mt-5 duration-300"
        >
          <AnnouncementFeed
            announcements={sent}
            groupBy={(a) => a.sentAt ?? a.createdAt}
            emptyText="No announcements sent yet."
          />
        </TabsContent>

        <TabsContent
          value="scheduled"
          className="animate-in fade-in slide-in-from-bottom-1 mt-5 duration-300"
        >
          <AnnouncementFeed
            announcements={scheduled}
            groupBy={(a) => a.scheduledFor ?? a.createdAt}
            emptyText="No scheduled announcements."
            onEdit={openEdit}
          />
        </TabsContent>

        <TabsContent
          value="draft"
          className="animate-in fade-in slide-in-from-bottom-1 mt-5 duration-300"
        >
          <AnnouncementFeed
            announcements={draft}
            groupBy={(a) => a.updatedAt}
            emptyText="No drafts."
            onEdit={openEdit}
          />
        </TabsContent>
      </Tabs>

      <AnnouncementDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(undefined);
        }}
        announcement={editing}
      />
    </div>
  );
}
