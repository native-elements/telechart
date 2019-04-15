import { AbstractTeledisplay } from './AbstractTeledisplay'
import { Telechart } from '../Telechart'
import { Telecolumn } from '../Telecolumn'
import { StackedChartDrawer } from '../Drawer/StackedChartDrawer'
import { StackedPercentChartDrawer } from '../Drawer/StackedPercentChartDrawer'
import { ITeletipContent } from '../Teletip'

export class StackedPercentTeledisplay extends AbstractTeledisplay {
    protected drawers: StackedChartDrawer[] = []

    constructor(telechart: Telechart) {
        super(telechart)
        this.drawers.push(new StackedPercentChartDrawer(telechart, { isRangeDisplay: true, topPadding: 15, bottomPadding: 40 + this.telechart.telemap.height }))
    }

    public addColumn(column: Telecolumn) {
        super.addColumn(column)
        this.drawers.forEach(d => d.addColumn(column))
    }

    public draw() {
        if (!this.firstDrawer) {
            return
        }
        const textColor = this.theme === 'dark' ? '#ECF2F87F' : '#2525297F'
        const c = this.telecanvas
        c.text('100%', [0, this.firstDrawer.topPadding - 6], textColor, undefined, 11)
        for (const drawer of this.drawers as StackedPercentChartDrawer[]) {
            drawer.drawMilestones(this.axisTextColor)
            drawer.drawColumns()
            drawer.drawGuides(this.axisColor, textColor, undefined, (label) => label + '%')
            drawer.drawCurrentLine(this.theme === 'dark' ? '#dfe6eb7F' : '#3b4a5a7F')
        }
        this.updateTeletip()
    }

    protected getTeletipContent(currentColumns: Telecolumn[]): ITeletipContent {
        const sum = currentColumns.reduce((r, v) => r + v.currentPoint!.y, 0)
        const values = currentColumns.map(col => {
            return {
                name: col.name,
                color: col.color,
                value: this.telechart.formatNumber(col.currentPoint!.y),
                percentage: Math.round(col.currentPoint!.y / sum * 100),
            }
        })
        return { title: this.telechart.getDateString(currentColumns[0]!.currentPoint!.x, 'D, j M Y'), values }
    }

}
