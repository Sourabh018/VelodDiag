import { useState, useRef, useEffect } from "react";
import { Box, Typography, TextField, IconButton, CircularProgress, Paper } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import Header from "../components/Header";
import { useSelectedApp } from "../contexts/AppContext";
import apiClient from "../api/client";

function ChatBubble({ role, text }) {
  const isUser = role === "user";
  return (
    <Box sx={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 1.5 }}>
      <Paper
        variant="outlined"
        sx={{
          maxWidth: "72%",
          padding: "10px 14px",
          borderRadius: "10px",
          backgroundColor: isUser ? "rgba(91,124,255,0.1)" : "#111113",
          borderColor: isUser ? "rgba(91,124,255,0.2)" : "rgba(255,255,255,0.07)",
        }}
      >
        <Typography sx={{ fontSize: 14, color: isUser ? "#C3CCFF" : "#EDEDEF", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
          {text}
        </Typography>
      </Paper>
    </Box>
  );
}

function ChatPage() {
  const { selectedApp } = useSelectedApp();
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Ask me anything about your current findings, slow endpoints, or health score — I only answer from real data the rule engine has already flagged." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await apiClient.post("/api/chat", {
        question,
        applicationName: selectedApp,
      });
      setMessages((prev) => [...prev, { role: "assistant", text: res.data.answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", text: "Couldn't reach the server — try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      <Header />
      <Box sx={{ marginLeft: "220px", marginTop: "64px", padding: 4, display: "flex", flexDirection: "column", height: "calc(100vh - 64px)" }}>
        <Typography sx={{ fontSize: 16.5, fontWeight: 500, color: "#EDEDEF", marginBottom: 0.5 }}>
          Ask VeloxDiag
        </Typography>
        <Typography sx={{ fontSize: 13.5, color: "text.secondary", marginBottom: 3 }}>
          Natural-language questions, answered from real findings — not guessed.
        </Typography>

        <Box sx={{ flex: 1, overflowY: "auto", marginBottom: 2, paddingRight: 1 }}>
          {messages.map((m, i) => (
            <ChatBubble key={i} role={m.role} text={m.text} />
          ))}
          {loading && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, marginBottom: 1.5 }}>
              <CircularProgress size={14} sx={{ color: "text.disabled" }} />
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>Thinking…</Typography>
            </Box>
          )}
          <div ref={bottomRef} />
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="e.g. why is exams slow today?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#111113",
                fontSize: 14,
                "& fieldset": { borderColor: "rgba(255,255,255,0.07)" },
              },
            }}
          />
          <IconButton onClick={handleSend} disabled={loading || !input.trim()} sx={{ color: "#5B7CFF" }}>
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </>
  );
}

export default ChatPage;