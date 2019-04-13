import { Telechart } from '../Telechart'
import { Telecolumn } from '../Telecolumn'
import { Telemation } from '../Telemation'

export interface IBorders {
    maxX: Telemation,
    maxY: Telemation,
    minX: Telemation,
    minY: Telemation,
}

export interface IAbstractChartDrawerOptions {
    isRangeDisplay?: boolean
}

export abstract class AbstractChartDrawer {
    public isRangeDisplay = false
    public topPadding: number = 0
    public bottomPadding: number = 0
    public borders!: IBorders
    protected columns: Telecolumn[] = []
    protected cache: any = { }

    constructor(protected readonly telechart: Telechart, options?: IAbstractChartDrawerOptions) {
        this.isRangeDisplay = options && options.isRangeDisplay ? true : false
    }

    public abstract drawColumns(): void

    public abstract drawColumn(column: Telecolumn): void

    public get telecanvas() {
        return this.telechart.telecanvas
    }

    public get bordersAnimationFinished() {
        return this.borders.maxX.finished && this.borders.maxY.finished
    }

    public getXValue(canvasX: number) {
        return Math.round((this.borders.maxX.value - this.borders.minX.value) * canvasX / this.telecanvas.width + this.borders.minX.value)
    }

    public getYValue(canvasY: number) {
        const tHeight = this.telecanvas.height - (this.bottomPadding + this.topPadding)
        return Math.round((this.topPadding - canvasY) * (this.borders.maxY.to - this.borders.minY.to) / tHeight + this.borders.maxY.to)
    }

    public getCanvasX(value: number, borders?: [number, number]) {
        const min = borders ? borders[0] : this.borders.minX.value
        const max = borders ? borders[1] : this.borders.maxX.value
        return (value - min) / (max - min) * this.telecanvas.width
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

    public recalcBorders(duration = 100) {
        if (!this.columns.filter(c => c.visible).length) {
            return
        }
        this.borders = this.getNewBorders(duration)
    }

    protected getNewBorders(duration?: number) {
        const result = {
            minX: Math.min(...this.columns.filter(c => c.visible).map(c => c.getMinX(this.isRangeDisplay))),
            maxX: Math.max(...this.columns.filter(c => c.visible).map(c => c.getMaxX(this.isRangeDisplay))),
            minY: 0,
            maxY: Math.max(...this.columns.filter(c => c.visible).map(c => c.getMaxY(this.isRangeDisplay))),
        }
        return {
            minX: duration && this.borders ? Telemation.create(this.borders.minX.value, result.minX, 100) : Telemation.create(result.minX),
            maxX: duration && this.borders ? Telemation.create(this.borders.maxX.value, result.maxX, 100) : Telemation.create(result.maxX),
            minY: duration && this.borders ? Telemation.create(this.borders.minY.value, result.minY, duration) : Telemation.create(result.minY),
            maxY: duration && this.borders ? Telemation.create(this.borders.maxY.value, result.maxY, duration) : Telemation.create(result.maxY),
        }
    }

    protected getInDisplayColumnValues(column: Telecolumn, borders?: [number, number]) {
        const allVals = column.currentValues
        while (this.getCanvasX(allVals[0].x, borders) > 0) {
            const prevIndex = column.values.indexOf(allVals[0]) - 1
            if (prevIndex < 0) {
                break
            }
            allVals.unshift(column.values[prevIndex])
        }
        while (this.getCanvasX(allVals[allVals.length - 1].x, borders) < this.telecanvas.width) {
            const nextIndex = column.values.indexOf(allVals[allVals.length - 1]) + 1
            if (nextIndex >= column.values.length) {
                break
            }
            allVals.push(column.values[nextIndex])
        }
        return allVals
    }

}
