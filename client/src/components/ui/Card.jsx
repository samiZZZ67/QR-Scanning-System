/**
 * Card — simple surface container with brand shadow and border.
 */
export default function Card({ children, className = "", onClick }) {
  return (
    <div
      className={[
        "bg-surface rounded-2xl shadow-card border border-gold-muted/30",
        onClick ? "cursor-pointer" : "",
        className,
      ].join(" ")}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
