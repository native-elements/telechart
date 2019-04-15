import { AbstractTelemap } from './AbstractTelemap'
import { Telecolumn } from '../Telecolumn'
import { Telechart } from '../Telechart'
import { StackedChartDrawer } from '../Drawer/StackedChartDrawer'

export class StackedTelemap extends AbstractTelemap {

    constructor(telechart: Telechart) {
        super(telechart)
        this.drawers.push(new StackedChartDrawer(telechart, { noGuides: true, noMilestones: true, topPadding: this.topPadding, bottomPadding: this.bottomPadding }))
    }

    public addColumn(column: Telecolumn) {
        this.drawers.forEach(d => d.addColumn(column))
        super.addColumn(column)
    }

    protected drawColumns() {
        for (const drawer of this.drawers) {
            drawer.drawColumns()
        }
    }

}
