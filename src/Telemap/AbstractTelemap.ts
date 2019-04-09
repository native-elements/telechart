import { Telechart } from '../Telechart'
import { AbstractChartDrawer } from '../Drawer/AbstractChartDrawer'
import { Telecolumn } from '../Telecolumn'
import { Telecanvas } from '../Telecanvas'
import { Telemation } from '../Telemation'

export abstract class AbstractTelemap {
    protected config!: { rangeBackground: string, rangeFill: string, shadow: string }
    protected rangeProperty: { from: Telemation, to: Telemation }|null = null
    protected topPadding = 0
    protected bottomPadding = 0
    protected cacheTeelcanvas: Telecanvas
    protected telecanvasCached = false
    protected columns: Telecolumn[] = []
    protected drawers: AbstractChartDrawer[] = []
    private themeProperty: 'light'|'dark' = 'light'

    constructor(protected readonly telechart: Telechart, public height = 38) {
        this.theme = telechart.theme
        this.topPadding = this.telecanvas.height - height
        this.initHTML()
        this.cacheTeelcanvas = new Telecanvas(null, this.height, this.telecanvas.width)
        window.addEventListener('resize', () => {
            this.cacheTeelcanvas.width = this.telecanvas.width
            this.telecanvasCached = false
        })
    }

    get telecanvas() {
        return this.telechart.telecanvas
    }

    get firstDrawer() {
        return this.drawers.length ? this.drawers[0] : undefined
    }

    public addColumn(column: Telecolumn) {
        this.columns.push(column)
        this.range = { from: .8, to: 1 }
    }

    public removeColumn(column: Telecolumn) {
        this.columns.splice(this.columns.indexOf(column), 1)
        this.drawers.forEach(d => d.removeColumn(column))
    }

    get theme() {
        return this.themeProperty
    }

    set theme(value) {
        this.themeProperty = value
        if (value === 'dark') {
            this.config = {
                ...this.config,
                rangeBackground: '#40566b',
                rangeFill: '#242f3e',
                shadow: '#1f2a38cc',
            }
        } else {
            this.config = {
                ...this.config,
                rangeBackground: '#c0d1e1',
                rangeFill: '#fff',
                shadow: '#e7f3fb99',
            }
        }
    }

    set range(value: { from: number, to: number }|null) {
        const current = this.range
        this.rangeProperty = {
            from: Telemation.create(current ? current.from : 0, value!.from, current ? 50 : 0),
            to: Telemation.create(current ? current.to : 0, value!.to, current ? 50 : 0),
        }
        if (!this.firstDrawer) {
            return
        }
        this.columns.forEach(c => c.setCurrentRange(
            this.firstDrawer!.borders.minX.to + (this.firstDrawer!.borders.maxX.to - this.firstDrawer!.borders.minX.to) * value!.from,
            this.firstDrawer!.borders.minX.to + (this.firstDrawer!.borders.maxX.to - this.firstDrawer!.borders.minX.to) * value!.to,
        ))
        this.telechart.teledisplay.recalcBorders(200)
    }

    get range(): { from: number, to: number }|null {
        return this.rangeProperty ? { from: this.rangeProperty!.from.value, to: this.rangeProperty!.to.value } : null
    }

    public draw() {
        const c = this.telecanvas
        const left = this.rangeProperty!.from.value * this.telecanvas.width
        const width = (this.rangeProperty!.to.value - this.rangeProperty!.from.value) * this.telecanvas.width

        if (this.columns.reduce((r, col) => !col.opacity.finished || r, false) || !this.firstDrawer!.borders.maxY.finished) {
            this.telecanvasCached = false
        }
        if (!this.telecanvasCached) {
            this.cacheTeelcanvas.clear()
            this.drawColumns()
            this.cacheTeelcanvas.drawTelecanvas(this.telecanvas, 0, -this.topPadding)
            this.telecanvasCached = true
            c.clear()
        }
        c.drawTelecanvas(this.cacheTeelcanvas, 0, this.topPadding)

        c.roundedRect(0, this.topPadding, left + 6, this.height, 6, this.config.shadow) // Shadow to left
        c.roundedRect(left + width - 6, this.topPadding, this.telecanvas.width - left - width + 6, this.height, 6, this.config.shadow) // Shadow to right

        c.roundedRect(left, this.topPadding, 10, this.height, 6, this.config.rangeBackground) // Left gripper corners
        c.rect(left + 5, this.topPadding, 5, this.height, this.config.rangeBackground) // Left gripper rect
        c.roundedRect(left + 4, this.topPadding + 13, 2, 12, 2, this.config.rangeFill) // Left gripper strip

        c.roundedRect(left + width - 10, this.topPadding, 10, this.height, 6, this.config.rangeBackground) // Right gripper corners
        c.rect(left + width - 10, this.topPadding, 5, this.height, this.config.rangeBackground) // Right gripper rect
        c.roundedRect(left + width - 6, this.topPadding + 13, 2, 12, 2, this.config.rangeFill) // Right gripper strip

        c.line([left + 10 - 1, this.topPadding], [left + width - 10, this.topPadding], this.config.rangeBackground)
        c.line([left + 10 - 1, this.topPadding + this.height - 1], [left + width - 10, this.topPadding + this.height - 1], this.config.rangeBackground)

        if (!this.rangeProperty!.to.finished) {
            this.telechart.redraw()
        }
    }

    public recalcBorders(duration: number = 0) {
        this.drawers.forEach(d => d.recalcBorders(duration))
        this.telechart.redraw()
    }

    protected abstract drawColumns(): void

    protected initHTML() {
        let currentPos = { left: 0, top: 0 }
        let startRange: { from: number, to: number }|null = null
        let startPos: { left: number, top: number }|null = null
        let moveType: 'all'|'from'|'to'|null = null
        let yInArea = false
        const mousemove = (x: number, y: number) => {
            currentPos = { left: x, top: y }
            yInArea = y >= this.topPadding && y < this.topPadding + this.height

            if (!startPos || !startRange) {
                if (yInArea) {
                    const left = this.range!.from * this.telecanvas.width
                    const width = (this.range!.to - this.range!.from) * this.telecanvas.width
                    if (x >= left - 5 && x <= left + 20) {
                        moveType = 'from'
                        this.telecanvas.cursor = 'ew-resize'
                    } else if (x >= left + width - 15 && x < left + width + 5) {
                        moveType = 'to'
                        this.telecanvas.cursor = 'ew-resize'
                    } else if (x >= left && x < left + width) {
                        moveType = 'all'
                        this.telecanvas.cursor = 'move'
                    } else {
                        moveType = null
                        this.telecanvas.cursor = 'default'
                    }
                } else {
                    this.telecanvas.cursor = 'default'
                }
                return
            }
            this.columns.forEach(c => c.setCurrentX(null))
            const diff = (currentPos.left - startPos!.left) / this.telecanvas.width
            let newRangeFrom = startRange!.from
            let newRangeTo = startRange!.to
            if (moveType === 'all' || moveType === 'from') {
                newRangeFrom += diff
            }
            if (moveType === 'all' || moveType === 'to') {
                newRangeTo += diff
            }
            if (newRangeFrom < 0) {
                if (moveType === 'all' || moveType === 'to') {
                    newRangeTo = newRangeTo - newRangeFrom
                }
                newRangeFrom = 0
            }
            if (newRangeTo > 1) {
                if (moveType === 'all' || moveType === 'from') {
                    newRangeFrom = newRangeFrom - (newRangeTo - 1)
                }
                newRangeTo = 1
            }
            if (newRangeTo - newRangeFrom < 0.05) {
                if (moveType === 'to') {
                    newRangeTo = newRangeFrom + 0.05
                } else {
                    newRangeFrom = newRangeTo - 0.05
                }
            }
            this.range = { from: newRangeFrom, to: newRangeTo }
        }
        const mousedown = (x: number, y: number) => {
            if (moveType) {
                startPos = { ...currentPos }
                startRange = { ...this.range! }
            }
        }
        const mouseup = () => {
            startPos = null
            startRange = null
        }
        this.telecanvas.addMouseMoveListener(mousemove)
        this.telecanvas.addMouseDownListener((x, y) => {
            mousemove(x, y)
            mousedown(x, y)
        })
        this.telecanvas.addMouseUpListener(mouseup)
    }

}
