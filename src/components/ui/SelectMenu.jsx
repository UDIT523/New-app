import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Fully themed single-select dropdown. Unlike a native <select>, the open menu
 * is styled to match the app (ink palette, soft shadow) and is portaled to the
 * body so it is never clipped by scrollable/overflow containers like tables.
 *
 * options: [{ value, label }]
 */
export default function SelectMenu({
  value,
  options = [],
  onChange,
  disabled = false,
  placeholder = "Select…",
  className,
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.bottom + 6, left: r.left, width: r.width });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const reposition = () => place();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e) => {
      if (
        !triggerRef.current?.contains(e.target) &&
        !menuRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (val) => {
    if (val !== value) onChange?.(val);
    setOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-900",
          "transition-all duration-150 ease-[var(--ease-out-soft)]",
          "hover:bg-ink-50 focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/10",
          "disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400 disabled:hover:bg-ink-50",
          className
        )}
      >
        <span className={cn("truncate", !selected && "text-ink-400")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-ink-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open &&
        rect &&
        createPortal(
          <ul
            ref={menuRef}
            role="listbox"
            style={{
              position: "fixed",
              top: rect.top,
              left: rect.left,
              width: rect.width,
            }}
            className="z-[95] max-h-56 overflow-auto rounded-xl border border-ink-100 bg-white p-1 shadow-[var(--shadow-lift)] animate-fade-in"
          >
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={active}
                  onClick={() => choose(opt.value)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-ink-100 font-medium text-ink-900"
                      : "text-ink-700 hover:bg-ink-50"
                  )}
                >
                  {opt.label}
                  {active && <Check className="h-4 w-4 text-ink-900" />}
                </li>
              );
            })}
          </ul>,
          document.body
        )}
    </>
  );
}
