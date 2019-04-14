import { Telechart } from './Telechart'
import { Telemation } from './Telemation'

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
    public readonly values: Array<{ x: number, y: number}>
    public opacity: Telemation
    public width = 2
    public current: { x: number, y: number }|null = null
    public config!: { background: string }
    private visibleProperty = true
    private readonly telechart: Telechart
    private currentRange: { from: number, to: number }|null = null
    private themeProperty: 'light'|'dark' = 'light'

    constructor(telechart: Telechart, data: ITelechartColumnData) {
        this.telechart = telechart
        this.id = data.id
        this.name = data.name
        this.values = data.values
        this.color = data.color
        this.theme = telechart.theme
        this.opacity = this.visible ? Telemation.create(1) : Telemation.create(0)
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
            this.opacity = value ? Telemation.create(0, 1, 200) : Telemation.create(1, 0, 200)
        }
    }

    get currentValues() {
        return this.currentRange ? this.values.filter(v => v.x >= this.currentRange!.from && v.x <= this.currentRange!.to) : []
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
        const oldValue = this.current
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
        if (this.current !== oldValue) {
            return true
        }
    }

    get currentPoint(): { x: number, y: number }|null {
        return this.current
    }

    public setCurrentRange(from: number, to: number) {
        this.currentRange = { from, to }
    }

}
