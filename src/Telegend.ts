import { Telechart } from './Telechart'
import { Telecolumn } from './Telecolumn'

export class Telegend {
    protected config = {
        borderColor: '#e6ecf0',
        textColor: '#43484b',
    }
    protected columns: Array<{ telecolumn: Telecolumn, element: HTMLElement }> = []
    protected element: HTMLElement
    private themeProperty: 'light'|'dark' = 'light'

    constructor(protected telechart: Telechart, parentElement: HTMLElement) {
        this.element = document.createElement('div')
        this.element.classList.add('telegend')
        this.element.style.color = this.config.textColor
        parentElement.appendChild(this.element)
    }

    get theme() {
        return this.themeProperty
    }

    set theme(value) {
        this.themeProperty = value
        if (value === 'dark') {
            this.config = {
                ...this.config,
                borderColor: '#344658',
                textColor: '#e8ecee',
            }
        } else {
            this.config = {
                ...this.config,
                borderColor: '#e6ecf0',
                textColor: '#43484b',
            }
        }
    }

    public addColumn(telecolumn: Telecolumn) {
        const element = document.createElement('div')
        element.classList.add('telegend-telement')
        element.style.display = 'inline-block'
        element.style.border = `1px ${this.config.borderColor} solid`
        element.style.fontSize = '15px'
        element.style.borderRadius = '100px'
        element.style.padding = '7px 15px 7px 8px'
        element.style.cursor = 'pointer'
        element.style.margin = `15px 13px 0 0`
        this.element.appendChild(element)

        const checkbox = document.createElement('div')
        checkbox.classList.add('telegend-element-checkbox')
        checkbox.style.display = 'inline-block'
        checkbox.style.border = `${telecolumn.color} 11px solid`
        checkbox.style.boxSizing = 'border-box'
        checkbox.style.borderRadius = '100px'
        checkbox.style.width = '22px'
        checkbox.style.height = '22px'
        checkbox.style.marginRight = '10px'
        checkbox.style.verticalAlign = 'middle'
        checkbox.style.position = 'relative'
        checkbox.style.transition = 'border-width .3s'

        const mark = document.createElement('div')
        mark.style.display = 'block'
        mark.style.opacity = '1'
        mark.style.position = 'absolute'
        mark.style.borderBottom = '2px solid #fff'
        mark.style.borderLeft = '2px solid #fff'
        mark.style.width = '8px'
        mark.style.height = '4px'
        mark.style.transform = 'rotate(-45deg)'
        mark.style.left = '-5px'
        mark.style.top = '-4px'
        mark.style.transition = 'left .3s, top .3s, opacity .3s'
        checkbox.append(mark)

        const label = document.createElement('div')
        label.classList.add('telegend-element-label')
        label.style.display = 'inline-block'
        label.style.verticalAlign = 'middle'
        label.innerText = telecolumn.name

        element.appendChild(checkbox)
        element.appendChild(label)
        element.addEventListener('click', () => {
            telecolumn.visible = !telecolumn.visible
            element.classList.toggle('visible', telecolumn.visible)
            mark.style.opacity = telecolumn.visible ? '1' : '0'
            if (telecolumn.visible) {
                mark.style.left = '-5px'
                mark.style.top = '-4px'
            } else {
                mark.style.left = '5px'
                mark.style.top = '4px'
            }
            checkbox.style.border = `${telecolumn.color} ${telecolumn.visible ? 11 : 2}px solid`
            setTimeout(() => {
                this.telechart.telecoordinator.recalcBorders(30)
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

    public draw() {
        this.element.childNodes.forEach(n => {
            if (n instanceof HTMLElement) {
                n.style.borderColor = this.config.borderColor
            }
        })
        this.element.style.color = this.config.textColor
    }

}
