import { AbstractTeledisplay } from './AbstractTeledisplay'
import { LineChartDrawer } from '../Drawer/LineChartDrawer'
import { Telecolumn } from '../Telecolumn'
import { Telechart } from '../Telechart'

export class TwoAxisTeledisplay extends AbstractTeledisplay {

    constructor(telechart: Telechart) {
        super(telechart)
        this.drawers.push(new LineChartDrawer(telechart, { isRangeDisplay: true, lineWidth: 2, topPadding: 15, bottomPadding: 40 + this.telechart.telemap.height }))
        this.drawers.push(new LineChartDrawer(telechart, { isRangeDisplay: true, noMilestones: true, lineWidth: 2, topPadding: 15, bottomPadding: 40 + this.telechart.telemap.height }))
    }

    public addColumn(column: Telecolumn) {
        super.addColumn(column)
        if (this.columns.length === 1) {
            this.drawers[0].addColumn(column)
        } else if (this.columns.length === 2) {
            this.drawers[1].addColumn(column)
        }
    }

    public draw() {
        if (!this.firstDrawer) {
            return
        }
        for (let n = 0; n < this.drawers.length; n++) {
            const drawer = this.drawers[n] as LineChartDrawer
            if (n === 0) {
                drawer.drawMilestones(this.axisTextColor)
                drawer.drawCurrentLine(this.lineColor)
            }
            drawer.drawGuides(this.theme === 'dark' ? '#3b4453' : '#eaebed')
        }
        for (const drawer of this.drawers) {
            drawer.drawColumns()
        }
        for (let n = 0; n < this.drawers.length; n++) {
            const drawer = this.drawers[n] as LineChartDrawer
            drawer.drawGuides(undefined, this.columns[n].color, n === 0 ? 'left' : 'right')
            drawer.drawCurrentPoints()
        }
        this.updateTeletip()
    }

}
