import { AbstractTeledisplay } from './AbstractTeledisplay'
import { Telechart } from '../Telechart'
import { SimpleChartDrawer } from '../Drawer/SimpleChartDrawer'
import { Telecolumn } from '../Telecolumn'
import { StackedChartDrawer } from '../Drawer/StackedChartDrawer'
import { StackedPercentChartDrawer } from '../Drawer/StackedPercentChartDrawer'

export class StackedPercentTeledisplay extends AbstractTeledisplay {
    protected drawers: StackedChartDrawer[] = []

    constructor(telechart: Telechart) {
        super(telechart)
        this.drawers.push(new StackedPercentChartDrawer(telechart, { isRangeDisplay: true }))
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
            drawer.drawColumns()
            drawer.drawGuides(axisColor, textColor)
            drawer.drawCurrentLine(lineColor)
        }
        this.updateTeletip()
    }
}
