import { Telecolumn } from './Telecolumn'
import { Telechart } from './Telechart'
import { AbstractCoordinator } from './AbstractCoordinator'
import { Telemation } from './Telemation'

export class Telecoordinator extends AbstractCoordinator {
    public animate = false
    protected config!: { axisColor: string, axisTextColor: string, cursorColor: string }
    protected topPadding: number
    protected bottomPadding: number
    protected columns: Telecolumn[] = []
    private guides: Array<{ y: number, title: string, opacity: Telemation }> = []
    private milestones: Array<{ x: number, title: string|null }> = []
    private themeProperty: 'light'|'dark' = 'light'

    constructor(telechart: Telechart) {
        super(telechart)
        this.currentRangeDisplay = true
        this.topPadding = 30
        this.bottomPadding = 40 + this.telechart.telemap.height
        this.telecanvas.addMouseMoveListener(this.onMouseMove.bind(this))
        this.theme = telechart.theme
    }

    get theme() {
        return this.themeProperty
    }

    set theme(value) {
        this.themeProperty = value
        if (value === 'dark') {
            this.config = {
                ...this.config,
                axisColor: '#293544',
                axisTextColor: '#546778',
                cursorColor: '#3b4a5a',
            }
        } else {
            this.config = {
                ...this.config,
                axisColor: '#ecf0f3',
                axisTextColor: '#96a2aa',
                cursorColor: '#dfe6eb',
            }
        }
    }

    get height() {
        return this.telecanvas.height - this.telechart.telemap.height
    }

    public addColumn(column: Telecolumn) {
        super.addColumn(column)
        this.recalcMilestones()
    }

    public removeColumn(column: Telecolumn) {
        super.removeColumn(column)
        this.recalcMilestones()
    }

    public draw() {
        const c = this.telecanvas
        const cfg = this.config
        const dateWidth = 75

        if (this.columns.length && this.columns[0].currentPoint) {
            c.line(
                [this.getCanvasX(this.columns[0].currentPoint.x), 0],
                [this.getCanvasX(this.columns[0].currentPoint.x), c.height - this.bottomPadding],
                this.config.cursorColor, 1,
            )
        }
        const milestones = this.milestones.filter(m => {
            const x = this.getCanvasX(m.x)
            return x > -50 && x < c.width + 50
        })
        milestones.forEach(m => {
            const index = this.milestones.indexOf(m)
            const x = this.getCanvasX(m.x)
            if (!m.title) {
                const date = new Date(m.x)
                const month = date.getMonth()
                if (!this.cache.months) {
                    this.cache.months = {}
                }
                if (!this.cache.months[month]) {
                    const str = date.toLocaleDateString(undefined, { month: 'short' })
                    this.cache.months[month] = str.length > 3 ? str.substr(0, 3) : str
                }
                m.title = `${this.cache.months[month]} ${date.getDate()}`
            }
            const roundToPowerOfTwo = (num: number) => {
                return Math.pow(2, Math.round(Math.log(num) / Math.log(2)))
            }
            const odd = roundToPowerOfTwo(Math.ceil(milestones.length / (c.width / dateWidth)))
            let opacity = 0
            if (index % odd === 0) {
                opacity = 1
            } else if (index % (odd / 2) === 0) {
                opacity = Math.min(1, c.width / (milestones.length / odd + milestones.length / odd / 2) / dateWidth)
                opacity = opacity * opacity * opacity * opacity
            }
            if (opacity < .15) {
                return
            }
            let color = Math.round(opacity * 255).toString(16)
            color = color.length < 2 ? '0' + color : color
            c.text(m.title!, [x, c.height - this.bottomPadding + 18], cfg.axisTextColor + color, undefined, 11, 'center')
        })
        for (let n = this.guides.length - 1; n >= 0; n--) {
            const g = this.guides[n]
            const y = this.getCanvasY(g.y)
            let opacity: string = Math.round(g.opacity.value * 255).toString(16)
            if (g.opacity.finished && g.opacity.value === 0) {
                this.guides.splice(n, 1)
            }
            opacity = opacity.length < 2 ? '0' + opacity : opacity
            c.line([0, y], [c.width, y], cfg.axisColor + opacity, 1)
            c.text(g.title, [0, y - 6], cfg.axisTextColor + opacity, undefined, 11)
        }
        this.columns.forEach(col => this.drawColumn(col))
        this.columns.forEach(col => {
            if (col.current) {
                c.circle([this.getCanvasX(col.current.x), this.getCanvasY(col.current.y)], 4.5, col.color, col.config.background, col.width)
            }
        })
        if (!this.borders.maxX.finished || !this.borders.maxY.finished) {
            this.telechart.redraw()
        }
        const curColummns = this.columns.filter(col => col.currentPoint)
        const columns = curColummns.map(col => {
            return { name: col.name, color: col.color, value: col.currentPoint!.y }
        })
        if (columns.length) {
            const pos = this.getCanvasX(curColummns[0]!.currentPoint!.x)
            if (pos < 0 || pos > this.telecanvas.width) {
                this.telechart.teletip.hide()
            } else {
                const date = new Date(curColummns[0]!.currentPoint!.x)
                this.telechart.teletip.setContent({ title: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }), values: columns })
                this.telechart.teletip.setCoordinates([this.getCanvasX(curColummns[0]!.currentPoint!.x), 0])
                this.telechart.teletip.show()
            }
        } else {
            this.telechart.teletip.hide()
        }
    }

    public recalcBorders(duration = 100) {
        const old = this.borders ? this.borders.maxY.to : 0
        super.recalcBorders(duration)
        if (old !== this.borders.maxY.to) {
            this.recalcGuides(duration)
        }
    }

    protected drawColumn(column: Telecolumn) {
        const c = this.telecanvas

        const allVals = column.currentValues
        while (this.getCanvasX(allVals[0].x) > 0) {
            const prevIndex = column.values.indexOf(allVals[0]) - 1
            if (prevIndex < 0) {
                break
            }
            allVals.unshift(column.values[prevIndex])
        }
        while (this.getCanvasX(allVals[allVals.length - 1].x) < this.telecanvas.width) {
            const nextIndex = column.values.indexOf(allVals[allVals.length - 1]) + 1
            if (nextIndex >= column.values.length) {
                break
            }
            allVals.push(column.values[nextIndex])
        }
        if (allVals.length) {
            let opacity: number|string = column.opacity.value
            if (opacity) {
                opacity = Math.round(opacity * 255).toString(16)
                opacity = opacity.length < 2 ? '0' + opacity : opacity
                c.path(allVals.map(i => [this.getCanvasX(i.x), this.getCanvasY(i.y)] as [number, number]), column.color + opacity, column.width)
            }
            if (!column.opacity.finished) {
                this.telechart.redraw()
            }
        }
    }

    protected recalcGuides(animateSpeed: number = 0) {
        const c = this.telecanvas
        if (!animateSpeed) {
            this.guides = []
        } else {
            for (const g of this.guides) {
                g.opacity = Telemation.create(g.opacity.value, 0, animateSpeed)
            }
        }
        for (let n = 0; n < 6; n++) {
            const y = this.getYValue(c.height - this.bottomPadding - (c.height - this.bottomPadding - this.topPadding) / 6 * n)
            const title = n === 0 ? '0' : String(y - y % Math.pow(10, y.toString().length - 2))
            this.guides.push({ y, title, opacity: animateSpeed ? Telemation.create(0, 1, animateSpeed) : Telemation.create(1) })
        }
    }

    protected recalcMilestones() {
        super.recalcBorders()
        this.milestones = []
        for (let x = this.borders.minX.to; x < this.borders.maxX.to; x += 60 * 60 * 24 * 1000) {
            const value = { x, title: null }
            this.milestones.push(value)
        }
    }

    protected onMouseMove(x: number, y: number) {
        if (!this.borders.maxX.finished) {
            return
        }
        if (x >= 0 && y >= 0 && x < this.telecanvas.width && y < this.height) {
            const val = this.getXValue(x)
            if (this.columns.reduce((r, c) => c.setCurrentX(val) || r, false)) {
                this.telechart.redraw()
            }
        }
    }

}
