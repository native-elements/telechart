import { Telechart } from './Telechart'
import { Telecolumn } from './Telecolumn'

export class Telegend {
    protected columns: Array<{ telecolumn: Telecolumn, element: HTMLElement }> = []
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
        this.element.appendChild(element)

        const checkbox = document.createElement('div')
        checkbox.classList.add('telegend-element-checkbox')
        checkbox.style.borderColor = telecolumn.color

        const mark = document.createElement('div')
        checkbox.append(mark)

        const label = document.createElement('div')
        label.classList.add('telegend-element-label')
        label.innerText = telecolumn.name

        element.appendChild(checkbox)
        element.appendChild(label)
        element.addEventListener('click', () => {
            this.columns.forEach(c => c.telecolumn.setCurrentX(null))
            telecolumn.visible = !telecolumn.visible
            element.classList.toggle('visible', telecolumn.visible)
            setTimeout(() => {
                this.telechart.telecoordinator.recalcBorders(200)
                this.telechart.telemap.recalcBorders(200)
                this.telechart.redraw()
            }, 10)
        })
        this.columns.push({ telecolumn, element })
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
