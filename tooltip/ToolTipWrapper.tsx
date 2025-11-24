"use client";

import React, {ComponentType, forwardRef, ReactNode, useEffect, useRef,} from "react";
import {useSetAtom} from "jotai";
import {JSX} from "react/jsx-runtime";
import styles from '@/app/component/tooltip/tooltip.module.css'
import classNames from "classnames";
import IntrinsicElements = JSX.IntrinsicElements;
import {tooltipAtom} from "@/app/atom/atoms";

export type TooltipContent =
    | string
    | string[]
    | ReactNode
    | Record<string, unknown>;

type TooltipType = {
    text?: TooltipContent;
    href?: string;
    Type?: keyof IntrinsicElements | ComponentType | Element;
    children?: React.ReactNode;
    className?: string;
    [key: string]: unknown;
};

// Komponent pomocniczy do obsługi różnych typów elementów
const ForwardedComponent = forwardRef<
    HTMLElement,
    {
        Component: ComponentType;
        props: Record<string, unknown>;
        children: ReactNode;
    }
>(({Component, props, children}, ref) => {
    const componentProps = {...props, ref} as Record<string, unknown>;
    return React.createElement(Component, componentProps, children);
});
ForwardedComponent.displayName = "ForwardedComponent";

export default function ToolTipWrapper({
                                           text,
                                           href = "",
                                           Type = "button" as keyof JSX.IntrinsicElements,
                                           children,
                                           className,
                                           ...props
                                       }: TooltipType) {
    const setTooltip = useSetAtom(tooltipAtom);
    const elementRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                elementRef.current &&
                !elementRef.current.contains(event.target as Node)
            ) {
                setTooltip(null);
            }
        };

        document.addEventListener("click", handleClickOutside);

        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, [setTooltip]);

    const Component = href ? "a" : Type;

    // Obsługa elementów HTML (string)
    if (typeof Component === "string") {
        return React.createElement(
            Component,
            {
                ...(href ? {href} : {}),
                className: classNames(styles.toolTipWrapper, className),
                onMouseEnter: () => text && setTooltip({text}),
                onMouseLeave: () => setTooltip(null),
                ref: elementRef,
                ...props,
            },
            children
        );
    }

    return (
        <ForwardedComponent
            Component={Component as ComponentType}
            props={{
                ...(href ? {href} : {}),
                className: classNames(styles.toolTipWrapper, className),
                onMouseEnter: () => text && setTooltip({text: text}),
                onMouseLeave: () => setTooltip(null),
                ...props,
            }}
            ref={elementRef}
        >
            {children}
        </ForwardedComponent>
    );
}
