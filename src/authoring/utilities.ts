export class IdGenerator {
    current = 1;
    rounding = 100;

    constructor(start = 1, rounding = 100) {
        this.current = start;
        this.rounding = rounding;
    }

    next() {
        return this.current++;
    }

    gap() {
        this.current = (Math.floor(this.current / this.rounding) + 1) * this.rounding;
    }
}
