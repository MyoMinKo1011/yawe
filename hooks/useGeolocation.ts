"use client";

import { useState, useCallback, useRef } from "react";
import type { GeoPosition } from "@/lib/types";

export function useGeolocation() {
  const [location, setLocation] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState(false);
  const activeRef = useRef(false);

  const getLocation = useCallback(() => {
    if (typeof navigator === "undefined") {
      setError("Browser not supported");
      return;
    }

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError(
        "တည်နေရာ ရယူရန် HTTPS လိုအပ်ပါသည်။ localhost မှ ဖွင့်ရန် သို့မဟုတ် `npm run dev:https` ကို အသုံးပြုပါ။"
      );
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation not supported by this browser");
      return;
    }

    activeRef.current = true;
    setLoading(true);
    setError(null);
    setDenied(false);

    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((perm) => {
          if (!activeRef.current) return;
          if (perm.state === "denied") {
            setDenied(true);
            setError(buildPermissionDeniedMessage());
            setLoading(false);
            return;
          }
          requestFastPosition();
        })
        .catch((err) => {
          console.warn("[useGeolocation] permissions.query failed", err);
          if (!activeRef.current) return;
          requestFastPosition();
        });
    } else {
      requestFastPosition();
    }

    function requestFastPosition() {
      if (!activeRef.current) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!activeRef.current) return;
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setLocation(coords);
          setLoading(false);
          requestHighAccuracy();
        },
        (err) => {
          if (!activeRef.current) return;
          handleError(err);
        },
        {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 300000,
        }
      );
    }

    function requestHighAccuracy() {
      const highAccuracyOpts: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 60000,
      };

      const run = () => {
        if (!activeRef.current) return;
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!activeRef.current) return;
            setLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
          },
          (err) => {
            // High-accuracy refinement is optional; keep the fast position.
            console.warn("[useGeolocation] high-accuracy refine failed", err);
          },
          highAccuracyOpts
        );
      };

      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(run);
      } else {
        setTimeout(run, 200);
      }
    }

    function handleError(err: GeolocationPositionError) {
      switch (err.code) {
        case err.PERMISSION_DENIED:
          setDenied(true);
          setError(buildPermissionDeniedMessage());
          break;
        case err.POSITION_UNAVAILABLE:
          setError("တည်နေရာ အချက်အလက် မရရှိပါ။ စက်ပစ္စည်း Location / GPS ဆက်တင်များ ဖွင့်ထားကြောင်း စစ်ဆေးပါ။");
          break;
        case err.TIMEOUT:
          setError("တည်နေရာ ရှာဖွေချိန် ကြာသွားပါသည်။ GPS သို့မဟုတ် အင်တာနက် ဆက်သွယ်မှုကို စစ်ဆေးပြီး ထပ်မံကြိုးစားပါ။");
          break;
        default:
          setError(err.message);
      }
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    activeRef.current = false;
    setLoading(false);
    setError(null);
    setDenied(false);
  }, []);

  return { location, error, loading, denied, getLocation, reset };
}

function buildPermissionDeniedMessage(): string {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(
    typeof navigator !== "undefined" ? navigator.userAgent : ""
  );
  if (isMobile) {
    return "တည်နေရာ ခွင့်ပြုချက် ငြင်းပယ်ထားပါသည်။ ဘရောက်ဇာ ဆက်တင်များ > Location > ဤ site အတွက် Allow သို့မဟုတ် စက်ပစ္စည်း GPS ကို ဖွင့်ပေးပါ။";
  }
  return "တည်နေရာ ခွင့်ပြုချက် ငြင်းပယ်ထားပါသည်။ လိပ်စာဘား၏ 🔒 lock icon > Site settings > Location ကို Allow သို့မဟုတ် စက်ပစ္စည်း Location ဆက်တင်များ ဖွင့်ပေးပါ။";
}
