import { AbstractTeledisplay } from './AbstractTeledisplay'
import { SimpleChartDrawer } from '../Drawer/SimpleChartDrawer'
import { Telecolumn } from '../Telecolumn'
import { Telechart } from '../Telechart'

export class TwoAxisTeledisplay extends AbstractTeledisplay {

    constructor(telechart: Telechart) {
        super(telechart)
        this.drawers.push(new SimpleChartDrawer(telechart, { isRangeDisplay: true }))
        this.drawers.push(new SimpleChartDrawer(telechart, { isRangeDisplay: true, noMilestones: true }))
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
        const axisColor = this.theme === 'dark' ? '#293544' : '#ecf0f3'
        const textColor = this.theme === 'dark' ? '#546778' : '#96a2aa'
        const lineColor = this.theme === 'dark' ? '#3b4a5a' : '#dfe6eb'
        for (let n = 0; n < this.drawers.length; n++) {
            const drawer = this.drawers[n] as SimpleChartDrawer
            drawer.topPadding = 30
            drawer.bottomPadding = 40 + this.telechart.telemap.height
            if (n === 0) {
                drawer.drawMilestones(textColor)
                drawer.drawCurrentLine(lineColor)
            }
            drawer.drawGuides(axisColor)
        }
        for (const drawer of this.drawers) {
            drawer.drawColumns()
        }
        for (let n = 0; n < this.drawers.length; n++) {
            const drawer = this.drawers[n] as SimpleChartDrawer
            drawer.drawGuides(undefined, this.columns[n].color, n === 0 ? 'left' : 'right')
            drawer.drawCurrentPoint()
        }
        this.updateTeletip()
    }

}
