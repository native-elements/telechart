import { AbstractTelemap } from './AbstractTelemap'
import { Telechart } from '../Telechart'
import { SimpleChartDrawer } from '../Drawer/SimpleChartDrawer'
import { Telecolumn } from '../Telecolumn'

export class TwoAxisTelemap extends AbstractTelemap {

    constructor(telechart: Telechart) {
        super(telechart)
        this.drawers.push(new SimpleChartDrawer(telechart))
        this.drawers.push(new SimpleChartDrawer(telechart, { noGuides: true, noMilestones: true }))
    }

    public addColumn(column: Telecolumn) {
        if (this.columns.length === 0) {
            this.drawers[0].addColumn(column)
        } else if (this.columns.length === 1) {
            this.drawers[1].addColumn(column)
        }
        super.addColumn(column)
    }

    protected drawColumns() {
        if (!this.firstDrawer) {
            return
        }
        for (const drawer of this.drawers as SimpleChartDrawer[]) {
            drawer.topPadding = this.topPadding
            drawer.bottomPadding = this.bottomPadding
            drawer.drawColumns()
        }
    }

}
