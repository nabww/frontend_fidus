import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import client from "../api/client";

// GET a list and keep it fresh. Changing `params` aborts the in-flight request, so a slow
// earlier search can never overwrite a newer one. Old data stays visible while reloading.
export default function useList(path, params = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const key = JSON.stringify(params);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    client.get(path, { params: JSON.parse(key), signal: controller.signal })
      .then((res) => { setData(res.data); setError(""); })
      .catch((err) => { if (!axios.isCancel(err)) setError("Couldn't load this list."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [path, key, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, reload };
}
