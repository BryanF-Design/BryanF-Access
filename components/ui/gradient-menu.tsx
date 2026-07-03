"use client";
import React, { useState } from "react";

export interface GradientMenuItem {
  title: string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  href?: string;
  onClick?: () => void;
  external?: boolean;
}

interface GradientMenuProps {
  items: GradientMenuItem[];
}

export default function GradientMenu({ items }: GradientMenuProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <ul className="flex flex-row flex-nowrap gap-2 items-center">
      {items.map(({ title, icon, gradientFrom, gradientTo, href, onClick, external }, idx) => {
        const isActive = activeIndex === idx;
        const style = {
          "--gradient-from": gradientFrom,
          "--gradient-to": gradientTo,
        } as React.CSSProperties;

        const commonProps = {
          style,
          onMouseEnter: () => setActiveIndex(idx),
          onMouseLeave: () => setActiveIndex(null),
          onClick: () => {
            setActiveIndex(isActive ? null : idx);
            onClick?.();
          },
          className: `relative flex items-center justify-center cursor-pointer bg-white shadow-md rounded-full
            transition-all duration-500 h-10 md:h-[52px]
            ${isActive ? "w-[110px] md:w-[140px] shadow-none" : "w-10 md:w-[52px]"}`,
        };

        const content = (
          <>
            <span
              className="absolute inset-0 rounded-full transition-all duration-500"
              style={{
                background: `linear-gradient(45deg, ${gradientFrom}, ${gradientTo})`,
                opacity: isActive ? 1 : 0,
              }}
            />
            <span
              className="absolute top-[8px] inset-x-0 h-full rounded-full -z-10 blur-[12px] transition-all duration-500"
              style={{
                background: `linear-gradient(45deg, ${gradientFrom}, ${gradientTo})`,
                opacity: isActive ? 0.45 : 0,
              }}
            />
            <span
              className="relative z-10 transition-all duration-300"
              style={{
                color: isActive ? "white" : "#111111",
                transform: isActive ? "scale(0)" : "scale(1)",
              }}
            >
              <span className="text-lg md:text-xl">{icon}</span>
            </span>
            <span
              className="absolute text-white uppercase tracking-wide text-[10px] md:text-xs font-semibold transition-all duration-300 whitespace-nowrap"
              style={{
                opacity: isActive ? 1 : 0,
                transform: isActive ? "scale(1)" : "scale(0)",
              }}
            >
              {title}
            </span>
          </>
        );

        if (href) {
          return (
            <li key={idx}>
              <a
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                {...commonProps}
              >
                {content}
              </a>
            </li>
          );
        }

        return (
          <li key={idx}>
            <button type="button" {...commonProps}>
              {content}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
