import Link from "next/link";

export default function NewTourPage() {
  return (
    <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 text-center">
      <h1 className="text-2xl font-bold mb-2">ခရီးစဉ် စီစဉ်ရန်</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Chat မှတစ်ဆင့် AI ကို ခရီးစဉ်စီစဉ်ခိုင်းပါ
      </p>
      <Link
        href="/"
        className="text-primary hover:underline text-sm font-medium"
      >
        Chat သို့သွားရန်
      </Link>
    </div>
  );
}
