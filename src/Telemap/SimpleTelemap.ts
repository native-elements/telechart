import { AbstractTelemap } from './AbstractTelemap'
import { Telecolumn } from '../Telecolumn'
import { Telechart } from '../Telechart'
import { SimpleChartDrawer } from '../Drawer/SimpleChartDrawer'

export class SimpleTelemap extends AbstractTelemap {

    constructor(telechart: Telechart) {
        super(telechart)
        this.drawers.push(new SimpleChartDrawer(telechart, { noGuides: true, noMilestones: true }))
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
