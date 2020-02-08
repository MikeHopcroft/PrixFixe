// TODO: yaml file schemas
// TODO: yaml loader and validator

export interface LogicalItem {
    quantity: number;
    name: string;       // TODO: should we retain this field?
    sku: string;
    children: LogicalItem[];
}

export interface LogicalCart {
    items: LogicalItem[];
}

export interface LogicalCartScore {
    score: number;
    explanation: string;
}

