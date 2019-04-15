import { AbstractChartDrawer, IAbstractChartDrawerOptions } from './AbstractChartDrawer'
import { Telecolumn } from '../Telecolumn'
import { Telechart} from '../Telechart'

export interface ILineChartDrawerOptions extends IAbstractChartDrawerOptions {
    lineWidth?: number
}

export class LineChartDrawer extends AbstractChartDrawer {
    public lineWidth: number

    constructor(telechart: Telechart, options?: ILineChartDrawerOptions) {
        super(telechart, options)
        this.lineWidth = options && options.lineWidth ? options.lineWidth : 1
    }

    public drawColumns() {
        const c = this.telecanvas
        c.save()
        c.setClippingRect(0, 0, c.width, c.height - this.bottomPadding + 30)
        this.columns.forEach(col => this.drawColumn(col))
        c.restore()
        if (!this.borders.maxX.finished || !this.borders.maxY.finished || (!this.isZeroStart && !this.borders.minY.finished)) {
            this.telechart.redraw()
        }
    }

    public drawColumn(column: Telecolumn) {
        if (!column.opacity.value) {
            return
        }
        const c = this.telecanvas
        const allVals = this.getInDisplayColumnValues(column)
        if (allVals.length) {
            let opacity = Math.round(column.opacity.value * 255).toString(16)
            if (opacity.length === 1) {
                opacity = '0' + opacity
            }
            c.path(allVals.map(i => [this.getCanvasX(i.x), this.getCanvasY(i.y)] as [number, number]), column.color + opacity, this.lineWidth)
            if (!column.opacity.finished) {
                this.telechart.redraw()
            }
        }
    }

}
