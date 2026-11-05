"use client";

import { useState } from "react";
import { CreditCard, Loader2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatNaira } from "@/lib/format";
import {
  usePaystackPayLink,
  useStudentBills,
} from "@/hooks/use-student-portal";

export function BillsCard() {
  const { data, isLoading } = useStudentBills(true);
  const payLink = usePaystackPayLink();
  const [payingAmount, setPayingAmount] = useState<number | null>(null);

  const handlePayNow = async () => {
    if (!data || data.balance <= 0) return;
    setPayingAmount(data.balance);
    try {
      const { authorizationUrl } = await payLink.mutateAsync(data.balance);
      window.location.href = authorizationUrl;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't start payment",
      );
      setPayingAmount(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Receipt className="size-4 text-primary" />
          My Bills
        </CardTitle>
        {data && (
          <Badge variant={data.status === "PAID" ? "secondary" : "destructive"}>
            {data.status === "PAID" ? "Fully paid" : "Owing"}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : !data || data.ledger.length === 0 ? (
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            No fees have been billed to you yet.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-md bg-muted px-4 py-3">
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">Total billed</p>
                  <p className="font-semibold">
                    {formatNaira(data.totalBilled)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total paid</p>
                  <p className="font-semibold text-emerald-600">
                    {formatNaira(data.totalPaid)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p
                    className={
                      data.balance > 0
                        ? "font-semibold text-destructive"
                        : "font-semibold text-emerald-600"
                    }
                  >
                    {formatNaira(data.balance)}
                  </p>
                </div>
              </div>

              {data.balance > 0 && (
                <Button
                  onClick={handlePayNow}
                  disabled={!data.paystackEnabled || payLink.isPending}
                  title={
                    data.paystackEnabled
                      ? undefined
                      : "Online payment isn't set up for this institution yet — pay at the finance office."
                  }
                  className="gap-1.5 rounded-full"
                >
                  {payLink.isPending && payingAmount === data.balance ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CreditCard className="size-4" />
                  )}
                  Pay Now
                </Button>
              )}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Charge</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.ledger.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(line.date)}
                    </TableCell>
                    <TableCell>{line.description}</TableCell>
                    <TableCell>{formatNaira(line.charge)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {line.payment != null ? formatNaira(line.payment) : "—"}
                    </TableCell>
                    <TableCell
                      className={
                        line.lineBalance > 0
                          ? "font-medium text-destructive"
                          : "text-emerald-600"
                      }
                    >
                      {formatNaira(line.lineBalance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
