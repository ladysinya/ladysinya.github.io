class Tag {
    constructor(type, x, y, w, h) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    draw(ctx) {
        const canvasH = ctx.canvas.height;
        const canvasW = ctx.canvas.width;

        ctx.strokeStyle = 'red';
        ctx.strokeRect(this.x, this.y, this.w, this.h);
    }

    move(x, y) {}
    resize(x, y) {}
}