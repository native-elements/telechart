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
    isZeroStart?: boolean
    noGuides?: boolean
    noMilestones?: boolean
}

export abstract class AbstractChartDrawer {
    public isRangeDisplay = false
    public isZeroStart = false
    public topPadding: number = 0
    public bottomPadding: number = 0
    public borders!: IBorders
    public noGuides: boolean
    public noMilestones: boolean
    protected guidesCount = 6
    protected milestones: Array<{ x: number, title: string|null }> = []
    protected guides: Array<{ y: number, title: string, opacity: Telemation }> = []
    protected columns: Telecolumn[] = []

    constructor(protected readonly telechart: Telechart, options?: IAbstractChartDrawerOptions) {
        this.isRangeDisplay = options && options.isRangeDisplay ? true : false
        this.isZeroStart = options && options.isZeroStart ? true : false
        this.noGuides = options && options.noGuides ? true : false
        this.noMilestones = options && options.noMilestones ? true : false
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

    public getCanvasY(value: number, borders?: [number, number]) {
        const min = borders ? borders[0] : this.borders.minY.value
        const max = borders ? borders[1] : this.borders.maxY.value
        const tHeight = this.telecanvas.height - (this.bottomPadding + this.topPadding)
        return tHeight - (value - min) / (max - min) * tHeight + this.topPadding
    }

    public addColumn(column: Telecolumn) {
        this.columns.push(column)
        this.recalcBorders(0)
        if (!this.noMilestones) {
            this.recalcMilestones()
        }
    }

    public removeColumn(column: Telecolumn) {
        this.columns.splice(this.columns.indexOf(column), 1)
        this.recalcBorders(0)
        if (!this.noMilestones) {
            this.recalcMilestones()
        }
    }

    public drawCurrentPoints() {
        this.columns.forEach(col => {
            if (col.current) {
                this.telecanvas.circle([this.getCanvasX(col.current.x), this.getCanvasY(col.current.y)], 4.5, col.color, col.config.background, 2)
            }
        })
    }

    public drawCurrentLine(color: string) {
        const c = this.telecanvas
        if (this.columns.length && this.columns[0].currentPoint) {
            c.line(
                [this.getCanvasX(this.columns[0].currentPoint.x), 0],
                [this.getCanvasX(this.columns[0].currentPoint.x), c.height - this.bottomPadding],
                color, 1,
            )
        }
    }

    public drawMilestones(textColor: string) {
        const c = this.telecanvas
        const dateWidth = 75
        const milestones = this.milestones.filter(m => {
            const x = this.getCanvasX(m.x)
            return x > -50 && x < c.width + 50
        })
        milestones.forEach(m => {
            const index = this.milestones.indexOf(m)
            const x = this.getCanvasX(m.x)
            if (!m.title) {
                m.title = this.telechart.getDateString(m.x, 'M j')
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
            c.text(m.title!, [x, c.height - this.bottomPadding + 18], c.getColorString(textColor, opacity), undefined, 11, 'center')
        })
    }

    public drawGuides(lineColor: string|undefined, textColor?: string, textAlign: 'left'|'right' = 'left', labelFormatter?: (label: string) => string) {
        if (!lineColor && !textColor) {
            return
        }
        const c = this.telecanvas
        c.save()
        c.setClippingRect(0, 0, c.width, c.height - this.bottomPadding + 30)
        for (let n = this.guides.length - 1; n >= 0; n--) {
            const g = this.guides[n]
            const y = this.getCanvasY(g.y)
            if (g.opacity.finished && g.opacity.value === 0) {
                this.guides.splice(n, 1)
            }
            if (lineColor) {
                c.line([0, y], [c.width, y], c.getColorString(lineColor, g.opacity.value), 1)
            }
            if (textColor) {
                if (textAlign === 'left') {
                    c.text(labelFormatter ? labelFormatter(g.title) : g.title, [0, y - 6], c.getColorString(textColor, g.opacity.value), undefined, 11)
                } else {
                    c.text(labelFormatter ? labelFormatter(g.title) : g.title, [c.width, y - 6], c.getColorString(textColor, g.opacity.value), undefined, 11, 'right')
                }
            }
        }
        c.restore()
    }

    public recalcBorders(duration = 100) {
        if (!this.columns.filter(c => c.visible).length) {
            return
        }
        const oldMax = this.borders ? this.borders.maxY.to : 0
        const oldMin = this.borders ? this.borders.minY.to : 0
        this.borders = this.getNewBorders(duration)
        if (!this.noGuides && (oldMax !== this.borders.maxY.to || oldMin !== this.borders.minY.to)) {
            this.recalcGuides(duration)
        }
    }

    protected getNewBorders(duration?: number) {
        const result = {
            minX: Math.min(...this.columns.filter(c => c.visible).map(c => c.getMinX(this.isRangeDisplay))),
            maxX: Math.max(...this.columns.filter(c => c.visible).map(c => c.getMaxX(this.isRangeDisplay))),
            minY: this.isZeroStart ? 0 : Math.min(...this.columns.filter(c => c.visible).map(c => c.getMinY(this.isRangeDisplay))),
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

    protected recalcGuides(duration: number = 0) {
        const c = this.telecanvas
        if (!duration) {
            this.guides = []
        } else {
            for (const g of this.guides) {
                g.opacity = Telemation.create(g.opacity.value, 0, duration)
            }
        }
        for (let n = 0; n < this.guidesCount; n++) {
            const y = this.getYValue(c.height - this.bottomPadding - (c.height - this.bottomPadding - this.topPadding) / this.guidesCount * n)
            let value = y - y % Math.pow(10, y.toString().length - 2)
            let modifier = ''
            const diff = this.borders.maxY.to - this.borders.minY.to
            if (diff > 5000000) {
                value = Math.round(value / 1000000)
                modifier = 'M'
            } else if (diff > 5000) {
                value = Math.round(value / 1000)
                modifier = 'K'
            }
            this.guides.push({ y, title: `${value}${modifier}`, opacity: duration ? Telemation.create(0, 1, duration) : Telemation.create(1) })
        }
        while (this.guides.length > this.guidesCount * 3) {
            this.guides.shift()
        }
    }

    protected recalcMilestones() {
        this.milestones = []
        for (let x = this.borders.minX.to; x < this.borders.maxX.to; x += 60 * 60 * 24 * 1000) {
            const value = { x, title: null }
            this.milestones.push(value)
        }
    }

}
