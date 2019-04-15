import { AbstractTeledisplay } from './AbstractTeledisplay'
import { Telechart } from '../Telechart'
import { Telecolumn } from '../Telecolumn'
import { StackedChartDrawer } from '../Drawer/StackedChartDrawer'

export class StackedTeledisplay extends AbstractTeledisplay {
    protected drawers: StackedChartDrawer[] = []

    constructor(telechart: Telechart) {
        super(telechart)
        this.drawers.push(new StackedChartDrawer(telechart, { isRangeDisplay: true }))
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
            drawer.topPadding = 30
            drawer.bottomPadding = 40 + this.telechart.telemap.height
            drawer.drawMilestones(this.axisTextColor)
            drawer.drawColumns()
            drawer.drawGuides(this.axisColor, this.theme === 'dark' ? '#ECF2F87F' : '#2525297F')
        }
        this.updateTeletip()
    }

    protected onMouseMove(x: number, y: number) {
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
