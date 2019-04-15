import { StackedTelemap } from './StackedTelemap'
import Telechart from '../index';
import { StackedPercentChartDrawer } from '../Drawer/StackedPercentChartDrawer'

export class StackedPercentTelemap extends StackedTelemap {

    constructor(telechart: Telechart) {
        super(telechart)
        this.drawers.push(new StackedPercentChartDrawer(telechart, { noGuides: true, noMilestones: true, topPadding: this.topPadding, bottomPadding: this.bottomPadding }))
    }

}
