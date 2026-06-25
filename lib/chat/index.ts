import OpenAI from "openai";
import type { AIResponse, NearbyPlace, GeoPosition, UIComponent, UIComponentType } from "@/lib/types";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      baseURL: "https://api.deepseek.com",
      apiKey: process.env.DEEPSEEK_API_KEY!,
      timeout: 25000,
      maxRetries: 1,
    });
  }
  return client;
}

const SYSTEM_PROMPT = [
  "သင်သည် ပြည်မြို့အတွက် ဖော်ရွေပြီး ဗဟုသုတရှိသော local guide တစ်ဦးဖြစ်သည်။",
  "ခရီးသွားများအား စားသောက်ဆိုင်များ၊ ဟိုတယ်များ၊ ဘုရားစေတီများ၊ ဆွဲဆောင်မှုများနှင့် ဝန်ဆောင်မှုများကို ရှာဖွေရန် ကူညီပေးပါ။",
  "",
  "စည်းကမ်းချက်များ (တင်းကျပ်စွာ လိုက်နာပါ):",
  "1. available_places ထဲမှ နေရာများကိုသာ အသုံးပြုပါ။ နေရာအသစ်များ လုပ်ကြံမထည့်ပါနှင့်။",
  "2. မေးခွန်းကို ဖြေရန် အချက်အလက်မလုံလောက်ပါက ရိုးသားစွာ ပြောပါ။",
  "3. နေရာများကို အကြံပြုသည့်အခါ အဆင့်၊ စျေးနှုန်း၊ အကွာအဝေး စသည့် အကြောင်းရင်းကို ဖော်ပြပါ။",
  "4. သင်၏တုံ့ပြန်မှုတစ်ခုလုံးကို RAW JSON OBJECT အဖြစ်သာ ရေးပါ။ markdown code fences မသုံးရ။",
  "5. မြန်မာဘာသာဖြင့်သာ ပြန်ဖြေပါ။",
  "6. quick_actions component ကို လုံးဝ မသုံးရ။",
  "",
  "UI Components (place_cards, place_detail တွင် လမ်းညွှန်နှင့်သိမ်းရန်ခလုတ်များ အလိုလျောက်ပါသည်):",
  '  {"type": "text",      "props": {"content": "..."}}',
  '  {"type": "map",       "props": {"center": {"lat":N,"lng":N}, "zoom":N, "markers":[{...}]}}',
  '  {"type": "place_cards",   "props": {"title":"...", "places":[{...}], "layout":"scroll|grid|list"}}',
  '  {"type": "place_detail",  "props": {"place": {...}}}',
  '  {"type": "tour_timeline", "props": {"title":"...", "stops":[{place_id, stop_order, estimated_duration_min, tips}]}}',
  '  {"type": "comparison",    "props": {"title":"...", "columns":["","Name1","Name2"], "rows":[{label, values}]}}',
  '  {"type": "image_gallery", "props": {"title":"...", "images":["url1","url2"]}}',
  "",
  "RESPONSE FORMAT — Your entire response MUST be exactly this JSON object:",
  '{',
  '  "reply": "your text message to the user in Burmese",',
  '  "ui_components": [',
  '    // one or more of the UI component objects listed above',
  '  ],',
  '  "places": []',
  '}',
  'The "reply" field is REQUIRED. It should contain the text answer.',
  'The "ui_components" array must contain at least one component (usually starting with a "text" component).',
  'ALWAYS include a "text" component as the first item in ui_components with the same text as "reply".',
  "",
  "ယနေ့ရက်စွဲ: " + new Date().toISOString().split("T")[0],
].join("\n");

import { INTENT_PROMPT, type SearchIntent } from "@/lib/chat/intent";

export async function extractIntent(message: string): Promise<SearchIntent | null> {
  try {
    const response = await getClient().chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: INTENT_PROMPT },
        { role: "user", content: message },
      ],
      temperature: 0.1,
      max_tokens: 512,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim();
    }

    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]) as SearchIntent;
  } catch {
    return null;
  }
}

export async function chatWithAI(
  message: string,
  availablePlaces: NearbyPlace[],
  location: GeoPosition | null,
  conversationHistory?: { role: "user" | "assistant"; content: string }[]
): Promise<AIResponse> {
  const placesContext =
    availablePlaces.length > 0
      ? `\n\nAvailable places (from database, use ONLY these):\n${JSON.stringify(
          availablePlaces.slice(0, 20).map((p) => {
            const d = p.data as Record<string, unknown> ?? {};
            return {
              category: p.category,
              place_id: p.place_id,
              name: p.name,
              lat: p.lat,
              lng: p.lng,
              address: p.address,
              rating: p.rating,
              distance_km: p.distance_km,
              duration_min: Math.round((p.duration_sec ?? 0) / 60),
              ...(d.cuisine_type ? { cuisine_type: d.cuisine_type } : {}),
              ...(d.price_range ? { price_range: d.price_range } : {}),
              ...(d.opening_hours ? { opening_hours: d.opening_hours } : {}),
              ...(d.star_rating ? { star_rating: d.star_rating } : {}),
              ...(d.sub_category ? { sub_category: d.sub_category } : {}),
            };
          }),
          null,
          2
        )}`
      : "";

  const locationContext = location
    ? `\nUser's current location: lat=${location.lat}, lng=${location.lng}`
    : "";

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...(conversationHistory ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    {
      role: "user",
      content: `${message}${placesContext}${locationContext}`,
    },
  ];

  const response = await getClient().chat.completions.create({
    model: "deepseek-chat",
    messages,
    temperature: 0.7,
    max_tokens: 4096,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return {
      reply: "ဝမ်းနည်းပါသည်။ တောင်းဆိုမှုကို လုပ်ဆောင်၍မရပါ။ ထပ်မံကြိုးစားပါ။",
      ui_components: [
        {
          type: "text",
          props: {
            content: "ဝမ်းနည်းပါသည်။ တောင်းဆိုမှုကို လုပ်ဆောင်၍မရပါ။ ထပ်မံကြိုးစားပါ။",
          },
        },
      ],
      places: availablePlaces,
    };
  }

  try {
    let jsonStr = content.trim();

    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim();
    }

    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        reply: content,
        ui_components: [{ type: "text", props: { content } }],
        places: availablePlaces,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

    let ui_components: UIComponent[] = [];
    let reply = "";

    if (Array.isArray(parsed.ui_components)) {
      reply = typeof parsed.reply === "string" ? parsed.reply : "";
      ui_components = parsed.ui_components.map((c) => ({
        type: (c as Record<string, unknown>).type as UIComponentType || "text",
        props: ((c as Record<string, unknown>).props as Record<string, unknown>) ?? {},
      }));
    } else if (typeof parsed.type === "string" && parsed.props) {
      ui_components = [{
        type: parsed.type as UIComponentType,
        props: parsed.props as Record<string, unknown>,
      }];
      reply = typeof parsed.reply === "string" ? parsed.reply : "";
    } else if (typeof parsed.reply === "string") {
      reply = parsed.reply;
      ui_components = [{ type: "text", props: { content: reply } }];
    } else {
      ui_components = [{ type: "text", props: { content: content } }];
      reply = content;
    }

    const enrichedPlaces = ui_components.flatMap((c) => {
      if (c.type === "place_cards" && c.props?.places) {
        return c.props.places as NearbyPlace[];
      }
      if (c.type === "place_detail" && c.props?.place) {
        return [c.props.place as NearbyPlace];
      }
      return [];
    });

    return {
      reply: reply || (ui_components[0]?.props?.content as string) || content,
      ui_components: ui_components.map((c) => ({
        ...c,
        props: c.props ?? {},
      })),
      places: enrichedPlaces.length > 0 ? enrichedPlaces : availablePlaces,
    };
  } catch {
    return {
      reply: content,
      ui_components: [{ type: "text", props: { content } }],
      places: availablePlaces,
    };
  }
}

export async function generateTour(
  message: string,
  selectedPlaces: NearbyPlace[],
  location: GeoPosition
): Promise<AIResponse> {
  const tourPrompt = `Plan a tour itinerary for Pyay, Myanmar. The user wants: "${message}"
Starting from: lat=${location.lat}, lng=${location.lng}
Selected places: ${JSON.stringify(
    selectedPlaces.map((p) => ({
      name: p.name,
      category: p.category,
      lat: p.lat,
      lng: p.lng,
      description: p.description,
      distance_km: p.distance_km,
      duration_min: Math.round((p.duration_sec ?? 0) / 60),
      data: p.data,
    }))
  )}

Create a logical route visiting these places. Include:
- Order of stops with estimated durations
- Travel tips between stops
- A tour title and description
- Use the tour_timeline UI component to show the itinerary
- Use the map component to show the route`;

  return chatWithAI(tourPrompt, selectedPlaces, location);
}
