import { AbstractTelemap } from './AbstractTelemap'
import { Telechart } from '../Telechart'
import { LineChartDrawer } from '../Drawer/LineChartDrawer'
import { Telecolumn } from '../Telecolumn'

export class TwoAxisTelemap extends AbstractTelemap {

    constructor(telechart: Telechart) {
        super(telechart)
        this.drawers.push(new LineChartDrawer(telechart, { topPadding: this.topPadding, bottomPadding: this.bottomPadding }))
        this.drawers.push(new LineChartDrawer(telechart, { noGuides: true, noMilestones: true, topPadding: this.topPadding, bottomPadding: this.bottomPadding }))
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
        for (const drawer of this.drawers as LineChartDrawer[]) {
            drawer.drawColumns()
        }
    }

}
