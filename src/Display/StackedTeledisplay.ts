import { AbstractTeledisplay } from './AbstractTeledisplay'
import { Telechart } from '../Telechart'
import { Telecolumn } from '../Telecolumn'
import { StackedChartDrawer } from '../Drawer/StackedChartDrawer'

interface IStackedTeledisplayOptions {
    rectangle?: boolean
}

export class StackedTeledisplay extends AbstractTeledisplay {
    protected drawers: StackedChartDrawer[] = []
    protected rectangle: boolean

    constructor(telechart: Telechart, options?: IStackedTeledisplayOptions) {
        super(telechart)
        this.rectangle = options && options.rectangle ? true : false
        this.drawers.push(new StackedChartDrawer(telechart, {
            isRangeDisplay: true,
            topPadding: 15,
            bottomPadding: 40 + this.telechart.telemap.height,
            rectangle: this.rectangle,
        }))
    }

    public addColumn(column: Telecolumn) {
        super.addColumn(column)
        this.drawers.forEach(d => d.addColumn(column))
    }

    public draw() {
        if (!this.firstDrawer) {
            return
        }
        for (const drawer of this.drawers as StackedChartDrawer[]) {
            drawer.drawMilestones(this.axisTextColor)
            drawer.drawColumns()
            drawer.drawGuides(this.axisColor, this.theme === 'dark' ? '#ECF2F87F' : '#2525297F')
            if (!this.rectangle) {
                drawer.drawCurrentLine(this.theme === 'dark' ? '#dfe6eb7F' : '#3b4a5a7F')
            }
        }
        this.updateTeletip()
    }

    protected onMouseMove(x: number, y: number) {
        if (!this.rectangle) {
            super.onMouseMove(x, y)
            return
        }
        if (!this.drawers.length || !this.firstDrawer || !this.firstDrawer.bordersAnimationFinished) {
            return
        }
        if (x >= 0 && y >= 0 && x < this.telecanvas.width && y < this.height) {
            const val = this.firstDrawer.getXValue(x - this.telecanvas.width / this.drawers[0].valuesLength / 2)
            if (this.columns.reduce((r, c) => c.setCurrentX(val) || r, false)) {
                this.telechart.redraw()
            }
        }
    }

}
