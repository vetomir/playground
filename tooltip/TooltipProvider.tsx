"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import classNames from "classnames";

export type TooltipContent = string | string[] | React.ReactNode | Record<string, unknown>;

export type TooltipState = {
    text: TooltipContent;
} | null;

type TooltipContextType = {
    tooltip: TooltipState;
    showTooltip: (content: TooltipState) => void;
    hideTooltip: () => void;
};

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

/**
 * Custom hook to access tooltip context
 * @throws Error if used outside TooltipProvider
 */
export const useTooltip = () => {
    const context = useContext(TooltipContext);
    if (!context) {
        throw new Error("useTooltip must be used within a TooltipProvider");
    }
    return context;
};

type TooltipProviderProps = {
    children: ReactNode;
    containerId?: string;
    portalId?: string;
};

/**
 * Provider component for tooltip functionality
 * Manages tooltip state, rendering, and positioning
 *
 * @param children - Your application content
 * @param containerId - Optional container ID to constrain tooltip bounds
 * @param portalId - Optional portal element ID (default: "tooltip-portal")
 */
export const TooltipProvider = ({
                                    children,
                                    containerId,
                                    portalId = "tooltip-portal"
                                }: TooltipProviderProps) => {
    const [tooltip, setTooltip] = useState<TooltipState>(null);
    const [mounted, setMounted] = useState(false);
    const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
    const lastMousePosition = useRef<{ x: number; y: number } | null>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Memoize callbacks to prevent unnecessary re-renders
    const showTooltip = useCallback((content: TooltipState) => {
        setTooltip(content);
    }, []);

    const hideTooltip = useCallback(() => {
        setTooltip(null);
    }, []);

    const value = React.useMemo(
        () => ({ tooltip, showTooltip, hideTooltip }),
        [tooltip, showTooltip, hideTooltip]
    );

    // Initialize portal element on mount
    useEffect(() => {
        setMounted(true);

        let portal = document.getElementById(portalId);
        if (!portal) {
            portal = document.createElement("div");
            portal.id = portalId;
            portal.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 10000;
      `;
            document.body.appendChild(portal);
        }
        setPortalElement(portal);

        return () => {
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
        };
    }, [portalId]);

    /**
     * Updates tooltip position based on mouse coordinates
     * Handles edge detection and container boundaries
     */
    const updateTooltipPosition = useCallback((x: number, y: number) => {
        const tooltipElement = document.getElementById("tooltip");
        if (!tooltipElement) return;

        const tooltipRect = tooltipElement.getBoundingClientRect();
        const container = containerId ? document.getElementById(containerId) : null;

        let boundingRect: DOMRect;

        if (container) {
            boundingRect = container.getBoundingClientRect();
        } else {
            boundingRect = new DOMRect(0, 0, window.innerWidth, window.innerHeight);
        }

        const offset = 10;

        // Horizontal positioning (left/right)
        let tooltipLeft = x + offset;
        const maxRight = container ? boundingRect.right : window.innerWidth;
        const isLeft = x + tooltipRect.width + offset > maxRight;

        if (isLeft) {
            tooltipLeft = x - tooltipRect.width - offset;
        }

        // Vertical positioning (top/bottom)
        let tooltipTop = y + offset;
        const maxBottom = container ? boundingRect.bottom : window.innerHeight;
        const isTop = y + tooltipRect.height + offset > maxBottom;

        if (isTop) {
            tooltipTop = y - tooltipRect.height - offset;
        }

        // Constrain tooltip within container bounds
        if (container) {
            tooltipLeft = Math.max(
                boundingRect.left,
                Math.min(tooltipLeft, boundingRect.right - tooltipRect.width)
            );
            tooltipTop = Math.max(
                boundingRect.top,
                Math.min(tooltipTop, boundingRect.bottom - tooltipRect.height)
            );
        }

        // Apply CSS classes and styles
        tooltipElement.classList.toggle("tooltip-left", isLeft);
        tooltipElement.classList.toggle("tooltip-top", isTop);
        tooltipElement.style.transform = `translate(${tooltipLeft}px, ${tooltipTop}px)`;
        tooltipElement.style.left = "0px";
        tooltipElement.style.top = "0px";
    }, [containerId]);

    // Handle window and container resize events
    useEffect(() => {
        if (!tooltip) return;

        const handleResize = () => {
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }

            resizeTimeoutRef.current = setTimeout(() => {
                if (lastMousePosition.current) {
                    updateTooltipPosition(
                        lastMousePosition.current.x,
                        lastMousePosition.current.y
                    );
                }
            }, 100);
        };

        window.addEventListener("resize", handleResize);

        let resizeObserver: ResizeObserver | null = null;
        if (containerId) {
            const container = document.getElementById(containerId);
            if (container) {
                resizeObserver = new ResizeObserver(() => {
                    if (lastMousePosition.current) {
                        updateTooltipPosition(
                            lastMousePosition.current.x,
                            lastMousePosition.current.y
                        );
                    }
                });
                resizeObserver.observe(container);
            }
        }

        return () => {
            window.removeEventListener("resize", handleResize);
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
        };
    }, [tooltip, containerId, updateTooltipPosition]);

    // Handle mouse movement for tooltip positioning
    useEffect(() => {
        if (!tooltip) return;

        let animationFrameId: number;

        const handleMouseMove = (event: MouseEvent) => {
            lastMousePosition.current = { x: event.clientX, y: event.clientY };

            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }

            animationFrameId = requestAnimationFrame(() => {
                updateTooltipPosition(event.clientX, event.clientY);
            });
        };

        document.addEventListener("mousemove", handleMouseMove);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [tooltip, updateTooltipPosition]);

    // Render tooltip content
    const renderTooltip = () => {
        if (!mounted || !portalElement || !tooltip || typeof tooltip !== "object" || !("text" in tooltip)) {
            return null;
        }

        const { text } = tooltip;
        const contentType = Array.isArray(text) ? "list" : typeof text !== "string" ? "raw" : "text";

        let content;
        if (typeof text === "string") {
            content = <div>{text}</div>;
        } else if (Array.isArray(text)) {
            content = (
                <ul className="tooltip-list">
                    {text.map((item: string, index: number) => (
                        <li key={`tooltip-item-${index}`}>{item}</li>
                    ))}
                </ul>
            );
        } else {
            content = text;
        }

        return createPortal(
            <>
                <div
                    id="tooltip"
                    className={classNames("tooltip", `tooltip-${contentType}`)}
                    role="tooltip"
                    aria-hidden="false"
                >
                    {content}
                </div>
                <style jsx>{`
          .tooltip {
            position: fixed;
            background-color: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
            pointer-events: none;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            transition: opacity 0.2s ease-in-out;
            will-change: transform;
          }

          .tooltip-list {
            margin: 0;
            padding-left: 20px;
          }

          .tooltip-list li {
            margin: 4px 0;
          }
        `}</style>
            </>,
            portalElement
        );
    };

    return (
        <TooltipContext.Provider value={value}>
            {children}
            {renderTooltip()}
        </TooltipContext.Provider>
    );
};
