import { Telechart } from './Telechart'

export interface ITeletipContent {
    title: string,
    values: Array<{ name: string, color: string, value: number|string, percentage?: number|string }>,
}

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

    public setContent(content: ITeletipContent) {
        while (this.element.firstChild) {
            this.element.removeChild(this.element.firstChild);
        }
        const table = this.element.appendChild(document.createElement('table'))
        const titleRow = table.insertRow()
        const titleCell = titleRow.insertCell()
        titleCell.innerText = content.title
        titleCell.colSpan = content.values[0].percentage ? 3 : 2

        content.values.forEach(val => {
            const row = table.insertRow()
            if (val.percentage) {
                const perc = row.insertCell()
                perc.style.textAlign = 'right'
                perc.innerHTML = '<b>' + val.percentage + '%</b>'
            }
            const name = row.insertCell()
            const value = row.insertCell()
            name.innerText = val.name
            value.innerText = String(val.value)
            value.style.color = val.color
            value.style.fontWeight = 'bold'
            value.style.textAlign = 'right'
        })
    }

    public draw() {/* */}

}
