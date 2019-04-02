import { Telechart } from './Telechart'
import { Telecolumn } from './Telecolumn'

export interface IBorders {
    maxX: number,
    maxY: number,
    minX: number,
    minY: number,
}

export abstract class AbstractCoordinator {
    protected currentRangeDisplay = false
    protected abstract readonly topPadding: number
    protected abstract readonly bottomPadding: number
    protected columns: Telecolumn[] = []
    protected borders!: IBorders

    constructor(protected readonly telechart: Telechart) {}

    get telecanvas() {
        return this.telechart.telecanvas
    }

    public getXValue(canvasX: number) {
        return (this.borders.maxX - this.borders.minX) * canvasX / this.telecanvas.width + this.borders.minX
    }

    public getYValue(canvasY: number) {
        const tHeight = this.telecanvas.height - (this.bottomPadding + this.topPadding)
        return (this.topPadding - canvasY) * (this.borders.maxY - this.borders.minY) / tHeight + this.borders.maxY
    }

    public getCanvasX(value: number) {
        return (value - this.borders.minX) / (this.borders.maxX - this.borders.minX) * this.telecanvas.width
    }

    public getCanvasY(value: number) {
        const tHeight = this.telecanvas.height - (this.bottomPadding + this.topPadding)
        return tHeight - (value - this.borders.minY) / (this.borders.maxY - this.borders.minY) * tHeight + this.topPadding
    }

    public addColumn(column: Telecolumn) {
        this.columns.push(column)
        this.recalcBorders()
    }

    public removeColumn(column: Telecolumn) {
        this.columns.splice(this.columns.indexOf(column), 1)
        this.recalcBorders()
    }

    public recalcBorders() {
        this.borders = {
            minX: Math.min(...this.columns.filter(c => c.visible).map(c => c.getMinX(this.currentRangeDisplay))),
            maxX: Math.max(...this.columns.filter(c => c.visible).map(c => c.getMaxX(this.currentRangeDisplay))),
            minY: Math.min(...this.columns.filter(c => c.visible).map(c => c.getMinY(this.currentRangeDisplay)), 0),
            maxY: Math.max(...this.columns.filter(c => c.visible).map(c => c.getMaxY(this.currentRangeDisplay))),
        }
        this.telechart.redraw()
    }

}
