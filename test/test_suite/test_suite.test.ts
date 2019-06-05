import { assert } from 'chai';
import 'mocha';

import { AttributeInfo, CartOps, ItemInstance, State } from '../../src';

import {
    caffeineDecaf,
    flavorChocolate,
    genericCoffeePID,
    genericConePID,
    genericMilkPID,
    milkSoy,
    temperatureCold,
    smallWorldAttributes,
    smallWorldCatalog,
    smallWorldRuleChecker,
} from '../shared';

// Load from YAML
// Format results
// Correctly gather results
// Tabulate pass/fail
// Explain differences
// Rebasing - fromTextLines
// Running multiple steps

type FakeOperation = (state: State) => State; 

class FakeProcessor {
    private readonly cartOps: CartOps;

    private readonly utterances = new Map<string, FakeOperation>([
        ['give me a medium iced soy coffee', (state: State): State => {
            const milkQuantity = 1;
            const milkPID = genericMilkPID;
            const milkAIDs = [milkSoy].values();
            const milkChildren = [].values();
            const milk = this.cartOps.createItem(
                milkQuantity,
                milkPID,
                milkAIDs,
                milkChildren
            );

            const quantity = 1;
            const pid = genericCoffeePID;
            const aids = [temperatureCold].values();
            const children = [milk].values();
            const item = this.cartOps.createItem(
                quantity,
                pid,
                aids,
                children
            );
            return {...state, cart: this.cartOps.addToCart(state.cart, item)};
        }],

        ['i want a large chocolate cone', (state: State): State => {
            const quantity = 1;
            const pid = genericConePID;
            const aids = [flavorChocolate].values();
            const children = [].values();
            const item = this.cartOps.createItem(
                quantity,
                pid,
                aids,
                children
            );
            return {...state, cart: this.cartOps.addToCart(state.cart, item)};
        }],


        ['actually make that two cones', (state: State): State => {
            const cone = [...this.cartOps.findByPID(state.cart, genericConePID)][0];
            const item = {...cone, quantity: 2};
            return {...state, cart: this.cartOps.replaceInCart(state.cart, item)};
        }],

        ['can you make the coffee decaf', (state: State): State => {
            const coffee = [...this.cartOps.findByPID(state.cart, genericCoffeePID)][0];
            const aids = [caffeineDecaf].values();
            const item = this.cartOps.changeItemAttributes(coffee, aids);

            return {...state, cart: this.cartOps.replaceInCart(state.cart, item)};
        }],
    ]);

    constructor(cartOps: CartOps) {
        this.cartOps = cartOps;
    }

    async process(text: string, state: State): Promise<State> {
        return this.processSynchronous(text, state);
    }

    processSynchronous(text: string, state: State): State {
        const f = this.utterances.get(text);
        if (f === undefined) {
            return state;
        }
        else {
            return f(state);
        }
    }
}

const attributeInfo = new AttributeInfo(
    smallWorldCatalog,
    smallWorldAttributes
);

const cartOps: CartOps = new CartOps(
    attributeInfo,
    smallWorldCatalog,
    smallWorldRuleChecker
);



describe('TestSuite', () => {
    // it('should do something', async () => {
    it('should do something', () => {
        const fake = new FakeProcessor(cartOps);

        const state1: State = { cart: { items: [] }};
        const state2 = fake.processSynchronous('give me a medium iced soy coffee', state1);
        const state3 = fake.processSynchronous('i want a large chocolate cone with sprinkles', state2);
        const state4 = fake.processSynchronous('actually make that two cones', state3);
        const state5 = fake.processSynchronous('can you make the coffee decaf', state4);

        // const state2 = await fake.process('give me a medium iced soy coffee', state1);
        // const state3 = await fake.process('i want a large chocolate cone with sprinkles', state2);
        // const state4 = await fake.process('actually make that two cones', state3);
        // const state5 = await fake.process('can you make the coffee decaf', state4);
    });
});

