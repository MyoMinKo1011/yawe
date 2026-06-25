interface TextBlockProps {
  content: string;
}

export function TextBlock({ content }: TextBlockProps) {
  if (!content) return null;

  const formatted = content
    .replace(/\\n/g, "\n")
    .split("\n")
    .map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      const italic = bold.replace(/\*(.*?)\*/g, "<em>$1</em>");
      const link = italic.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener" class="text-primary underline">$1</a>'
      );
      return { __html: link, key: i };
    });

  return (
    <div className="text-sm leading-relaxed space-y-1 break-words [overflow-wrap:anywhere]">
      {formatted.map(({ __html, key }) => (
        <p key={key} dangerouslySetInnerHTML={{ __html }} />
      ))}
    </div>
  );
}
