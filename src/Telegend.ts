import { Telechart } from './Telechart'
import { Telecolumn } from './Telecolumn'

export class Telegend {
    protected columns: Array<{ telecolumn: Telecolumn, element: HTMLElement, onClick: () => void }> = []
    protected element: HTMLElement
    private themeProperty: 'light'|'dark' = 'light'

    constructor(protected telechart: Telechart, parentElement: HTMLElement) {
        this.element = document.createElement('div')
        this.element.classList.add('telegend')
        parentElement.appendChild(this.element)
    }

    get theme() {
        return this.themeProperty
    }

    set theme(value) {
        this.themeProperty = value
        this.element.classList.toggle('dark', value === 'dark')
    }

    public addColumn(telecolumn: Telecolumn) {
        const element = document.createElement('div')
        element.classList.add('telegend-telement')
        if (telecolumn.visible) {
            element.classList.add('visible')
        }
        element.style.borderColor = telecolumn.color
        element.style.color = telecolumn.color
        this.element.appendChild(element)

        const back = document.createElement('div')
        back.style.color = telecolumn.color
        back.classList.add('telegend-element-back')

        const checkbox = document.createElement('div')
        checkbox.classList.add('telegend-element-checkbox')

        const label = document.createElement('div')
        label.classList.add('telegend-element-label')
        label.innerText = telecolumn.name

        element.appendChild(back)
        element.appendChild(checkbox)
        element.appendChild(label)
        let timeout: number|undefined
        const onClick = () => {
            this.columns.forEach(c => c.telecolumn.setCurrentX(null))
            telecolumn.visible = !telecolumn.visible
            element.classList.toggle('visible', telecolumn.visible)
            this.telechart.teledisplay.recalcBorders(200)
            this.telechart.telemap.recalcBorders(200)
            this.telechart.redraw()
        }
        const onDown = () => {
            if (timeout) {
                return
            }
            timeout = setTimeout(() => {
                timeout = undefined
                this.columns.forEach(c => c.telecolumn.visible = true)
                telecolumn.visible = false
                this.columns.forEach(c => c.onClick())
            }, 500)
        }
        const onUp = () => {
            if (timeout) {
                clearTimeout(timeout)
                timeout = undefined
                onClick()
            }
        }
        const onMove = () => {
            if (timeout) {
                clearTimeout(timeout)
                timeout = undefined
            }
        }
        element.addEventListener('touchstart', onDown)
        element.addEventListener('mousedown', onDown)
        element.addEventListener('mouseup', onUp)
        element.addEventListener('touchmove', onMove)
        element.addEventListener('mousemove', onMove)
        this.columns.push({ telecolumn, element, onClick })
    }

    public removeColumn(column: Telecolumn) {
        this.columns.forEach((c, i) => {
            if (c.telecolumn === column) {
                this.element.removeChild(c.element)
                this.columns.splice(i, 1)
            }
        })
    }

    public draw() {/**/}

}
