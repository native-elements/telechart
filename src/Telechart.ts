import { Telecolumn, ITelechartColumnData } from './Telecolumn'
import { Telecanvas } from './Telecanvas'
import { AbstractTeledisplay } from './Display/AbstractTeledisplay'
import { Teletip } from './Teletip'
import { AbstractTelemap } from './Telemap/AbstractTelemap'
import { Telegend } from './Telegend'
import { LineTeledisplay } from './Display/LineTeledisplay'
import { TwoAxisTeledisplay } from './Display/TwoAxisTeledisplay'
import { LineTelemap } from './Telemap/LineTelemap'
import { TwoAxisTelemap } from './Telemap/TwoAxisTelemap'
import { StackedTeledisplay } from './Display/StackedTeledisplay'
import { StackedTelemap } from './Telemap/StackedTelemap'
import { StackedPercentTeledisplay } from './Display/StackedPercentTeledisplay'
import { StackedPercentTelemap } from './Telemap/StackedPercentTelemap'

interface ITelechartData {
    columns: Array<Array<string|number>>
    types: { [key: string]: 'line'|'bar'|'x' }
    names: { [key: string]: string }
    colors: { [key: string]: string }
    y_scaled?: boolean
    stacked?: boolean
    percentage?: boolean
}
interface ITelechartOptions {
    data: ITelechartData
    height?: number
    title?: string
    showFps?: boolean
}

export class Telechart {
    public static init(el: HTMLElement|string, options: ITelechartOptions) {
        let element: HTMLElement|null
        if (typeof el === 'string' || el instanceof String) {
            element = document.getElementById(el as string)
            if (!element) {
                throw new Error(`Element #${el} not found`)
            }
        } else if (el instanceof HTMLElement) {
            element = el
        }

        return new Telechart(element!, options)
    }

    public telecanvas!: Telecanvas
    public teledisplay!: AbstractTeledisplay
    public teletip!: Teletip
    public telemap!: AbstractTelemap
    public telegend!: Telegend
    protected config!: {
        data: ITelechartData,
        height: number,
        title: string,
        showFps: boolean,
    }
    protected loaded = false
    protected columns: Telecolumn[] = []
    protected canvas!: HTMLCanvasElement
    protected needRedraw = false
    protected headingElement!: HTMLDivElement
    protected rangeElement?: HTMLDivElement
    private themeProperty: 'light'|'dark' = 'light'

    constructor(protected readonly element: HTMLElement, options: ITelechartOptions) {
        if (!element) {
            throw new Error('HTML element for Telechart is not found')
        }
        if (!(element instanceof HTMLElement)) {
            throw new Error('First argument of Telechart constructor must be an HTMLElement')
        }
        this.config = {
            data: options.data,
            height: options.height ? options.height : 360,
            title: options.title ? options.title : 'Untitled chart',
            showFps: options.showFps ? true : false,
        }
        this.initHTML()
        this.updateData(options.data ? options.data : { columns: [], types: {}, names: {}, colors: {}, y_scaled: false })
        this.redraw()
    }

    get data() {
        return this.config.data
    }

    set data(value) {
        this.config.data = value
        this.updateData(value)
    }

    get theme() {
        return this.themeProperty
    }

    set theme(value) {
        this.themeProperty = value
        this.teletip.theme = value
        this.teledisplay.theme = value
        this.telemap.theme = value
        this.telegend.theme = value
        this.columns.forEach(c => c.theme = value)
        this.redraw()
    }

    public setRangeText(value: string) {
        if (!this.rangeElement) {
            this.rangeElement = this.headingElement.appendChild(document.createElement('div'))
            this.rangeElement.classList.add('telechart-heading-range')
        }
        this.rangeElement.innerText = value
    }

    public addColumn(data: ITelechartColumnData) {
        const column = new Telecolumn(this, data)
        this.columns.push(column)
        this.teledisplay.addColumn(column)
        this.telemap.addColumn(column)
        this.telegend.addColumn(column)
    }

    public removeColumn(id: string|number) {
        for (let n = this.columns.length - 1; n >= 0; n--) {
            const c = this.columns[n]
            if (c.id === id) {
                this.removeTelecolumn(c)
                return
            }
        }
    }

    public removeTelecolumn(column: Telecolumn) {
        if (this.teledisplay) {
            this.teledisplay.removeColumn(column)
        }
        if (this.telemap) {
            this.telemap.removeColumn(column)
        }
        this.telegend.removeColumn(column)
        this.columns.splice(this.columns.indexOf(column), 1)
        this.redraw()
    }

    public removeColumns() {
        for (let n = this.columns.length - 1; n >= 0; n--) {
            this.removeTelecolumn(this.columns[n])
        }
    }

    public redraw() {
        this.needRedraw = true
    }

    public updateData(data: ITelechartData) {
        let x: number[]
        let hasBar = false
        this.removeColumns()

        for (const key in data.types) {
            if (data.types[key] === 'bar') {
                hasBar = true
                break
            }
        }

        if (data.stacked || hasBar) {
            if (data.percentage) {
                this.telemap = new StackedPercentTelemap(this)
                this.teledisplay = new StackedPercentTeledisplay(this)
            } else {
                this.telemap = new StackedTelemap(this)
                this.teledisplay = new StackedTeledisplay(this)
            }
        } else if (data.y_scaled) {
            this.telemap = new TwoAxisTelemap(this)
            this.teledisplay = new TwoAxisTeledisplay(this)
        } else {
            this.telemap = new LineTelemap(this)
            this.teledisplay = new LineTeledisplay(this)
        }
        for (const col of data.columns) {
            const id = col[0] as string
            const row: number[] = []
            for (let n = 1; n < col.length; n++) {
                row.push(col[n] as number)
            }
            if (data.types[id] === 'x') {
                x = row
                continue
            }
            const values = row.reduce((result, val, i) => {
                if (x[i] === undefined) {
                    throw new Error('Incorrect input data')
                }
                result.push({ x: x[i], y: val })

                return result
            }, [] as Array<{ x: number, y: number}>)
            this.addColumn({ id, name: data.names[id], color: data.colors[id], values })
        }
        this.telemap.range = { from: .8, to: 1 }
        this.loaded = true
        window.dispatchEvent(new Event('resize'))
    }

    public getDateString(timestamp: number, format: string = 'j F Y') {
        const date = new Date(timestamp)
        let result = ''
        for (const c of format.split('')) {
            let a = c
            if (c === 'j') {
                a = date.getDate().toString()
            } else if (c === 'F') {
                a = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][date.getMonth()]
            } else if (c === 'Y') {
                a = date.getFullYear().toString()
            } else if (c === 'M') {
                a = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()]
            } else if (c === 'D') {
                a = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
            }
            result += a
        }
        return result
    }

    public formatNumber(value: number): string {
        let result = ''
        value.toString(10).split('').reverse().forEach((n, i) => {
            if (i % 3 === 0) {
                result = ' ' + result
            }
            result = n + result
        })
        return result
    }

    protected initHTML() {
        this.element.classList.add('telechart')
        const heading = this.headingElement = this.element.appendChild(document.createElement('div'))
        heading.classList.add('telechart-heading')
        const title = heading.appendChild(document.createElement('div'))
        title.classList.add('telechart-heading-title')
        title.innerText = this.config.title

        this.telecanvas = new Telecanvas(this.element, this.config.height!)
        this.teletip = new Teletip(this, this.element)
        this.telegend = new Telegend(this, this.element)

        this.telecanvas.addResizeListener(() => this.redraw())

        let frames = 0
        let start = Date.now()
        let fps = 60
        const draw = () => {
            const needRedraw = this.needRedraw
            if (this.needRedraw) {
                this.draw()
            }
            frames++
            if (frames % 30 === 0) {
                fps = 1 / ((Date.now() - start) / 1000 / 30)
                start = Date.now()
            }
            if (this.config.showFps && (needRedraw || frames % 10 === 0)) {
                this.telecanvas.rect(2, 2, 30, 10, '#fff')
                this.telecanvas.text('fps ' + fps.toFixed(0), [3, 10], '#000', 'sans', 9)
            }
            window.requestAnimationFrame(draw)
        }
        window.requestAnimationFrame(draw)
    }

    protected draw() {
        if (!this.loaded) {
            return
        }
        this.needRedraw = false
        this.telecanvas.clear()
        this.telemap.draw()
        this.teledisplay.draw()
        this.teletip.draw()
        this.telegend.draw()
    }

}
