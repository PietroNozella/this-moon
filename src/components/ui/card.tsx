import {
  cloneElement,
  isValidElement,
  type HTMLAttributes,
  type ReactElement,
} from "react";

import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  important?: boolean;
  clickable?: boolean;
  asChild?: boolean;
};

export function Card({
  className,
  important,
  clickable,
  asChild,
  children,
  ...props
}: CardProps) {
  const classes = cn(
    "border border-slate-200 bg-white shadow-sm ring-1 ring-black/[0.02]",
    important ? "rounded-3xl shadow-md" : "rounded-2xl",
    clickable &&
      "cursor-pointer transition-all duration-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5",
    className,
  );

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<Record<string, unknown>>;
    return cloneElement(child, {
      className: cn(classes, child.props.className as string | undefined),
      ...props,
    });
  }

  return (
    <section className={classes} {...props}>
      {children}
    </section>
  );
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-base font-semibold text-slate-900", className)}
      {...props}
    />
  );
}
