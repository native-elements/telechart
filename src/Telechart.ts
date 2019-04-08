import { Telecolumn, ITelechartColumnData } from './Telecolumn'
import { Telecanvas } from './Telecanvas'
import { Telecoordinator } from './Telecoordinator'
import { Teletip } from './Teletip'
import { Telemap } from './Telemap'
import { Telegend } from './Telegend'

interface ITelechartData {
    columns: Array<Array<string|number>>
    types: { [key: string]: 'line'|'x' }
    names: { [key: string]: string }
    colors: { [key: string]: string }
}
interface ITelechartOptions {
    data: ITelechartData
    height?: number
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
    public telecoordinator!: Telecoordinator
    public teletip!: Teletip
    public telemap!: Telemap
    public telegend!: Telegend
    protected config!: ITelechartOptions
    protected columns: Telecolumn[] = []
    protected canvas!: HTMLCanvasElement
    protected needRedraw = false
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
            height: options.height ? options.height : 340,
        }
        this.initHTML()
        this.updateData(options.data ? options.data : { columns: [], types: {}, names: {}, colors: {} })
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
        this.telecoordinator.theme = value
        this.telemap.theme = value
        this.telegend.theme = value
        this.columns.forEach(c => c.theme = value)
        this.redraw()
    }

    public addColumn(data: ITelechartColumnData) {
        const column = new Telecolumn(this, data)
        this.columns.push(column)
        this.telecoordinator.addColumn(column)
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
        this.telecoordinator.removeColumn(column)
        this.telemap.removeColumn(column)
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
        this.removeColumns()

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
        window.dispatchEvent(new Event('resize'))
        this.telecoordinator.animate = true
    }

    protected initHTML() {
        this.element.classList.add('telechart')
        this.element.style.fontFamily = 'sans-serif'
        this.element.style.userSelect = 'none'
        this.element.style.webkitTapHighlightColor = '#ffffff00'

        this.telecanvas = new Telecanvas(this.element, this.config.height!)

        this.telemap = new Telemap(this)
        this.telecoordinator = new Telecoordinator(this)
        this.teletip = new Teletip(this, this.element)
        this.telegend = new Telegend(this, this.element)

        window.addEventListener('resize', () => this.redraw())

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
            if (needRedraw || frames % 50 === 0) {
                this.telecanvas.rect(2, 2, 30, 10, '#fff')
                this.telecanvas.text('fps ' + fps.toFixed(0), [3, 10], '#000', 'sans', 9)
            }
            window.requestAnimationFrame(draw)
        }
        window.requestAnimationFrame(draw)
    }

    protected draw() {
        this.needRedraw = false
        this.telecanvas.clear()
        this.telemap.draw()
        this.telecoordinator.draw()
        this.teletip.draw()
        this.telegend.draw()
        // this.needRedraw = true
    }

}
