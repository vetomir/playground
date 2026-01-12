"use client";

import React, {ComponentPropsWithoutRef, ElementType, useCallback, useEffect, useRef,} from "react";
import {useSetAtom} from "jotai";
import styles from "./Tooltip.module.css";
import classNames from "classnames";
import {tooltipAtom} from "@/app/atom/atoms";

export type TooltipContent = string | string[] | React.ReactNode | Record<string, unknown>;

type PolymorphicComponentProps<T extends ElementType, Props = object> = Props &
    Omit<ComponentPropsWithoutRef<T>, keyof Props> & {
    as?: T;
    text?: TooltipContent;
    href?: string;
    delay?: number;
};

type TooltipProps<T extends ElementType = "button"> = PolymorphicComponentProps<T>;

export default function ToolTipWrapper<T extends ElementType = "button">(
    {
        text,
        href,
        as,
        children,
        className,
        delay = 0,
        ...props
    }: TooltipProps<T>) {
    const setTooltip = useSetAtom(tooltipAtom);
    const elementRef = useRef<HTMLElement | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = useCallback(() => {
        if (text) {
            timeoutRef.current = setTimeout(() => {
                setTooltip({text});
            }, delay);
        }
    }, [text, setTooltip, delay]);

    const handleMouseLeave = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setTooltip(null);
    }, [setTooltip]);

    const handleFocus = useCallback(() => {
        if (text) setTooltip({text});
    }, [text, setTooltip]);

    const handleBlur = useCallback(() => {
        setTooltip(null);
    }, [setTooltip]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (elementRef.current && !elementRef.current.contains(event.target as Node)) {
                setTooltip(null);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [setTooltip]);

    const setRef = useCallback((node: HTMLElement | null) => {
        elementRef.current = node;
    }, []);

    const Component = (href ? "a" : as || "button") as ElementType;

    const componentProps = {
        ...(href && {href}),
        className: classNames(styles.toolTipWrapper, className),
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
        "aria-describedby": text ? "tooltip" : undefined,
        ...props,
    };

    return <Component {...componentProps} ref={setRef}>{children}</Component>;
}
