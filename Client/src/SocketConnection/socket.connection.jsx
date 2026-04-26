import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  autoConnect: false,
});

export default function SocketConnection() {
  const [username, setUsername] = useState("");
  const [draftName, setDraftName] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [socketId, setSocketId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const bottomRef = useRef(null);

  const canJoin = useMemo(() => draftName.trim().length > 0, [draftName]);

  useEffect(() => {
    socket.connect();

    const onConnect = () => {
      setIsConnected(true);
      setSocketId(socket.id || "");
    };
    const onDisconnect = () => {
      setIsConnected(false);
      setTypingUsers([]);
    };
    const onChatMessage = (payload) => {
      setMessages((prev) => [...prev, { ...payload, type: "chat" }]);
    };
    const onSystemMessage = (payload) => {
      setMessages((prev) => [...prev, { ...payload, type: "system", id: `system-${Date.now()}-${Math.random()}` }]);
    };
    const onOnlineCount = (count) => setOnlineCount(count);
    const onOnlineUsers = (users) => {
      setOnlineUsers(Array.isArray(users) ? users : []);
    };
    const onUserTyping = (payload) => {
      if (!payload?.id) return;

      setTypingUsers((prev) => {
        if (payload.isTyping) {
          if (prev.some((item) => item.id === payload.id)) {
            return prev;
          }

          return [...prev, { id: payload.id, name: payload.name }];
        }

        return prev.filter((item) => item.id !== payload.id);
      });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("receive-message", onChatMessage);
    socket.on("system-message", onSystemMessage);
    socket.on("online-count", onOnlineCount);
    socket.on("online-users", onOnlineUsers);
    socket.on("user-typing", onUserTyping);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("receive-message", onChatMessage);
      socket.off("system-message", onSystemMessage);
      socket.off("online-count", onOnlineCount);
      socket.off("online-users", onOnlineUsers);
      socket.off("user-typing", onUserTyping);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const joinChat = (event) => {
    event.preventDefault();
    const name = draftName.trim().slice(0, 20);
    if (!name) return;

    setUsername(name);
    socket.emit("join-chat", name);
  };

  const sendMessage = (event) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || !username) return;

    socket.emit("typing", false);
    socket.emit("send-message", text);
    setMessage("");
  };

  const handleMessageChange = (event) => {
    const value = event.target.value;
    setMessage(value);

    if (!username) return;
    socket.emit("typing", value.trim().length > 0);
  };

  const typingNames = typingUsers.map((item) => item.name).filter(Boolean);
  const typingText = typingNames.length > 2 ? `${typingNames.slice(0, 2).join(" و ")} +${typingNames.length - 2} يكتبون الآن...` : typingNames.length ? `${typingNames.join(" و ")} يكتب الآن...` : "";

  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute -left-16 top-0 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid h-[min(860px,92vh)] w-[min(1240px,96vw)] overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-[0_30px_90px_rgba(2,10,30,0.55)] backdrop-blur-xl lg:grid-cols-[300px_1fr] grid-rows-1">
          <aside className="hidden h-full flex-col overflow-y-auto border-r border-white/10 bg-slate-950/35 p-5 lg:flex">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">Online Users</p>
            <h3 className="mt-2 text-lg font-semibold text-white">Participants</h3>
            <div className="mt-4 space-y-2">
              {onlineUsers.length ? (
                onlineUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2">
                    <span className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-300/20 text-xs font-semibold text-cyan-100">
                        {user.name?.slice(0, 1)?.toUpperCase() || "U"}
                      </span>
                      <span className="text-sm text-slate-100">{user.name}</span>
                    </span>
                    {user.id === socketId ? <span className="text-xs text-amber-300">You</span> : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No active users yet.</p>
              )}
            </div>
          </aside>

          <div className="flex h-full flex-col overflow-hidden">
          <header className="flex flex-shrink-0 flex-col gap-3 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Socket Channel</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Live Team Chat</h2>
            </div>

            <div className="flex items-center gap-3 rounded-full bg-slate-900/70 px-4 py-2 text-sm text-slate-200 ring-1 ring-white/10">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${isConnected ? "bg-emerald-400" : "bg-rose-400"}`} />
              <span>{isConnected ? "Connected" : "Disconnected"}</span>
              <span className="text-slate-500">|</span>
              <span>{onlineCount} online</span>
            </div>
          </header>

          {!username ? (
            <form onSubmit={joinChat} className="mx-auto grid h-full w-full max-w-md content-center gap-4 px-6 py-14">
              <div>
                <label htmlFor="username" className="mb-2 block text-sm font-medium text-cyan-100">
                  Choose your display name
                </label>
                <input
                  id="username"
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="e.g. Alex"
                  maxLength={20}
                  className="w-full rounded-2xl border border-white/15 bg-slate-900/75 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30"
                />
              </div>

              <button
                type="submit"
                disabled={!canJoin || !isConnected}
                className="rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-amber-300 px-5 py-3 font-semibold text-slate-900 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Enter Chat
              </button>
            </form>
          ) : (
            <>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-5">
                {messages.map((item) => (
                  <article
                    key={item.id}
                    className={
                      item.type === "chat" && item.senderId === socketId
                        ? "ml-auto w-fit max-w-[82%] rounded-2xl border border-cyan-200/30 bg-cyan-300/15 px-4 py-3"
                        : item.type === "chat"
                        ? "mr-auto w-fit max-w-[82%] rounded-2xl border border-white/10 bg-slate-900/65 px-4 py-3"
                        : "mx-auto w-fit rounded-full border border-cyan-200/35 bg-cyan-300/10 px-4 py-2 text-xs text-cyan-100"
                    }
                  >
                    {item.type === "chat" ? (
                      <>
                        <div className="mb-1 flex items-center justify-between gap-4">
                          <strong className={item.senderId === socketId ? "text-amber-200" : "text-cyan-100"}>
                            {item.senderId === socketId ? `${item.sender} (You)` : item.sender}
                          </strong>
                          <time className="text-xs text-slate-400">{item.time}</time>
                        </div>
                        <p className="leading-relaxed text-slate-100">{item.text}</p>
                      </>
                    ) : (
                      <p>{item.text}</p>
                    )}
                  </article>
                ))}

                {typingText ? (
                  <div className="mr-auto w-fit rounded-full border border-amber-200/35 bg-amber-300/10 px-4 py-2 text-xs text-amber-100">
                    {typingText}
                  </div>
                ) : null}

                <div ref={bottomRef} />
              </div>

              <form onSubmit={sendMessage} className="grid flex-shrink-0 gap-3 border-t border-white/10 bg-slate-950/35 px-6 py-5 sm:grid-cols-[1fr_auto] grid-cols-1">
                <input
                  type="text"
                  value={message}
                  onChange={handleMessageChange}
                  placeholder="Share an update with the team"
                  maxLength={500}
                  className="w-full rounded-2xl border border-white/15 bg-slate-900/80 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-300/30"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || !isConnected}
                  className="rounded-2xl bg-amber-300 px-6 py-3 font-semibold text-slate-900 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Send
                </button>
              </form>
            </>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}