export class IDGenerator {
    private nextIdValue = 1;

    nextId() {
        return this.nextIdValue++;
    }
}
