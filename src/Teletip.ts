import { Telechart } from './Telechart'

export class Teletip {
    protected readonly element: HTMLDivElement
    private themeProperty: 'light'|'dark' = 'light'

    constructor(protected readonly telechart: Telechart, protected parentElement: HTMLElement) {
        this.element = parentElement.appendChild(document.createElement('div'))
        this.element.classList.add('telechart-tip')
        this.theme = telechart.theme
        this.hide()
    }

    get theme() {
        return this.themeProperty
    }

    set theme(value) {
        this.themeProperty = value
        if (value === 'dark') {
            this.element.classList.add('dark')
        } else {
            this.element.classList.remove('dark')
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
        if (left + this.element.offsetWidth > this.parentElement.clientWidth) {
            left = this.parentElement.clientWidth - this.element.offsetWidth
        }
        this.element.style.left = `${left}px`
        this.element.style.top = `${value[1]}px`
    }

    public setContent(content: { title: string, values: Array<{ name: string, color: string, value: number }> }) {
        const titleDiv = document.createElement('div')
        titleDiv.classList.add('telechart-tip-title')
        titleDiv.innerText = content.title
        this.element.innerHTML = ''
        this.element.appendChild(titleDiv)

        content.values.forEach(val => {
            const div = document.createElement('div')
            div.classList.add('telechart-tip-value')
            div.style.color = val.color

            const b = document.createElement('b')
            b.innerText = String(val.value)
            div.appendChild(b)

            const s = document.createElement('span')
            s.innerText = val.name
            div.appendChild(s)

            this.element.appendChild(div)
        })
    }

    public draw() {/* */}

}
