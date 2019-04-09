import { Telecolumn } from './Telecolumn'
import { Telechart } from './Telechart'
import { AbstractChartDrawer } from './AbstractChartDrawer'
import { SimpleChartDrawer } from './SimpleChartDrawer'

export class Teledisplay {
    public theme: 'light'|'dark' = 'light'
    protected columns: Telecolumn[] = []
    protected drawers: AbstractChartDrawer[] = []

    constructor(protected readonly telechart: Telechart) {
        this.telechart.telecanvas.addMouseMoveListener(this.onMouseMove.bind(this))
        this.theme = telechart.theme
        this.drawers.push(new SimpleChartDrawer(telechart, { isRangeDisplay: true, isDrawXLabels: true }))
    }

    get firstDrawer() {
        return this.drawers.length ? this.drawers[0] : undefined
    }

    get telecanvas() {
        return this.telechart.telecanvas
    }

    get height() {
        return this.telecanvas.height - this.telechart.telemap.height
    }

    public addColumn(column: Telecolumn) {
        this.columns.push(column)
        this.drawers.forEach(d => d.addColumn(column))
    }

    public removeColumn(column: Telecolumn) {
        this.columns.splice(this.columns.indexOf(column), 1)
        this.drawers.forEach(d => d.removeColumn(column))
    }

    public draw() {
        if (!this.firstDrawer) {
            return
        }
        for (const drawer of this.drawers) {
            if (this.theme === 'dark') {
                drawer.axisColor = '#293544'
                drawer.axisTextColor = '#546778'
                drawer.currentLineColor = '#3b4a5a'
            } else {
                drawer.axisColor = '#ecf0f3'
                drawer.axisTextColor = '#96a2aa'
                drawer.currentLineColor = '#dfe6eb'
            }
            drawer.topPadding = 30
            drawer.bottomPadding = 40 + this.telechart.telemap.height
            drawer.draw()
        }
        const curColummns = this.columns.filter(col => col.currentPoint)
        const columns = curColummns.map(col => {
            return { name: col.name, color: col.color, value: col.currentPoint!.y }
        })
        if (columns.length) {
            const pos = this.firstDrawer.getCanvasX(curColummns[0]!.currentPoint!.x)
            if (pos < 0 || pos > this.telecanvas.width) {
                this.telechart.teletip.hide()
            } else {
                const date = new Date(curColummns[0]!.currentPoint!.x)
                this.telechart.teletip.setContent({ title: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }), values: columns })
                this.telechart.teletip.setCoordinates([this.firstDrawer.getCanvasX(curColummns[0]!.currentPoint!.x), 0])
                this.telechart.teletip.show()
            }
        } else {
            this.telechart.teletip.hide()
        }
    }

    public recalcBorders(duration: number = 0) {
        this.drawers.forEach(d => d.recalcBorders(duration))
        this.telechart.redraw()
    }

    protected onMouseMove(x: number, y: number) {
        if (!this.drawers.length || !this.firstDrawer || !this.firstDrawer.bordersAnimationFinished) {
            return
        }
        if (x >= 0 && y >= 0 && x < this.telecanvas.width && y < this.height) {
            const val = this.firstDrawer.getXValue(x)
            if (this.columns.reduce((r, c) => c.setCurrentX(val) || r, false)) {
                this.telechart.redraw()
            }
        }
    }

}
