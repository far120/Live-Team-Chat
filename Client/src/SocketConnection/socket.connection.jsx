import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

// const DEFAULT_PRODUCTION_SOCKET_SERVER_URL = "https://backend-live-chat-production.up.railway.app/";

// const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL?.trim() || (import.meta.env.DEV ? "http://localhost:3000" : DEFAULT_PRODUCTION_SOCKET_SERVER_URL);

// const socket = SOCKET_SERVER_URL
//   ? io(SOCKET_SERVER_URL, {
//       autoConnect: false,
//       transports: ["websocket", "polling"],
//     })
//   : null;

const socket = io(
  import.meta.env.DEV
    ? "http://localhost:3000"
    : "https://backend-live-chat-production.up.railway.app"
);

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
  const [connectionError, setConnectionError] = useState("");
  const [showMobileUsers, setShowMobileUsers] = useState(false);
  const bottomRef = useRef(null);

  const canJoin = useMemo(() => draftName.trim().length > 0, [draftName]);

  useEffect(() => {
    if (!socket) {
      setConnectionError("مطلوب تعيين VITE_SOCKET_SERVER_URL على رابط السيرفر المنشور قبل تشغيل النسخة المنشورة");
      setIsConnected(false);
      return undefined;
    }

    const onConnect = () => {
      setConnectionError("");
      setIsConnected(true);
      setSocketId(socket.id || "");
    };
    const onDisconnect = () => {
      setIsConnected(false);
      setTypingUsers([]);
    };
    const onConnectError = (error) => {
      setIsConnected(false);
      setConnectionError(error?.message || "تعذر الاتصال بالسيرفر");
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
    socket.on("connect_error", onConnectError);
    socket.on("receive-message", onChatMessage);
    socket.on("system-message", onSystemMessage);
    socket.on("online-count", onOnlineCount);
    socket.on("online-users", onOnlineUsers);
    socket.on("user-typing", onUserTyping);

    setIsConnected(socket.connected);
    setSocketId(socket.id || "");
    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
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
    if (!name || !socket) return;

    setUsername(name);
    
    // إضافة رسالة الترحيب
    setMessages((prev) => [
      ...prev,
      {
        id: `welcome-${Date.now()}`,
        type: "system",
        text: `🎉 ELFAR CHAT يرحب بـ ${name} - محادثة سعيدة!`
      }
    ]);
    
    socket.emit("join-chat", name);
  };

  const sendMessage = (event) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || !username || !socket) return;

    socket.emit("typing", false);
    socket.emit("send-message", text);
    setMessage("");
  };

  const handleMessageChange = (event) => {
    const value = event.target.value;
    setMessage(value);

    if (!username || !socket) return;
    socket.emit("typing", value.trim().length > 0);
  };

  const typingNames = typingUsers.map((item) => item.name).filter(Boolean);
  const typingText = typingNames.length > 2 ? `${typingNames.slice(0, 2).join(" و ")} و${typingNames.length - 2} آخرين يكتبون...` : typingNames.length ? `${typingNames.join(" و ")} يكتب...` : "";

  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute -left-16 top-0 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />
<h1>sssssssssssss</h1>
      <div className="relative mx-auto flex min-h-screen w-full items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid h-[min(860px,92vh)] w-[min(1240px,96vw)] overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-[0_30px_90px_rgba(2,10,30,0.55)] backdrop-blur-xl lg:grid-cols-[300px_1fr] grid-rows-1">
          <aside className="hidden h-full flex-col overflow-y-auto border-r border-white/10 bg-slate-950/35 p-5 lg:flex">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">المتصلين الآن</p>
            <h3 className="mt-2 text-lg font-semibold text-white">الأعضاء</h3>
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
                    {user.id === socketId ? <span className="text-xs text-amber-300">أنت</span> : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">لا يوجد أعضاء متصلين الآن</p>
              )}
            </div>
          </aside>

          <div className="flex h-full flex-col overflow-hidden">
          <header className="flex shrink-0 flex-col gap-3 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">الدردشة المباشرة</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">غرفة الدردشة</h2>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-3 rounded-full bg-slate-900/70 px-4 py-2 text-sm text-slate-200 ring-1 ring-white/10">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${isConnected ? "bg-emerald-400" : "bg-rose-400"}`} />
                <span>{isConnected ? "متصل" : "غير متصل"}</span>
                <span className="text-slate-500">|</span>
                <span>{onlineCount} عضو متصل</span>
              </div>

              <button
                type="button"
                onClick={() => setShowMobileUsers((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-slate-100 ring-1 ring-white/10 transition hover:border-cyan-300/40 hover:text-cyan-100 lg:hidden"
                aria-expanded={showMobileUsers}
                aria-controls="mobile-users-panel"
              >
                <span aria-hidden="true">👥</span>
                <span>الأعضاء</span>
              </button>
            </div>
          </header>

          {!username ? (
            <form onSubmit={joinChat} className="mx-auto grid h-full w-full max-w-md content-center gap-4 px-6 py-14">
              {/* الترحيب والشرح */}
              <div className="mb-8 text-center">
                <h1 className="mb-4 text-4xl font-bold bg-linear-to-r from-cyan-400 via-sky-400 to-amber-300 bg-clip-text text-transparent">
                  ELFAR CHAT
                </h1>
                <p className="text-cyan-100 font-semibold mb-1">يرحب بكم 🎉</p>
                <p className="text-amber-300 font-semibold mb-6">محادثة سعيدة ✨</p>
                
                <div className="bg-cyan-300/10 border border-cyan-200/30 rounded-xl p-4 text-left text-sm">
                  <p className="text-cyan-100 font-semibold mb-2">✨ منصة دردشة فورية</p>
                  <p className="text-slate-300 text-xs mb-2">تطبيق دردشة حديث للتحدث مع الآخرين في الوقت الفعلي</p>
                  <p className="text-slate-400 text-xs">🔨 تطوير: <span className="text-amber-300">ENG Mostafa ELFAR</span></p>
                </div>
              </div>

              {/* حقل الاسم */}
              <div>
                <label htmlFor="username" className="mb-2 block text-sm font-medium text-cyan-100">
                  اختر اسمك
                </label>
                <input
                  id="username"
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="مثال: أحمد"
                  maxLength={20}
                  autoFocus
                  className="w-full rounded-2xl border border-white/15 bg-slate-900/75 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30"
                />
              </div>

              {/* زر الدخول */}
              <button
                type="submit"
                disabled={!canJoin || !isConnected}
                className="rounded-2xl bg-linear-to-r from-cyan-400 via-sky-400 to-amber-300 px-5 py-3 font-semibold text-slate-900 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
              >
                ادخل الدردشة
              </button>

              {/* تنبيه إذا كان السيرفر معطل */}
              {!isConnected && (
                <p className="text-xs text-rose-400 text-center">
                  ⚠️ {connectionError ? `فشل الاتصال بالسيرفر: ${connectionError}` : "جاري محاولة الاتصال بالسيرفر... يرجى الانتظار"}
                </p>
              )}
            </form>
          ) : (
            <>
              {showMobileUsers ? (
                <div id="mobile-users-panel" className="border-b border-white/10 bg-slate-950/55 px-6 py-4 lg:hidden">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">المتصلين الآن</p>
                      <h3 className="mt-1 text-base font-semibold text-white">الأعضاء</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMobileUsers(false)}
                      className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200 transition hover:border-cyan-300/40 hover:text-cyan-100"
                    >
                      إغلاق ✕
                    </button>
                  </div>

                  <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                    {onlineUsers.length ? (
                      onlineUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/65 px-3 py-2">
                          <span className="flex items-center gap-2">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-300/20 text-xs font-semibold text-cyan-100">
                              {user.name?.slice(0, 1)?.toUpperCase() || "U"}
                            </span>
                            <span className="text-sm text-slate-100">{user.name}</span>
                          </span>
                          {user.id === socketId ? <span className="text-xs text-amber-300">أنت</span> : null}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">لا يوجد أعضاء متصلين الآن</p>
                    )}
                  </div>
                </div>
              ) : null}

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
                            {item.senderId === socketId ? `${item.sender} (أنت)` : item.sender}
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

              <form onSubmit={sendMessage} className="grid shrink-0 gap-3 border-t border-white/10 bg-slate-950/35 px-6 py-5 sm:grid-cols-[1fr_auto] grid-cols-1">
                <input
                  type="text"
                  value={message}
                  onChange={handleMessageChange}
                  placeholder="اكتب رسالتك هنا..."
                  maxLength={500}
                  className="w-full rounded-2xl border border-white/15 bg-slate-900/80 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-300/30"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || !isConnected}
                  className="rounded-2xl bg-amber-300 px-6 py-3 font-semibold text-slate-900 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  إرسال
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