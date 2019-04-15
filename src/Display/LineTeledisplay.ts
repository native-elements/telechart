import { AbstractTeledisplay } from './AbstractTeledisplay'
import { LineChartDrawer } from '../Drawer/LineChartDrawer'
import { Telechart } from '../Telechart'
import { Telecolumn } from '../Telecolumn'

export class LineTeledisplay extends AbstractTeledisplay {

    constructor(telechart: Telechart) {
        super(telechart)
        this.drawers.push(new LineChartDrawer(telechart, { isRangeDisplay: true, lineWidth: 2, topPadding: 15, bottomPadding: 40 + this.telechart.telemap.height }))
    }

    public addColumn(column: Telecolumn) {
        super.addColumn(column)
        this.drawers.forEach(d => d.addColumn(column))
    }

    public draw() {
        if (!this.firstDrawer) {
            return
        }
        this.firstDrawer.drawGuides(this.axisColor)
        for (const drawer of this.drawers as LineChartDrawer[]) {
            drawer.drawMilestones(this.axisTextColor)
            drawer.drawCurrentLine(this.lineColor)
            drawer.drawColumns()
            drawer.drawGuides(undefined, this.axisTextColor)
            drawer.drawCurrentPoints()
        }
        this.updateTeletip()
    }

}
