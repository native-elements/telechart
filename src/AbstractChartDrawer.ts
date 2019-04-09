import { Telechart } from './Telechart'
import { Telecolumn } from './Telecolumn'
import { Telemation } from './Telemation'

export interface IBorders {
    maxX: Telemation,
    maxY: Telemation,
    minX: Telemation,
    minY: Telemation,
}

export interface IAbstractChartDrawerOptions {
    isRangeDisplay?: boolean
    isDrawXLabels?: boolean
    yLabelsPos?: 'left'|'right'|null
    axisColor?: string|null
    axisTextColor?: string
    currentLineColor?: string
}

export abstract class AbstractChartDrawer {
    public axisColor: string|null
    public axisTextColor: string|null
    public currentLineColor: string|null
    public isRangeDisplay = false
    public isDrawXLabels = false
    public yLabelsPos: 'left'|'right'|null = null
    public topPadding: number = 0
    public bottomPadding: number = 0
    public borders!: IBorders
    protected columns: Telecolumn[] = []
    protected cache: any = { }

    constructor(protected readonly telechart: Telechart, options?: IAbstractChartDrawerOptions) {
        this.isRangeDisplay = options && options.isRangeDisplay ? true : false
        this.isDrawXLabels = options && options.isDrawXLabels ? true : false
        this.yLabelsPos = options && options.yLabelsPos ? options.yLabelsPos : null
        this.axisColor = options && options.axisColor ? options.axisColor : null
        this.axisTextColor = options && options.axisTextColor ? options.axisTextColor : null
        this.currentLineColor = options && options.currentLineColor ? options.currentLineColor : null
    }

    public abstract draw(): void

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
            minY: Math.min(...this.columns.filter(c => c.visible).map(c => c.getMinY(this.isRangeDisplay)), 0),
            maxY: Math.max(...this.columns.filter(c => c.visible).map(c => c.getMaxY(this.isRangeDisplay))),
        }
        return {
            minX: duration && this.borders ? Telemation.create(this.borders.minX.value, result.minX, 100) : Telemation.create(result.minX),
            maxX: duration && this.borders ? Telemation.create(this.borders.maxX.value, result.maxX, 100) : Telemation.create(result.maxX),
            minY: duration && this.borders ? Telemation.create(this.borders.minY.value, result.minY, duration) : Telemation.create(result.minY),
            maxY: duration && this.borders ? Telemation.create(this.borders.maxY.value, result.maxY, duration) : Telemation.create(result.maxY),
        }
    }

}
