"use client";

import { Button } from "@/components/ui/button";
import {
  Map,
  Route,
  Search,
  Share2,
  Bookmark,
} from "lucide-react";
import type { NearbyPlace } from "@/lib/types";
import type { DynamicRendererAction } from "@/components/chat/DynamicRenderer";

interface QuickAction {
  id: string;
  label: string;
  type: "save_all" | "plan_tour" | "show_on_map" | "more_like_this" | "share";
}

interface QuickActionsBlockProps {
  actions: QuickAction[];
  places: NearbyPlace[];
  onAction?: (action: DynamicRendererAction) => void;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  save_all: <Bookmark size={14} className="mr-1.5" />,
  plan_tour: <Route size={14} className="mr-1.5" />,
  show_on_map: <Map size={14} className="mr-1.5" />,
  more_like_this: <Search size={14} className="mr-1.5" />,
  share: <Share2 size={14} className="mr-1.5" />,
};

export function QuickActionsBlock({
  actions,
  places,
  onAction,
}: QuickActionsBlockProps) {
  if (!actions.length) return null;

  const handleAction = (action: QuickAction) => {
    if (!onAction) return;

    switch (action.type) {
      case "save_all":
        onAction({
          type: "save_place",
          payload: { places, label: action.label },
        });
        break;
      case "show_on_map":
        if (places.length > 0) {
          onAction({
            type: "show_directions",
            payload: { place: places[0] },
          });
        }
        break;
      case "plan_tour":
      case "more_like_this":
      case "share":
        onAction({
          type: "custom",
          payload: { label: action.label, actionType: action.type, places },
        });
        break;
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.id}
          size="sm"
          variant={action.type === "save_all" ? "default" : "outline"}
          onClick={() => handleAction(action)}
          className="text-xs"
        >
          {ACTION_ICONS[action.type]}
          {action.label}
        </Button>
      ))}
    </div>
  );
}
