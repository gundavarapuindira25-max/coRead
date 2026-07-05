import { useEffect, useRef, useState } from "react";
import client from "../api/client";

/**
 * Polls GET /api/clubs/{clubId}/messages every 5 seconds.
 * On first load fetches the last 50. Then only fetches new ones via ?since=.
 */
export function usePolling(clubId) {
  const [messages, setMessages] = useState([]);
  const lastTimestampRef = useRef(null);
  const intervalRef = useRef(null);

  const fetchMessages = async (initial = false) => {
    if (!clubId) return;
    try {
      const params = {};
      if (!initial && lastTimestampRef.current) {
        params.since = lastTimestampRef.current;
      }
      const res = await client.get(`/api/clubs/${clubId}/messages`, { params });
      const incoming = res.data;
      if (incoming.length > 0) {
        if (initial) {
          setMessages(incoming);
        } else {
          setMessages((prev) => [...prev, ...incoming]);
        }
        lastTimestampRef.current = incoming[incoming.length - 1].created_at;
      }
    } catch {
      // silently ignore poll errors
    }
  };

  useEffect(() => {
    if (!clubId) return;
    setMessages([]);
    lastTimestampRef.current = null;
    fetchMessages(true);

    intervalRef.current = setInterval(() => fetchMessages(false), 5000);
    return () => clearInterval(intervalRef.current);
  }, [clubId]);

  const addOptimistic = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };

  return { messages, addOptimistic };
}
