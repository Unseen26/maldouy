import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { messageSchema } from "@/lib/validation";

const sb = supabase as any;

interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message_at: string | null;
  other_user_name: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (!selectedConversation) return;

    fetchMessages(selectedConversation.id);

    const channel = sb
      .channel(`conversation:${selectedConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload: any) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await sb
        .from("conversations")
        .select("*")
        .or(`participant1_id.eq.${user?.id},participant2_id.eq.${user?.id}`)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (error) throw error;

      const conversationsWithNames = await Promise.all(
        (data || []).map(async (conv: any) => {
          const otherUserId =
            conv.participant1_id === user?.id
              ? conv.participant2_id
              : conv.participant1_id;

          const { data: profile } = await sb
            .from("public_profiles")
            .select("full_name")
            .eq("id", otherUserId)
            .maybeSingle();

          return {
            ...conv,
            other_user_name: profile?.full_name || "Usuario",
          };
        })
      );

      setConversations(conversationsWithNames);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      toast.error("Hubo un problema al cargar las conversaciones.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await sb
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      toast.error("Hubo un problema al cargar los mensajes.");
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation || !user) return;

    // Validate message content
    const validation = messageSchema.safeParse({ content: newMessage });
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    try {
      const { error } = await sb.from("messages").insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content: validation.data.content,
      });

      if (error) throw error;

      setNewMessage("");
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
      toast.error("Hubo un problema al enviar el mensaje.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container px-4 py-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>

        <Card className="grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-200px)]">
          {/* Lista de conversaciones */}
          <div className="border-r">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-lg">Mensajes</h2>
            </div>
            <ScrollArea className="h-[calc(100%-60px)]">
              {loading ? (
                <p className="p-4 text-muted-foreground text-sm">
                  Cargando conversaciones...
                </p>
              ) : conversations.length === 0 ? (
                <p className="p-4 text-muted-foreground text-sm">
                  No tenés conversaciones
                </p>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors ${
                      selectedConversation?.id === conv.id ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {conv.other_user_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {conv.other_user_name}
                        </p>
                        {conv.last_message_at && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(conv.last_message_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Panel de mensajes */}
          <div className="col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b">
                  <h3 className="font-semibold">
                    {selectedConversation.other_user_name}
                  </h3>
                </div>

                <ScrollArea className="flex-1 p-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`mb-4 flex ${
                        msg.sender_id === user?.id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.sender_id === user?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </ScrollArea>

                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Escribí un mensaje..."
                    />
                    <Button onClick={sendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Seleccioná una conversación para ver los mensajes
              </div>
            )}
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Messages;
