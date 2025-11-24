import {useAtom} from 'jotai'
import {useEffect} from 'react'
import styles from '@/app/component/tooltip/tooltip.module.css'
import Tooltip from './Tooltip';
import {tooltipAtom} from "@/app/atom/atoms";



export default function TooltipCore() {
    const [tooltip] = useAtom(tooltipAtom)

    useEffect(() => {
        if (tooltip) {
            const handleMouseMove = (event: MouseEvent) => {
                const tooltipElement = document.getElementById('tooltip')
                if (tooltipElement) {
                    const x = event.clientX
                    const y = event.clientY

                    const tooltipWidth = tooltipElement.offsetWidth
                    const windowWidth = window.innerWidth
                    const tooltipLeft =
                        x + tooltipWidth + 10 > windowWidth
                            ? x - tooltipWidth
                            : x

                    if (x + tooltipWidth + 10 > windowWidth) {
                        tooltipElement.classList.add(styles.left)
                    } else {
                        tooltipElement.classList.remove(styles.left)
                    }

                    tooltipElement.style.left = `${tooltipLeft}px`
                    tooltipElement.style.top = `${y}px`
                }
            }

            document.addEventListener('mousemove', handleMouseMove)

            return () => {
                document.removeEventListener('mousemove', handleMouseMove)
            }
        }
    }, [tooltip])

    if (!tooltip || typeof tooltip !== 'object' || !('text' in tooltip))
        return null

    return <Tooltip text={tooltip.text as string} />
}
