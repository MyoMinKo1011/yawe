import type { ComponentType } from "react";
import type { NearbyPlace } from "@/lib/types";

export interface ComponentBlockProps {
  places: NearbyPlace[];
  [key: string]: unknown;
}

type ComponentRegistry = Record<
  string,
  ComponentType<ComponentBlockProps> | null
>;

let registry: ComponentRegistry = {};

export function registerComponent(
  type: string,
  component: ComponentType<ComponentBlockProps>
) {
  registry[type] = component;
}

export function getComponent(
  type: string
): ComponentType<ComponentBlockProps> | null {
  return registry[type] ?? null;
}

export function getComponentTypes(): string[] {
  return Object.keys(registry);
}
