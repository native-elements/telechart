import { Telecolumn } from './Telecolumn'
import { Telechart } from './Telechart'
import { AbstractCoordinator, IBorders } from './AbstractCoordinator'

export class Telecoordinator extends AbstractCoordinator {
    public animate = false
    protected config!: { axisColor: string, axisTextColor: string, cursorColor: string }
    protected topPadding: number
    protected bottomPadding: number
    protected columns: Telecolumn[] = []
    private guides: Array<{ y: number, title: string, old?: number }> = []
    private milestones: Array<{ x: number, title: string|null }> = []
    private interval: number|null = null
    private timeout: number|null = null
    private themeProperty: 'light'|'dark' = 'light'
    private cache = { months: {} as any }

    constructor(telechart: Telechart) {
        super(telechart)
        this.currentRangeDisplay = true
        this.topPadding = 30
        this.bottomPadding = 40 + telechart.telemap.height
        this.telecanvas.addMouseMoveListener(this.onMouseMove.bind(this))
        this.theme = telechart.theme
        this.initHTML()
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
            let opacity: string = Math.round(g.old ? --g.old / 10 * 255 : 255).toString(16)
            if (g.old === 0) {
                console.log(g.old)
                this.guides.splice(n, 1)
            }
            opacity = opacity.length < 2 ? '0' + opacity : opacity
            c.line([0, y], [c.width, y], cfg.axisColor + opacity, 1)
            c.text(g.title, [0, y - 6], cfg.axisTextColor + opacity, undefined, 11)
        }
    }

    public postDraw() {
        const curColummns = this.columns.filter(col => col.currentPoint)
        const columns = curColummns.map(col => {
            return { name: col.name, color: col.color, value: col.currentPoint!.y }
        })
        if (columns.length) {
            const date = new Date(curColummns[0]!.currentPoint!.x)
            this.telechart.teletip.setContent({ title: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }), values: columns })
            this.telechart.teletip.setCoordinates([this.getCanvasX(curColummns[0]!.currentPoint!.x), 0])
            this.telechart.teletip.show()
        } else {
            this.telechart.teletip.hide()
        }
    }

    public recalcBorders(iterations = 10) {
        if (!this.animate) {
            super.recalcBorders()
            this.recalcGuides()
            return
        }
        if (this.timeout) {
            clearTimeout(this.timeout)
            this.timeout = null
        }
        if (this.interval) {
            clearInterval(this.interval)
            this.interval = null
        }
        setTimeout(() => {
            const initialBorders = this.borders
            super.recalcBorders()
            const targetBorders = this.borders
            this.recalcGuides(true)

            if (this.interval) {
                clearInterval(this.interval)
                this.interval = null
            }
            let iteration = 0
            const getVal = ((key: 'minX'|'maxX'|'minY'|'maxY') => Math.round(initialBorders[key] + (targetBorders[key] - initialBorders[key]) / iterations * iteration))
            const intervalFunc = () => {
                iteration++
                this.borders = { minX: getVal('minX'), maxX: getVal('maxX'), minY: getVal('minY'), maxY: getVal('maxY') }
                this.telechart.redraw()
                if (++iteration === iterations) {
                    this.borders = targetBorders
                    this.guides = this.guides.filter(g => g.old === undefined)
                    clearInterval(this.interval!)
                    this.interval = null
                }
            }
            this.interval = setInterval(intervalFunc, 10)
            intervalFunc()
        }, 50)
    }

    protected recalcGuides(animateOld: boolean = false) {
        const c = this.telecanvas
        if (!animateOld) {
            this.guides = []
        } else {
            this.guides.forEach(g => {
                if (g.old === undefined) {
                    g.old = 6
                }
            })
        }
        for (let n = 0; n < 6; n++) {
            const y = this.getYValue(c.height - this.bottomPadding - (c.height - this.bottomPadding - this.topPadding) / 6 * n)
            const title = n === 0 ? '0' : String(y - y % Math.pow(10, y.toString().length - 2))
            this.guides.push({ y, title })
        }
    }

    protected recalcMilestones() {
        super.recalcBorders()
        this.milestones = []
        for (let x = this.borders.minX; x < this.borders.maxX; x += 60 * 60 * 24 * 1000) {
            const value = { x, title: null }
            this.milestones.push(value)
        }
    }

    protected onMouseMove(x: number, y: number) {
        const val = this.getXValue(x)
        this.columns.forEach(c => c.setCurrentX(val))
    }

    protected initHTML() {
        let x = 0
        let beginX: number|null = null
        let beginRange: { from: number, to: number }|null = null
        const mouseMove = (clientX: number) => {
            x = clientX
            if (beginX && beginRange) {
                const map = this.telechart.telemap
                const range = map.range!
                const movementPercent = (x - beginX) / this.telecanvas.width * (range.from - range.to)
                const newRange = { from: beginRange.from + movementPercent, to: beginRange.to + movementPercent }

                if (newRange.from < 0) {
                    newRange.from = 0
                    newRange.to = beginRange.to - beginRange.from
                }
                if (newRange.to > 1) {
                    newRange.to = 1
                    newRange.from = 1 - beginRange.to + beginRange.from
                }
                map.range = newRange
            }
        }
        window.addEventListener('touchmove', e => mouseMove(e.touches[0].clientX))
        window.addEventListener('mousemove', e => mouseMove(e.clientX))
        this.telecanvas.addMouseDownListener((xPos) => {
            beginX = xPos
            beginRange = { ...this.telechart.telemap.range! }
        })
        this.telecanvas.addMouseUpListener(() => {
            beginX = null
        })
    }

}
