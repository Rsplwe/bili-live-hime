import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type UserSelectItem = {
  id: string;
  name: string;
  avatar: string;
};

interface UserSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserSelectItem[];
  onConfirm: (user: UserSelectItem) => void;
}

export function UserSelectDialog({
  open,
  onOpenChange,
  users,
  onConfirm,
}: UserSelectDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-description={undefined}>
        <DialogHeader>
          <DialogTitle>选择用户</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-80 overflow-auto">
          {users.map((user) => {
            const selected = user.id === selectedUserId;

            return (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUserId(user.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg border p-3 text-left transition",
                  selected ? "border-primary bg-primary/5" : "hover:bg-muted",
                )}>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.name.slice(0, 1)}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">
                    ID: {user.id}
                  </div>
                </div>

                <div
                  className={cn(
                    "h-4 w-4 rounded-full border",
                    selected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground",
                  )}
                />
              </button>
            );
          })}

          {users.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">
              未搜索到用户
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            disabled={!selectedUser}
            onClick={() => {
              if (selectedUser) {
                onConfirm(selectedUser);
                onOpenChange(false);
              }
            }}>
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
