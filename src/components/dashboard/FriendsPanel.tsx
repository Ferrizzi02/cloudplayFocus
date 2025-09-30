import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import AddFriendDialog from "./AddFriendDialog";

interface FriendsPanelProps {
  userId?: string;
}

interface Friend {
  id: string;
  name: string;
  avatar_url?: string;
  completion_percentage: number;
}

const FriendsPanel = ({ userId }: FriendsPanelProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const mockFriends: Friend[] = [
    { id: "1", name: "Alice", completion_percentage: 75 },
    { id: "2", name: "Bob", completion_percentage: 50 },
    { id: "3", name: "Charlie", completion_percentage: 90 },
  ];  
  useEffect(() => {

    // const fetchFriends = async () => {
    //   const { data: friendships } = await supabase
    //     .from("friendships")
    //     .select("friend_id")
    //     .eq("user_id", userId);

    //   if (!friendships) return;

    //   const friendsData: Friend[] = [];
    //   for (const friendship of friendships) {
    //     const { data: profile } = await supabase
    //       .from("profiles")
    //       .select("id, name, avatar_url")
    //       .eq("id", friendship.friend_id)
    //       .single();

    //     if (profile) {
    //       const { data: statsData } = await supabase.rpc(
    //         "get_friend_stats",
    //         { friend_user_id: profile.id }
    //       );

    //       friendsData.push({
    //         ...profile,
    //         completion_percentage: statsData?.[0]?.completion_percentage || 0,
    //       });
    //     }
    //   }

      setFriends(mockFriends);
    },

    //fetchFriends();
  []);

  return (
    <>
      <div className="bg-card rounded-3xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-card-foreground">
            Companheiros em atividade
          </h2>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Acompanhar Amigos
          </Button>
        </div>

        {friends.length === 0 ? (
          <p className="text-center text-card-foreground/60 py-8">
            Adicione amigos para acompanhar o progresso deles!
          </p>
        ) : (
          <div className="space-y-4">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center gap-4 p-4 bg-secondary/50 rounded-2xl"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-planet flex items-center justify-center text-xl font-bold text-foreground">
                  {friend.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-card-foreground">{friend.name}</p>
                  <p className="text-sm text-card-foreground/60">
                    {friend.completion_percentage}% concluído
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddFriendDialog
        userId={userId}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onFriendAdded={() => {
          // Refresh friends list
          window.location.reload();
        }}
      />
    </>
  );
};

export default FriendsPanel;
