import { AbstractTelemap } from './AbstractTelemap'
import { Telecolumn } from '../Telecolumn'
import { Telechart } from '../Telechart'
import { LineChartDrawer } from '../Drawer/LineChartDrawer'

export class LineTelemap extends AbstractTelemap {

    constructor(telechart: Telechart) {
        super(telechart)
        this.drawers.push(new LineChartDrawer(telechart, { noGuides: true, noMilestones: true }))
    }

    public addColumn(column: Telecolumn) {
        this.drawers.forEach(d => d.addColumn(column))
        super.addColumn(column)
    }

    protected drawColumns() {
        for (const drawer of this.drawers) {
            drawer.topPadding = this.topPadding
            drawer.bottomPadding = this.bottomPadding
            drawer.drawColumns()
        }
    }

}
