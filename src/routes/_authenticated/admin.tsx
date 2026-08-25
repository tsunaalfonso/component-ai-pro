import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, Loader2, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  adminDeleteUser,
  adminListLogs,
  adminListUsers,
  adminResetPassword,
  adminUpdateUser,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin panel — Smart Multi-Tester" },
      { name: "description", content: "Approve technicians, manage roles and review diagnostic system activity logs." },
      { property: "og:title", content: "Admin panel — Smart Multi-Tester" },
      { property: "og:description", content: "Approve technicians, manage roles and review system activity." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const listUsers = useServerFn(adminListUsers);
  const listLogs = useServerFn(adminListLogs);
  const updateUser = useServerFn(adminUpdateUser);
  const deleteUser = useServerFn(adminDeleteUser);
  const resetPassword = useServerFn(adminResetPassword);

  const users = useQuery({
    queryKey: ["admin-users"],
    enabled: role === "admin",
    queryFn: () => listUsers({}),
  });
  const logs = useQuery({
    queryKey: ["admin-logs"],
    enabled: role === "admin",
    queryFn: () => listLogs({}),
  });

  const update = useMutation({
    mutationFn: (vars: { userId: string; approved?: boolean; disabled?: boolean; role?: "admin" | "user" }) =>
      updateUser({ data: vars }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
      void qc.invalidateQueries({ queryKey: ["admin-logs"] });
      toast.success("User updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => deleteUser({ data: { userId } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (role !== "admin") {
    return (
      <div className="panel mx-auto max-w-md p-8 text-center">
        <ShieldAlert className="mx-auto size-6 text-warning" />
        <h1 className="mt-4 text-lg font-semibold">Administrator access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This section is restricted to laboratory administrators.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Admin panel" description="Approve technicians, manage roles and audit system activity." />

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="logs">Activity logs</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          {users.error && (
            <div className="panel mb-4 border-destructive/40 p-4 text-sm text-destructive">
              {(users.error as Error).message}
            </div>
          )}
          {(() => {
            const pending = (users.data ?? []).filter((u) => !u.approved && !u.disabled);
            if (!pending.length) return null;
            return (
              <div className="panel mb-4 p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Pending approval — {pending.length}
                </p>
                <div className="mt-3 space-y-2">
                  {pending.map((u) => (
                    <div key={u.id} className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{u.full_name || "—"}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{u.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={update.isPending}
                          onClick={() => update.mutate({ userId: u.id, approved: true })}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={update.isPending}
                          onClick={() => update.mutate({ userId: u.id, disabled: true })}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="px-4 py-3">Technician</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Approved</th>
                  <th className="px-4 py-3">Disabled</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.isLoading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <Loader2 className="mx-auto size-5 animate-spin text-primary" />
                    </td>
                  </tr>
                )}
                {(users.data ?? []).map((u) => (
                  <tr key={u.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{u.full_name || "—"}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={u.role}
                        onValueChange={(value) =>
                          update.mutate({ userId: u.id, role: value as "admin" | "user" })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Switch
                        checked={u.approved}
                        onCheckedChange={(checked) => update.mutate({ userId: u.id, approved: checked })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Switch
                        checked={u.disabled}
                        onCheckedChange={(checked) => update.mutate({ userId: u.id, disabled: checked })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          title="Send password reset"
                          onClick={() => {
                            void resetPassword({
                              data: { email: u.email, redirectTo: `${window.location.origin}/auth` },
                            })
                              .then(() => toast.success("Reset link sent"))
                              .catch((e: Error) => toast.error(e.message));
                          }}
                        >
                          <KeyRound className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          title="Delete user"
                          onClick={() => {
                            if (confirm(`Permanently delete ${u.email}?`)) remove.mutate(u.id);
                          }}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <div className="panel divide-y divide-border">
            {(logs.data ?? []).map((l) => (
              <div key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <span className="font-mono text-xs text-muted-foreground">
                  {new Date(l.created_at).toLocaleString()}
                </span>
                <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px]">{l.action}</span>
                <span className="text-muted-foreground">{l.user_email ?? "system"}</span>
                <span className="w-full truncate text-xs text-muted-foreground sm:w-auto">{l.details}</span>
              </div>
            ))}
            {!logs.isLoading && !(logs.data ?? []).length && (
              <p className="px-4 py-16 text-center text-sm text-muted-foreground">No activity recorded yet.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
