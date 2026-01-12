"use client";

import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Tooltip.module.css";
import Tooltip from "./Tooltip";
import { tooltipAtom } from "@/app/atom/atoms";

export default function TooltipCore() {
    const [tooltip] = useAtom(tooltipAtom);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (tooltip) {
            let animationFrameId: number;

            const handleMouseMove = (event: MouseEvent) => {
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }

                animationFrameId = requestAnimationFrame(() => {
                    const tooltipElement = document.getElementById("tooltip");
                    if (tooltipElement) {
                        const x = event.clientX;
                        const y = event.clientY;
                        const tooltipRect = tooltipElement.getBoundingClientRect();
                        const windowWidth = window.innerWidth;
                        const windowHeight = window.innerHeight;

                        const offset = 0;

                        // Sprawdź pozycję w poziomie (lewo/prawo)
                        let tooltipLeft = x + offset;
                        const isLeft = x + tooltipRect.width + offset > windowWidth;

                        if (isLeft) {
                            tooltipLeft = x - tooltipRect.width - offset;
                        }

                        // Sprawdź pozycję w pionie (góra/dół)
                        let tooltipTop = y + offset;
                        const isTop = y + tooltipRect.height + offset > windowHeight;

                        if (isTop) {
                            tooltipTop = y - tooltipRect.height - offset;
                        }

                        // Dodaj/usuń klasy CSS
                        tooltipElement.classList.toggle(styles.left, isLeft);
                        tooltipElement.classList.toggle(styles.top, isTop);

                        tooltipElement.style.transform = `translate(${tooltipLeft}px, ${tooltipTop}px)`;
                        tooltipElement.style.left = "0px";
                        tooltipElement.style.top = "0px";
                    }
                });
            };

            document.addEventListener("mousemove", handleMouseMove);

            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
            };
        }
    }, [tooltip]);

    if (!mounted || !tooltip || typeof tooltip !== "object" || !("text" in tooltip))
        return null;

    return createPortal(
        <Tooltip text={tooltip.text as string} id="tooltip" />,
        document.body
    );
}
