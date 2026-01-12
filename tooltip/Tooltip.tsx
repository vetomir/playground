import React, { useMemo } from "react";
import styles from "./Tooltip.module.css";
import classNames from "classnames";

type TooltipProps = {
    text: string | string[] | React.ReactNode;
    id: string;
};

const Tooltip: React.FC<TooltipProps> = ({ text, id }) => {
    const className = useMemo(() => {
        if (Array.isArray(text)) return styles.list;

        if (typeof text !== "string") return styles.raw;

        return styles.text;
    }, [text]);

    const content = useMemo(() => {
        if (typeof text === "string") return <div>{text}</div>;

        if (Array.isArray(text))
            return (
                <ul>
                    {text.map((x: string, index: number) => (
                        <li key={`tooltip-list-${index}`}>{x}</li>
                    ))}
                </ul>
            );

        return text;
    }, [text]);

    return (
        <div
            id={id}
            className={classNames(styles.tooltip, className)}
            role="tooltip"
            aria-hidden="false"
        >
            {content}
        </div>
    );
};

export default Tooltip;
