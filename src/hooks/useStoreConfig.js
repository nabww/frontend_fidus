import { useEffect, useState } from "react";
import client from "../api/client";

// Public store config (delivery zones + free-delivery threshold), fetched once
// per page load and shared by every component that asks for it
let cached = null;
let inflight = null;

export default function useStoreConfig() {
  const [config, setConfig] = useState(cached);

  useEffect(() => {
    if (cached) return;
    inflight ||= client
      .get("/config")
      .then((res) => {
        const zones = res.data.shippingZones || [];
        cached = {
          zones,
          freeMin: Number(res.data.freeShippingMin) || 0,
          minFee: zones.length ? Math.min(...zones.map((z) => z.fee)) : null,
        };
        return cached;
      })
      .catch(() => {
        inflight = null;
        return null;
      });
    inflight.then((c) => c && setConfig(c));
  }, []);

  return config;
}
