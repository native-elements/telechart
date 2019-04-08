import { Telechart } from './Telechart'
import { Telecolumn } from './Telecolumn'
import { Telemation } from './Telemation'

export interface IBorders {
    maxX: Telemation,
    maxY: Telemation,
    minX: Telemation,
    minY: Telemation,
}

export abstract class AbstractCoordinator {
    protected currentRangeDisplay = false
    protected abstract readonly topPadding: number
    protected abstract readonly bottomPadding: number
    protected columns: Telecolumn[] = []
    protected borders!: IBorders
    protected cache: any = { }

    constructor(protected readonly telechart: Telechart) {}

    public get telecanvas() {
        return this.telechart.telecanvas
    }

    public getXValue(canvasX: number) {
        return Math.round((this.borders.maxX.value - this.borders.minX.value) * canvasX / this.telecanvas.width + this.borders.minX.value)
    }

    public getYValue(canvasY: number) {
        const tHeight = this.telecanvas.height - (this.bottomPadding + this.topPadding)
        return Math.round((this.topPadding - canvasY) * (this.borders.maxY.to - this.borders.minY.to) / tHeight + this.borders.maxY.to)
    }

    public getCanvasX(value: number) {
        return (value - this.borders.minX.value) / (this.borders.maxX.value - this.borders.minX.value) * this.telecanvas.width
    }

    public getCanvasY(value: number) {
        const tHeight = this.telecanvas.height - (this.bottomPadding + this.topPadding)
        return tHeight - (value - this.borders.minY.value) / (this.borders.maxY.value - this.borders.minY.value) * tHeight + this.topPadding
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
        this.borders = this.getNewBorders()
        this.telechart.redraw()
    }

    protected getNewBorders(animate?: number) {
        const result = {
            minX: Math.min(...this.columns.filter(c => c.visible).map(c => c.getMinX(this.currentRangeDisplay))),
            maxX: Math.max(...this.columns.filter(c => c.visible).map(c => c.getMaxX(this.currentRangeDisplay))),
            minY: Math.min(...this.columns.filter(c => c.visible).map(c => c.getMinY(this.currentRangeDisplay)), 0),
            maxY: Math.max(...this.columns.filter(c => c.visible).map(c => c.getMaxY(this.currentRangeDisplay))),
        }
        return {
            minX: animate ? Telemation.create(this.borders.minX.value, result.minX, 100) : Telemation.create(result.minX),
            maxX: animate ? Telemation.create(this.borders.maxX.value, result.maxX, 100) : Telemation.create(result.maxX),
            minY: animate ? Telemation.create(this.borders.minY.value, result.minY, animate) : Telemation.create(result.minY),
            maxY: animate ? Telemation.create(this.borders.maxY.value, result.maxY, animate) : Telemation.create(result.maxY),
        }
    }

}
