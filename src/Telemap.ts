import { Telechart } from './Telechart'
import { AbstractCoordinator } from './AbstractCoordinator'
import { Telecolumn } from './Telecolumn'

export class Telemap extends AbstractCoordinator {
    protected config!: { rangeBackground: string, rangeFill: string, shadow: string }
    protected element!: HTMLElement
    protected leftGripper!: HTMLElement
    protected rightGripper!: HTMLElement
    protected rangeProperty: { from: number, to: number }|null = null
    protected bottomPadding = 5
    private themeProperty: 'light'|'dark' = 'light'

    constructor(telechart: Telechart, parentElement: HTMLElement) {
        super(telechart)
        this.initHTML(parentElement)
        this.theme = telechart.theme
    }

    public addColumn(column: Telecolumn) {
        super.addColumn(column)
        this.range = { from: .8, to: 1 }
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
                rangeBackground: '#ddeaf3',
                rangeFill: '#fff',
                shadow: '#f5f9fbcc',
            }
        }
    }

    get topPadding() {
        return this.telechart.telecoordinator.height
    }

    get height() {
        return Math.max(38)
    }

    public draw() {
        this.telecanvas.rect(
            this.rangeProperty!.from * this.telecanvas.width, this.topPadding - 5,
            (this.rangeProperty!.to - this.rangeProperty!.from) * this.telecanvas.width, this.height + 5, this.config.rangeBackground,
        )
        this.telecanvas.rect(
            this.rangeProperty!.from * this.telecanvas.width + 4, this.topPadding - 4,
            (this.rangeProperty!.to - this.rangeProperty!.from) * this.telecanvas.width - 8, this.height + 3, this.config.rangeFill,
        )
        this.element.style.left = `${this.rangeProperty!.from * this.telecanvas.width}px`
        this.element.style.width = `${(this.rangeProperty!.to - this.rangeProperty!.from) * this.telecanvas.width}px`
    }

    public postDraw() {
        this.telecanvas.rect(0, this.topPadding - 5, this.rangeProperty!.from * this.telecanvas.width, this.height + 5, this.config.shadow)
        this.telecanvas.rect(
            this.rangeProperty!.from * this.telecanvas.width + (this.rangeProperty!.to - this.rangeProperty!.from) * this.telecanvas.width, this.topPadding - 5,
            this.telecanvas.width - this.rangeProperty!.from * this.telecanvas.width + (this.rangeProperty!.to - this.rangeProperty!.from) * this.telecanvas.width, this.height + 5, this.config.shadow,
        )
    }

    set range(value: { from: number, to: number }|null) {
        this.rangeProperty = value
        this.columns.forEach(c => c.setCurrentRange(
            this.borders.minX + (this.borders.maxX - this.borders.minX) * value!.from,
            this.borders.minX + (this.borders.maxX - this.borders.minX) * value!.to,
        ))
        this.telechart.telecoordinator.recalcBorders()
        this.telechart.redraw()
    }

    get range(): { from: number, to: number }|null {
        return this.rangeProperty
    }

    protected initHTML(parentElement: HTMLElement) {
        const element = this.element = document.createElement('div')
        element.classList.add('telechart-map-elt')
        element.style.position = 'absolute'
        element.style.height = `${this.height + 5}px`
        element.style.bottom = '0'
        element.style.cursor = 'ew-resize'

        const leftGripper = this.leftGripper = document.createElement('div')
        leftGripper.classList.add('telechart-map-left-gripper')
        leftGripper.style.position = 'absolute'
        leftGripper.style.left = '-10px'
        leftGripper.style.top = '0'
        leftGripper.style.width = '25px'
        leftGripper.style.height = '100%'

        const rightGripper = this.rightGripper = document.createElement('div')
        rightGripper.classList.add('telechart-map-right-gripper')
        rightGripper.style.position = 'absolute'
        rightGripper.style.right = '-10px'
        rightGripper.style.top = '0'
        rightGripper.style.width = '25px'
        rightGripper.style.height = '100%'

        this.element.appendChild(this.leftGripper)
        this.element.appendChild(this.rightGripper)
        parentElement.appendChild(this.element)

        let currentPos = { left: 0, top: 0 }
        let startRange: { from: number, to: number }|null = null
        let startPos: { left: number, top: number }|null = null
        let moveType: 'all'|'from'|'to' = 'all'
        let timeout: number|null = null
        const mousemove = (x: number, y: number) => {
            currentPos = { left: x, top: y }
            if (!startPos) {
                return
            }
            if (timeout) {
                return
            }
            timeout = setTimeout(() => {
                timeout = null
                if (!startPos || !startRange) {
                    return
                }
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
            }, 10)
        }
        const mousedown = (type: 'all'|'from'|'to' = 'all') => {
            moveType = type
            startPos = { ...currentPos }
            startRange = { ...this.rangeProperty! }
        }
        const mouseup = () => {
            startPos = null
            startRange = null
        }
        window.addEventListener('touchmove', e => mousemove(e.touches[0].clientX, e.touches[0].clientY))
        window.addEventListener('mousemove', e => mousemove(e.clientX, e.clientY))
        this.element.addEventListener('touchstart', e => {
            mousemove(e.touches[0].pageX, e.touches[0].pageY)
            mousedown()
            return false
        })
        this.leftGripper.addEventListener('touchstart', e => {
            mousemove(e.touches[0].clientX, e.touches[0].clientY)
            mousedown('from')
            e.stopPropagation()
            return false
        })
        this.leftGripper.addEventListener('mousedown', e => {
            mousedown('from')
            e.stopPropagation()
            return false
        })
        this.rightGripper.addEventListener('mousedown', e => {
            mousedown('to')
            e.stopPropagation()
            return false
        })
        this.rightGripper.addEventListener('touchstart', e => {
            mousemove(e.touches[0].clientX, e.touches[0].clientY)
            mousedown('to')
            e.stopPropagation()
            return false
        })
        this.element.addEventListener('mousedown', () => mousedown())
        window.addEventListener('touchend', mouseup)
        window.addEventListener('mouseup', mouseup)
    }

}
