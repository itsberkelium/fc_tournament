type StarRatingProps = {
  stars: number;
  className?: string;
};

export default function StarRating({ stars, className = "" }: StarRatingProps) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const full = i < Math.floor(stars);
        const half = !full && i < Math.ceil(stars) && stars % 1 !== 0;
        const empty = !full && !half;

        if (half) {
          return (
            <span key={i} className="relative inline-block text-2xl leading-none">
              <span className="text-muted-foreground/30">★</span>
              <span
                className="absolute inset-0 overflow-hidden text-primary"
                style={{ width: "50%" }}
              >
                ★
              </span>
            </span>
          );
        }

        return (
          <span
            key={i}
            className={`text-2xl leading-none ${full ? "text-primary" : "text-muted-foreground/30"}`}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}
