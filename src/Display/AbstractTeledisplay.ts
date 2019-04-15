import { Telecolumn } from '../Telecolumn'
import { Telechart } from '../Telechart'
import { AbstractChartDrawer } from '../Drawer/AbstractChartDrawer'
import { ITeletipContent } from '../Teletip'

export abstract class AbstractTeledisplay {
    public theme: 'light'|'dark' = 'light'
    protected columns: Telecolumn[] = []
    protected drawers: AbstractChartDrawer[] = []

    constructor(protected readonly telechart: Telechart) {
        this.telechart.telecanvas.addMouseMoveListener(this.onMouseMove.bind(this))
        this.theme = telechart.theme
    }

    public abstract draw(): void

    get axisColor() {
        return this.theme === 'dark' ? '#FFFFFF19' : '#182D3B19'
    }

    get axisTextColor() {
        return this.theme === 'dark' ? '#A3B1C2' : '#8E8E93'
    }

    get lineColor() {
        return this.theme === 'dark' ? '#3b4a5a' : '#dfe6eb'
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
    }

    public removeColumn(column: Telecolumn) {
        this.columns.splice(this.columns.indexOf(column), 1)
        this.drawers.forEach(d => d.removeColumn(column))
    }

    public recalcBorders(duration: number = 0) {
        this.drawers.forEach(d => d.recalcBorders(duration))
        this.telechart.redraw()
    }

    protected getTeletipContent(currentColumns: Telecolumn[]): ITeletipContent {
        const values = currentColumns.map(col => {
            return { name: col.name, color: col.color, value: this.telechart.formatNumber(col.currentPoint!.y) }
        })

        return { title: this.telechart.getDateString(currentColumns[0]!.currentPoint!.x, 'D, j M Y'), values }
    }

    protected updateTeletip() {
        const curColumns = this.columns.filter(col => col.currentPoint)
        if (curColumns.length) {
            const pos = this.firstDrawer!.getCanvasX(curColumns[0]!.currentPoint!.x)
            if (pos < 0 || pos > this.telecanvas.width) {
                this.telechart.teletip.hide()
            } else {
                this.telechart.teletip.setContent(this.getTeletipContent(curColumns))
                this.telechart.teletip.setCoordinates([
                    this.firstDrawer!.getCanvasX(curColumns[0]!.currentPoint!.x),
                    this.firstDrawer!.getCanvasY(Math.max(...curColumns.map(c => c.currentPoint!.y))),
                ])
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
