export function TinyshelfBadge({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <a href="https://www.tinyshelf.co/?ref=hopup.lol" title="Featured on tinyshelf" className="shrink-0">
      <img
        src="https://www.tinyshelf.co/badge/tinyshelf-badge-light-amber-1cdea1ce.svg"
        alt="Featured on tinyshelf"
        width={216}
        height={64}
        className={className}
      />
    </a>
  );
}
