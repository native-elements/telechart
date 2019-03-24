import { Telechart } from './Telechart'

export interface ITelechartColumnData {
    id: string
    name: string
    values: Array<{ x: number, y: number}>
    color: string
}

export class Telecolumn {
    public readonly id: string|number
    public readonly name: string
    public readonly color: string
    protected config!: { background: string }
    private visibleProperty = true
    private visibleAnimationStep = 0
    private readonly telechart: Telechart
    private readonly values: Array<{ x: number, y: number}>
    private current: { x: number, y: number }|null = null
    private currentRange: { from: number, to: number }|null = null
    private width = 2
    private animationSteps = 10
    private themeProperty: 'light'|'dark' = 'light'

    constructor(telechart: Telechart, data: ITelechartColumnData) {
        this.telechart = telechart
        this.id = data.id
        this.name = data.name
        this.values = data.values
        this.color = data.color
        this.theme = telechart.theme
    }

    get theme() {
        return this.themeProperty
    }

    set theme(value) {
        this.themeProperty = value
        if (value === 'dark') {
            this.config = {
                ...this.config,
                background: '#242f3e',
            }
        } else {
            this.config = {
                ...this.config,
                background: '#fff',
            }
        }
    }

    get visible() {
        return this.visibleProperty
    }

    set visible(value: boolean) {
        if (value !== this.visibleProperty) {
            this.visibleProperty = value
            this.visibleAnimationStep = this.animationSteps
        }
    }

    get currentValues() {
        return this.currentRange ? this.values.filter(v => v.x >= this.currentRange!.from && v.x <= this.currentRange!.to) : []
    }

    get telecanvas() {
        return this.telechart.telecanvas
    }

    public getMinX(inCurrentRange = false): number {
        if (inCurrentRange && this.currentRange) {
            return this.currentRange.from
        }
        const result = this.values.reduce((res: number|null, val) => {
            return res === null ? val.x : Math.min(res, val.x)
        }, null)
        return result ? result : 0
    }

    public getMaxX(inCurrentRange = false): number {
        if (inCurrentRange && this.currentRange) {
            return this.currentRange.to
        }
        const result = this.values.reduce((res: number|null, val) => {
            return res === null ? val.x : Math.max(res, val.x)
        }, null)
        return result ? result : 0
    }

    public getMinY(inCurrentRange = false): number {
        const values = inCurrentRange && this.currentRange ? this.currentValues : this.values
        const result = values.reduce((res: number|null, val) => {
            return res === null ? val.y : Math.min(res, val.y)
        }, null)
        return result ? result : 0
    }

    public getMaxY(inCurrentRange = false): number {
        const values = inCurrentRange && this.currentRange ? this.currentValues : this.values
        const result = values.reduce((res: number|null, val) => {
            return res === null ? val.y : Math.max(res, val.y)
        }, null)
        return result ? result : 0
    }

    public setCurrentX(value: number|null) {
        if (value === null) {
            this.current = null
        } else {
            const currentValues = this.currentValues
            if (!currentValues) {
                return
            }
            let min: { val: number, index: number }|null = null
            for (let n = 0, length = currentValues.length; n < length; n++) {
                const v = currentValues[n]
                if (!min) {
                    min = { val: v.x, index: n }
                }
                if (Math.abs(v.x - value) < min.val) {
                    min = { val: Math.abs(v.x - value), index: n }
                }
            }
            if (min!) {
                this.current = currentValues[min!.index]
            }
        }
    }

    get currentPoint(): { x: number, y: number }|null {
        return this.current
    }

    public setCurrentRange(from: number, to: number) {
        this.currentRange = { from, to }
    }

    public draw() {
        const c = this.telechart.telecanvas
        const t = this.telechart.telecoordinator
        const m = this.telechart.telemap

        if (this.currentRange) {
            const allVals = this.values
                .map(v => [t.getCanvasX(v.x), t.getCanvasY(v.y)] as [number, number])
                .filter(v => v[0] >= -50 && v[0] <= c.width + 50)
            if (allVals.length) {
                const nextRedraw = !!this.visibleAnimationStep
                let opacity: number|string = this.visibleAnimationStep ? (this.visibleAnimationStep--) / this.animationSteps : 0
                opacity = this.visible ? 1 - opacity : opacity
                if (opacity) {
                    opacity = Math.round(opacity * 255).toString(16)
                    opacity = opacity.length < 2 ? '0' + opacity : opacity
                    c.path(allVals, this.color + opacity, this.width)
                    if (nextRedraw) {
                        this.telechart.redraw()
                    }
                }
            }
        }
        if (this.visible) {
            c.path(this.values
                .filter((v, i) => this.values.length > 130 ? i % 2 === 0 : true)
                .map(v => [m.getCanvasX(v.x), m.getCanvasY(v.y)] as [number, number]),
                this.color, this.width / 2,
            )
        }
    }

    public postDraw() {
        if (!this.visible) {
            return
        }
        const c = this.telechart.telecanvas
        const t = this.telechart.telecoordinator

        if (this.current) {
            c.circle([t.getCanvasX(this.current.x), t.getCanvasY(this.current.y)], 4.5, this.color, this.config.background, this.width)
        }
    }

}
