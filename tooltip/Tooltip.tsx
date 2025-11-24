import React, {useMemo} from 'react'
import styles from '@/app/component/tooltip/tooltip.module.css'
import classNames from "classnames";

type TooltipProps = {
    text: string | string[] | React.ReactNode
}

const Tooltip: React.FC<TooltipProps> = ({text}) => {

    const className = useMemo(() => {
        if (Array.isArray(text))
            return styles.list

        if (typeof text !== 'string')
            return styles.raw

        return styles.text
    }, [text])

    const content = useMemo(() => {
            if (typeof text === 'string')
                return <div>{text}</div>

            if (Array.isArray(text))
                return (
                    <ul>
                        {text.map((x: string, index: number) => (
                            <li key={`tooltip-list-${index}`}>{x}</li>
                        ))}
                    </ul>
                )

            return text
        }, [text]
    )

    return (
        <div id="tooltip" className={classNames(styles.abc, className)}>
            {content}
        </div>
    )
}

export default Tooltip
