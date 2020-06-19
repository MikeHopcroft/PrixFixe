import { Cart } from '../cart';

export interface State {
  cart: Cart;
}

export type Processor = (text: string, state: State) => Promise<State>;
