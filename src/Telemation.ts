export class Telemation {

    public static create(to: number): Telemation
    public static create(from: number, to: number, duration: number): Telemation

    public static create(a: number, b?: number, c?: number) {
        if (arguments.length === 1) {
            return new Telemation(0, a, 0)
        }
        return new Telemation(a, b!, c!)
    }

    public finished: boolean
    protected start: number

    constructor(public readonly from: number, public readonly to: number, protected readonly duration: number) {
        this.start = Date.now()
        this.finished = !duration
    }

    get value() {
        if (this.finished) {
            return this.to
        }
        const p = Math.min(1, Math.max(0, ((Date.now() - this.start)) / this.duration))
        if (p === 1) {
            this.finished = true
            return this.to
        } else if (p === 0) {
            return this.from
        }
        return (this.from + (this.to - this.from) * (p * (2 - p)))
    }

}
