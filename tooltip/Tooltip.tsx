"use client";

import React, {
    useCallback,
    useEffect,
    useRef,
    ComponentPropsWithoutRef,
    ElementType,
} from "react";
import classNames from "classnames";
import { useTooltip, TooltipContent } from "./TooltipContext";

type PolymorphicComponentProps<T extends ElementType, Props = object> = Props &
    Omit<ComponentPropsWithoutRef<T>, keyof Props> & {
    as?: T;
    text?: TooltipContent;
    href?: string;
    delay?: number;
};

type TooltipProps<T extends ElementType = "button"> = PolymorphicComponentProps<T>;

export default function ToolTip<T extends ElementType = "button">({
                                                                             text,
                                                                             href,
                                                                             as,
                                                                             children,
                                                                             className,
                                                                             delay = 300,
                                                                             ...props
                                                                         }: TooltipProps<T>) {
    const { showTooltip, hideTooltip } = useTooltip();
    const elementRef = useRef<HTMLElement | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = useCallback(() => {
        if (!text) return;

        timeoutRef.current = setTimeout(() => {
            showTooltip({ text });
        }, delay);
    }, [text, showTooltip, delay]);

    const handleMouseLeave = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        hideTooltip();
    }, [hideTooltip]);

    const handleFocus = useCallback(() => {
        if (text) {
            showTooltip({ text });
        }
    }, [text, showTooltip]);

    const handleBlur = useCallback(() => {
        hideTooltip();
    }, [hideTooltip]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (elementRef.current && !elementRef.current.contains(event.target as Node)) {
                hideTooltip();
            }
        };

        document.addEventListener("click", handleClickOutside);

        return () => {
            document.removeEventListener("click", handleClickOutside);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [hideTooltip]);

    const setRef = useCallback((node: HTMLElement | null) => {
        elementRef.current = node;
    }, []);

    const Component = (href ? "a" : as || "button") as ElementType;

    const componentProps = {
        ...(href && { href }),
        className: classNames("tooltip-wrapper", className),
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
        "aria-describedby": text ? "tooltip" : undefined,
        ...props,
    };

    return (
        <>
            <Component {...componentProps} ref={setRef}>{children}</Component>
            <style jsx>{`
        .tooltip-wrapper {
          display: inline-block;
          cursor: pointer;
        }
      `}</style>
        </>
    );
}
