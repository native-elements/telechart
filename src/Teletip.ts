import { Telechart } from './Telechart'

export class Teletip {
    protected config!: { backgroundColor: string, borderColor: string, color: string }
    protected readonly element: HTMLDivElement
    private themeProperty: 'light'|'dark' = 'light'

    constructor(protected readonly telechart: Telechart, parentElement: HTMLElement) {
        this.theme = telechart.theme
        const element = this.element = document.createElement('div')
        element.classList.add('telechart-tip')
        element.style.position = 'absolute'
        element.style.border = `${this.config.borderColor} 1px solid`
        element.style.background = this.config.backgroundColor
        element.style.boxShadow = '1px 1px 4px rgba(0, 0, 0, .1)'
        element.style.borderRadius = `10px`
        element.style.transition = '.1s'
        element.style.padding = `7px 12px`
        element.style.whiteSpace = 'nowrap'
        element.style.fontSize = `13px`
        element.style.color = this.config.color
        this.hide()
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
                backgroundColor: '#253241',
                borderColor: '#202a37',
                color: '#fff',
            }
        } else {
            this.config = {
                ...this.config,
                backgroundColor: '#fff',
                borderColor: '#e3e3e3',
                color: '#222',
            }
        }
    }

    public show() {
        this.element.style.display  = 'block'
    }

    public hide() {
        this.element.style.display = 'none'
    }

    public setCoordinates(value: [number, number]) {
        let left = value[0] - 20
        if (left < 0) {
            left = 0
        }
        this.element.style.display = 'block'
        if (left + this.element.offsetWidth > this.telechart.telecanvas.width) {
            left = this.telechart.telecanvas.width - this.element.offsetWidth
        }
        this.element.style.left = `${left}px`
        this.element.style.top = `${value[1]}px`
    }

    public setContent(content: { title: string, values: Array<{ name: string, color: string, value: number }> }) {
        const titleDiv = document.createElement('div')
        titleDiv.classList.add('telechart-tip-title')
        titleDiv.innerText = content.title
        titleDiv.style.marginBottom = `12px`
        this.element.innerHTML = ''
        this.element.appendChild(titleDiv)

        content.values.forEach(val => {
            const div = document.createElement('div')
            div.classList.add('telechart-tip-value')
            div.style.color = val.color
            div.style.display = 'inline-block'
            div.style.marginRight = `10px`

            const b = document.createElement('b')
            b.innerText = String(val.value)
            b.style.display = 'block'
            b.style.fontSize = '1.2em'
            b.style.lineHeight = '.95em'
            div.appendChild(b)

            const s = document.createElement('span')
            s.innerText = val.name
            s.style.fontSize = '.85em'
            div.appendChild(s)

            this.element.appendChild(div)
        })
    }

    public draw() {
        this.element.style.borderColor = this.config.borderColor
        this.element.style.background = this.config.backgroundColor
        this.element.style.color = this.config.color
    }

}
