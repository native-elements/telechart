import { Telecolumn } from '../Telecolumn'
import { Telechart } from '../Telechart'
import { AbstractChartDrawer } from '../Drawer/AbstractChartDrawer'

export abstract class AbstractTeledisplay {
    public theme: 'light'|'dark' = 'light'
    protected columns: Telecolumn[] = []
    protected drawers: AbstractChartDrawer[] = []

    constructor(protected readonly telechart: Telechart) {
        this.telechart.telecanvas.addMouseMoveListener(this.onMouseMove.bind(this))
        this.theme = telechart.theme
    }

    public abstract draw(): void

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
    }

    public removeColumn(column: Telecolumn) {
        this.columns.splice(this.columns.indexOf(column), 1)
        this.drawers.forEach(d => d.removeColumn(column))
    }

    public recalcBorders(duration: number = 0) {
        this.drawers.forEach(d => d.recalcBorders(duration))
        this.telechart.redraw()
    }

    protected updateTeletip() {
        const curColummns = this.columns.filter(col => col.currentPoint)
        const columns = curColummns.map(col => {
            return { name: col.name, color: col.color, value: col.currentPoint!.y }
        })
        if (columns.length) {
            const pos = this.firstDrawer!.getCanvasX(curColummns[0]!.currentPoint!.x)
            if (pos < 0 || pos > this.telecanvas.width) {
                this.telechart.teletip.hide()
            } else {
                const date = new Date(curColummns[0]!.currentPoint!.x)
                this.telechart.teletip.setContent({ title: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }), values: columns })
                this.telechart.teletip.setCoordinates([this.firstDrawer!.getCanvasX(curColummns[0]!.currentPoint!.x), 0])
                this.telechart.teletip.show()
            }
        } else {
            this.telechart.teletip.hide()
        }
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
