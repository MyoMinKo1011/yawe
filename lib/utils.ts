import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)} ကီလိုမီတာ`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} စက္ကန့်`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} မိနစ်`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `${hours} နာရီ ${remainingMinutes} မိနစ်`
    : `${hours} နာရီ`;
}

export function placeTypeLabel(category: string): string {
  const labels: Record<string, string> = {
    restaurant: "စားသောက်ဆိုင်",
    hotel: "ဟိုတယ်",
    pagoda: "ဘုရားစေတီ",
    archaeological_site: "ရှေးဟောင်းသုတေသနနေရာ",
    monument: "အထိမ်းအမှတ်",
    attraction: "ဆွဲဆောင်မှု",
    ktv: "ကေတီဗွီ",
    transportation: "သယ်ယူပို့ဆောင်ရေး",
    convenience_store: "ကုန်စုံဆိုင်",
    pharmacy: "ဆေးဆိုင်",
    market: "စျေး",
    school: "ကျောင်း",
    hospital: "ဆေးရုံ",
    bank_atm: "ဘဏ် / ATM",
    police_station: "ရဲစခန်း",
    gas_station: "ဓာတ်ဆီဆိုင်",
    post_office: "စာတိုက်",
    park: "ပန်းခြံ",
    gym_fitness: "အားကစားခန်းမ",
    coffee_shop: "ကော်ဖီဆိုင်",
    bakery: "မုန့်ဆိုင်",
    salon: "အလှပြင်ဆိုင်",
  };
  return labels[category] ?? category;
}

export const PRICE_RANGE_LABELS: Record<string, string> = {
  $: "စျေးသက်သာ (< 5,000 Ks)",
  $$: "သင့်တင့် (5K - 15K Ks)",
  $$$: "စျေးများ (15K - 50K Ks)",
  $$$$: "စျေးကြီး (50,000+ Ks)",
};

export function formatPriceRange(value: string | null | undefined): string {
  if (!value) return "";
  return PRICE_RANGE_LABELS[value] ?? value;
}

export const PRICE_RANGE_OPTIONS = [
  { label: PRICE_RANGE_LABELS["$"], value: "$" },
  { label: PRICE_RANGE_LABELS["$$"], value: "$$" },
  { label: PRICE_RANGE_LABELS["$$$"], value: "$$$" },
  { label: PRICE_RANGE_LABELS["$$$$"], value: "$$$$" },
];
