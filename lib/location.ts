import type { GeoPosition } from "@/lib/types";

export function getGeolocation(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    if (typeof window !== "undefined" && !window.isSecureContext) {
      reject(
        new Error(
          "တည်နေရာ ရယူရန် HTTPS လိုအပ်ပါသည်။ localhost မှ ဖွင့်ရန် သို့မဟုတ် `npm run dev:https` ကို အသုံးပြုပါ။"
        )
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(
            new Error(
              "တည်နေရာ ခွင့်ပြုချက် ငြင်းပယ်ထားပါသည်။ ဘရောက်ဇာ ဆက်တင်များတွင် Location permission ကို Allow လုပ်ပေးပါ။"
            )
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          reject(
            new Error(
              "တည်နေရာ အချက်အလက် မရရှိပါ။ စက်ပစ္စည်း Location / GPS ဆက်တင်များ ဖွင့်ထားကြောင်း စစ်ဆေးပါ။"
            )
          );
        } else if (error.code === error.TIMEOUT) {
          reject(
            new Error(
              "တည်နေရာ ရှာဖွေချိန် ကြာသွားပါသည်။ GPS သို့မဟုတ် အင်တာနက် ဆက်သွယ်မှုကို စစ်ဆေးပြီး ထပ်မံကြိုးစားပါ။"
            )
          );
        } else {
          reject(error);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  });
}

export function calculateDistance(
  pos1: GeoPosition,
  pos2: GeoPosition
): number {
  const R = 6371;
  const dLat = toRad(pos2.lat - pos1.lat);
  const dLng = toRad(pos2.lng - pos1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(pos1.lat)) *
      Math.cos(toRad(pos2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
