import { Telecolumn } from '../Telecolumn'
import { Telemation } from '../Telemation'
import { Telechart } from '../Telechart'
import { AbstractChartDrawer, IAbstractChartDrawerOptions } from './AbstractChartDrawer'

interface IStackedChartDrawerOptions extends IAbstractChartDrawerOptions {
    noCurrent?: boolean
    rectangle?: boolean
}

export class StackedChartDrawer extends AbstractChartDrawer {
    public valuesLength = 0
    public noCurrent: boolean
    public rectangle: boolean

    constructor(telechart: Telechart, options?: IStackedChartDrawerOptions) {
        super(telechart, options)
        this.noCurrent = options && options.noCurrent ? true : false
        this.rectangle = options && options.rectangle ? true : false
    }

    get currentPoint() {
        if (!this.noCurrent && this.columns.length && this.columns[0].currentPoint) {
            return this.columns[0].currentPoint.x
        }
    }

    public drawColumns() {
        let prev: number[]|undefined
        const borders = { minX: this.borders.minX.value, maxX: this.borders.maxX.value, minY: 0, maxY: this.borders.maxY.value }
        for (const col of this.columns) {
            let result
            if (this.rectangle) {
                result = this.drawColumn(col, prev, borders)
            } else {
                result = this.drawValues(col, this.getInDisplayColumnValues(col, [borders.minX, borders.maxX]),
                    [borders.minX, borders.maxX], prev,
                )
            }
            if (result && !prev) {
                prev = result
            } else if (result) {
                for (let n = result.length - 1; n >= 0; n--) {
                    prev![n] = prev![n] + result[n]
                }
            }
        }
        if (!this.borders.maxX.finished || !this.borders.maxY.finished) {
            this.telechart.redraw()
        }
    }

    public drawColumn(column: Telecolumn, prev?: number[], borders?: { minX: number, maxX: number, minY: number, maxY: number }): number[]|undefined {
        if (!column.opacity.value) {
            return
        }
        const c = this.telecanvas
        const horBorders = borders ? [borders.minX, borders.maxX] as [number, number] : undefined
        const verBorders = borders ? [borders.minY, borders.maxY] as [number, number] : undefined
        const allVals = this.getInDisplayColumnValues(column, horBorders)
        if (allVals.length) {
            const currentPoint = this.currentPoint
            const colOpacityVal = column.opacity.value
            let opacity = Math.round((currentPoint ? .5 : 1) * 255).toString(16)
            if (opacity.length === 1) {
                opacity = '0' + opacity
            }
            const result: number[] = []
            const path: Array<[number, number]> = []
            const valsPrep: Array<{ x: number, y: number, height: number }> = []
            let current: Array<[number, number]>|undefined
            this.valuesLength = allVals.length
            for (let n = 0; n < allVals.length; n++) {
                const x = this.getCanvasX(allVals[n].x, horBorders)
                const ySt = this.getCanvasY(0)
                let height = ySt - this.getCanvasY(allVals[n].y, verBorders)
                if (colOpacityVal < 1) {
                    height *= colOpacityVal
                }
                const y = ySt - height - (prev ? prev[n] : 0)
                if (colOpacityVal === 1 && height < 2) {
                    height = 2
                }
                if (n) {
                    path[path.length - 1][0] = x
                }
                path.push([x, y])
                path.push([x, y])
                valsPrep.push({ x, y, height })
                result.push(height)
                if (allVals[n].x === currentPoint) {
                    current = [[x, y], [n + 1 < allVals.length ? this.getCanvasX(allVals[n + 1].x, horBorders) : x + 30, y]]
                    current.push([current[current.length - 1][0], y + height])
                    current.push([x, y + height])
                }
            }
            for (let n = valsPrep.length - 1; n >= 0; n--) {
                path.push([path[n * 2 + 1][0], valsPrep[n].y + valsPrep[n].height])
                path.push([path[n * 2][0], valsPrep[n].y + valsPrep[n].height])
            }
            c.shape(path, column.color + opacity)
            if (current) {
                c.shape(current, column.color)
            }
            if (!column.opacity.finished) {
                this.telechart.redraw()
            }
            return result
        }
    }

    public drawValues(column: Telecolumn, values: Array<{ x: number, y: number }>, borders: [number, number], prev?: number[]) {
        const c = this.telecanvas
        if (values.length) {
            const colOpacityVal = column.opacity.value
            const result: number[] = []
            const path: Array<[number, number]> = []
            const valsPrep: Array<{ x: number, y: number, height: number }> = []
            this.valuesLength = values.length
            for (let n = 0; n < values.length; n++) {
                const x = this.getCanvasX(values[n].x, borders)
                const ySt = this.getCanvasY(0)
                let height = ySt - this.getCanvasY(values[n].y)
                if (colOpacityVal < 1) {
                    height *= colOpacityVal
                }
                const y = ySt - height - (prev ? prev[n] : 0)
                if (colOpacityVal === 1 && height < 2) {
                    height = 2
                }
                path.push([x, y])
                valsPrep.push({ x, y, height })
                result.push(height)
            }
            for (let n = valsPrep.length - 1; n >= 0; n--) {
                path.push([path[n][0], valsPrep[n].y + valsPrep[n].height])
            }
            c.shape(path, column.color)
            if (!column.opacity.finished) {
                this.telechart.redraw()
            }
            return result
        }
    }

    protected getNewBorders(duration?: number) {
        const result = {
            minX: Math.min(...this.columns.filter(c => c.visible).map(c => c.getMinX(this.isRangeDisplay))),
            maxX: Math.max(...this.columns.filter(c => c.visible).map(c => c.getMaxX(this.isRangeDisplay))),
            minY: 0,
            maxY: this.columns.filter(c => c.visible).map(c => c.getMaxY(this.isRangeDisplay)).reduce((r, v) => r + v, 0),
        }
        return {
            minX: duration && this.borders ? Telemation.create(this.borders.minX.value, result.minX, 100) : Telemation.create(result.minX),
            maxX: duration && this.borders ? Telemation.create(this.borders.maxX.value, result.maxX, 100) : Telemation.create(result.maxX),
            minY: Telemation.create(result.minY),
            maxY: duration && this.borders ? Telemation.create(this.borders.maxY.value, result.maxY, duration) : Telemation.create(result.maxY),
        }
    }

}
