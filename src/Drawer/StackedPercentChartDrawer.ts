import { Telecolumn } from '../Telecolumn'
import { StackedChartDrawer } from './StackedChartDrawer'
import { Telemation } from '../Telemation'

export class StackedPercentChartDrawer extends StackedChartDrawer {
    protected guidesCount = 4

    public drawColumns() {
        let prev: number[]|undefined
        const borders = { minX: this.borders.minX.value, maxX: this.borders.maxX.value, minY: 0, maxY: this.borders.maxY.value }
        const colsValues: Array<{ col: Telecolumn, values: Array<{ x: number, y: number }> }> = []
        for (const col of this.columns) {
            if (!col.opacity.value) {
                continue
            }
            colsValues.push({ col, values: this.getInDisplayColumnValues(col, [borders.minX, borders.maxX]) })
        }
        if (!colsValues.length) {
            return
        }
        for (let n = colsValues[0].values.length - 1; n >= 0; n--) {
            const sum = colsValues.reduce((r, v) => r + v.values[n].y * v.col.opacity.value, 0)
            for (const colVals of colsValues) {
                colVals.values[n] = { x: colVals.values[n].x, y: colVals.values[n].y / sum * 100 }
            }
        }
        for (const colVals of colsValues) {
            const result = this.drawValues(colVals.col, colVals.values, [borders.minX, borders.maxX], prev)
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
            maxY: 100,
        }
        return {
            minX: duration && this.borders ? Telemation.create(this.borders.minX.value, result.minX, 100) : Telemation.create(result.minX),
            maxX: duration && this.borders ? Telemation.create(this.borders.maxX.value, result.maxX, 100) : Telemation.create(result.maxX),
            minY: duration && this.borders ? Telemation.create(this.borders.minY.value, result.minY, duration) : Telemation.create(result.minY),
            maxY: duration && this.borders ? Telemation.create(this.borders.maxY.value, result.maxY, duration) : Telemation.create(result.maxY),
        }
    }

}
