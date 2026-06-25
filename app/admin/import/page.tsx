"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download, Upload } from "lucide-react";

export default function ImportExportPage() {
  const router = useRouter();
  const [jsonText, setJsonText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState("");

  async function handleExport() {
    const res = await fetch("/api/admin/places?limit=1000");
    if (!res.ok) return;
    const data = await res.json();
    const exportData = data.places.map(
      ({ id, created_at, updated_at, ...rest }: Record<string, unknown>) => rest
    );
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `places_backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (!jsonText.trim()) return;
    setImporting(true);
    setImportResult("");
    try {
      const places = JSON.parse(jsonText);
      if (!Array.isArray(places)) throw new Error("JSON must be an array");
      let success = 0;
      let failed = 0;
      for (const place of places) {
        const res = await fetch("/api/admin/places", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(place),
        });
        if (res.ok) success++;
        else failed++;
      }
      setImportResult(`Imported ${success} place${success !== 1 ? "s" : ""}${failed > 0 ? ` (${failed} failed)` : ""}`);
      router.refresh();
    } catch (e) {
      setImportResult(`Error: ${(e as Error).message}`);
    }
    setImporting(false);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setJsonText(reader.result as string);
    reader.readAsText(file);
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 min-w-0">
      <div>
        <h1 className="text-xl font-bold">Import / Export</h1>
        <p className="text-sm text-muted-foreground mt-1">Backup or bulk import place data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download size={18} />
              Export
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Download all places as JSON. Excludes internal IDs and timestamps.
            </p>
            <Button onClick={handleExport}>
              <Download size={14} className="mr-1" />
              Export JSON
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload size={18} />
              Import
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a JSON file or paste below. Each object needs: category, name, lat, lng.
            </p>
            <div className="space-y-3">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-border file:bg-background file:text-sm file:font-medium hover:file:bg-muted"
              />
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                rows={8}
                placeholder='[{"category":"restaurant","name":"Example","lat":18.8244,"lng":95.2179}]'
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
              {importResult && (
                <p className={cn("text-sm", importResult.startsWith("Error") ? "text-destructive" : "text-green-600")}>
                  {importResult}
                </p>
              )}
              <Button onClick={handleImport} disabled={importing || !jsonText.trim()}>
                <Upload size={14} className="mr-1" />
                {importing ? "Importing..." : "Import JSON"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
