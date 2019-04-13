import { AbstractTeledisplay } from './AbstractTeledisplay'
import { SimpleChartDrawer } from '../Drawer/SimpleChartDrawer'
import { Telechart } from '../Telechart'
import { Telecolumn } from '../Telecolumn'

export class SimpleTeledisplay extends AbstractTeledisplay {

    constructor(telechart: Telechart) {
        super(telechart)
        this.drawers.push(new SimpleChartDrawer(telechart, { isRangeDisplay: true }))
    }

    public addColumn(column: Telecolumn) {
        super.addColumn(column)
        this.drawers.forEach(d => d.addColumn(column))
    }

    public draw() {
        if (!this.firstDrawer) {
            return
        }
        const axisColor = this.theme === 'dark' ? '#293544' : '#ecf0f3'
        const textColor = this.theme === 'dark' ? '#546778' : '#96a2aa'
        const lineColor = this.theme === 'dark' ? '#3b4a5a' : '#dfe6eb'
        for (const drawer of this.drawers as SimpleChartDrawer[]) {
            drawer.topPadding = 30
            drawer.bottomPadding = 40 + this.telechart.telemap.height
            drawer.drawMilestones(textColor)
            drawer.drawCurrentLine(lineColor)
            drawer.drawGuides(axisColor)
            drawer.drawColumns()
            drawer.drawGuides(undefined, textColor)
            drawer.drawCurrentPoints()
        }
        this.updateTeletip()
    }

}
