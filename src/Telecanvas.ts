type Coordinate = [number, number]
type MouseMoveListener = (x: number, y: number) => void

export class Telecanvas {
    private mouseMoveListeners: MouseMoveListener[] = []
    private mouseDownListeners: Array<(x: number, y: number) => void> = []
    private mouseUpListeners: Array<() => void> = []
    private canvas: HTMLCanvasElement
    private context: CanvasRenderingContext2D

    constructor(parentElement: HTMLElement) {
        const getCtr = () => window.devicePixelRatio || 1
        this.canvas = parentElement.appendChild(document.createElement('canvas'))
        this.canvas.height = parentElement.offsetHeight * getCtr()
        this.canvas.style.height = `${parentElement.offsetHeight}px`
        this.canvas.style.display = 'block'
        this.context = this.canvas.getContext('2d')!
        window.addEventListener('resize', () => {
            this.canvas.width = parentElement.clientWidth * getCtr()
            this.canvas.style.width = '100%'
            this.context.scale(getCtr(), getCtr())
        })

        let x = 0
        let y = 0
        this.canvas.addEventListener('mousemove', (e) => {
            x = e.clientX
            y = e.clientY
            this.mouseMoveListeners.forEach(callback => callback(e.offsetX, e.offsetY))
        })
        this.canvas.addEventListener('mousedown', () => this.mouseDownListeners.forEach(callback => callback(x, y)))
        this.canvas.addEventListener('touchstart', (e) => {
            x = e.touches[0].clientX
            y = e.touches[0].clientX
            this.mouseDownListeners.forEach(callback => callback(x, y))
        })
        this.canvas.addEventListener('mouseup', () => this.mouseUpListeners.forEach(callback => callback()))
        this.canvas.addEventListener('touchend', () => this.mouseUpListeners.forEach(callback => callback()))
    }

    get width() {
        return this.canvas.clientWidth
    }

    get height() {
        return this.canvas.clientHeight
    }

    public line(from: Coordinate, to: Coordinate, color: string, width = 1) {
        const c = this.context
        c.lineCap = 'round'
        c.strokeStyle = color
        c.lineWidth = width
        c.beginPath()
        c.moveTo(from[0] + .5, from[1] + .5)
        c.lineTo(to[0] + .5, to[1] + .5)
        c.stroke()
    }

    public path(path: Array<[number, number]>, color: string, width = 1) {
        const c = this.context
        c.lineCap = 'round'
        c.lineJoin = 'round'
        c.strokeStyle = color
        c.lineWidth = width
        c.beginPath()
        c.moveTo(path[0][0] + .5, path[0][1] + .5)
        for (let n = 1; n < path.length; n++) {
            c.lineTo(path[n][0] + .5, path[n][1] + .5)
        }
        c.stroke()
    }

    public circle(point: [number, number], radius: number, stroke: string|null, fill: string|null, borderWidth: number = 1) {
        const c = this.context
        c.beginPath()
        c.arc(point[0], point[1], radius, 0, 2 * Math.PI)
        if (fill) {
            c.fillStyle = fill
            c.fill()
        }
        if (stroke) {
            c.strokeStyle = stroke
            c.lineWidth = borderWidth
            c.stroke()
        }
    }

    public text(text: string, to: Coordinate, color: string, fontFamily = 'sans-serif', size = 14, align: 'left'|'right'|'center'|'start'|'end' = 'left') {
        const c = this.context
        c.fillStyle = color
        c.font = `${size}px "${fontFamily}"`
        c.textAlign = align
        c.fillText(text, to[0], to[1])
    }

    public rect(left: number, top: number, width: number, height: number, fill?: string, stroke?: string, borderWidth?: number) {
        const c = this.context
        c.beginPath()
        c.rect(left, top, width, height)
        if (fill) {
            c.fillStyle = fill
            c.fill()
        }
        if (stroke) {
            c.strokeStyle = stroke
            c.lineWidth = borderWidth!
            c.stroke()
        }
    }

    public clear() {
        this.context.clearRect(0, 0, this.width, this.height);
    }

    public addMouseMoveListener(callback: (x: number, y: number) => void) {
        this.mouseMoveListeners.push(callback)
    }

    public addMouseDownListener(callback: (x: number, y: number) => void) {
        this.mouseDownListeners.push(callback)
    }

    public addMouseUpListener(callback: () => void) {
        this.mouseUpListeners.push(callback)
    }

}
