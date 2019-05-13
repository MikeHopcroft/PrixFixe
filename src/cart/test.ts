import { KEY, PID, Option } from '../catalog';
import { AID, Cart, ItemInstance, UID, } from './interfaces';
import { Item } from '../item';
import { AttributeUtils, CartUtils } from './cart'
import { testCart, testOption } from './fakeCartData'

const cartOps = new CartUtils();

let myCart: Cart = testCart;

// Test for findItemByKey.
const findItemByKeyTest = (myCart: Cart, myKey: KEY): void => {
    const gen: IterableIterator<ItemInstance> = cartOps.findItemByKey(myCart, myKey);
    printResults(gen);
}
// WORKING AS EXPECTED
// console.log(`\n\n##### FIND ITEM BY PARENT PID TEST #####`);
// findItemByKeyTest(myCart, 'e');



// Test for findItemByPID.
const findItemByPIDTest = (myCart: Cart, myPid: PID): void => {
    const gen: IterableIterator<ItemInstance> = cartOps.findItemByPID(myCart, myPid);
    printResults(gen);
}
// TODO: Only returns one instance, not ALL matching instances.
// console.log(`\n\n##### FIND ITEM BY PARENT PID TEST #####`);
// findItemByPIDTest(myCart, 2);



// Test for findItemByChildKey.
const findItemByChildKeyTest = (myCart: Cart, myKey: KEY): void => {
    const gen: IterableIterator<ItemInstance> = cartOps.findItemByChildKey(myCart, myKey);
    printResults(gen);
}
// WORKING AS EXPECTED
// console.log(`\n##### FIND ITEM BY CHILD KEY TEST #####`);
// findItemByChildKeyTest(myCart, 'c');



// Test for findItemByChildPid.
const findItemByChildPIDTest = (myCart: Cart, myPid: PID): void => {
    const gen: IterableIterator<ItemInstance> = cartOps.findItemByChildPID(myCart, myPid);
    printResults(gen);
}
// TODO: Only returns one instance, not ALL matching instances.
// console.log(`\n##### FIND ITEM BY CHILD PID TEST #####`);
// findItemByChildPIDTest(myCart, 0);



// Test for findCompatibleItems. WAITING ON RULE CHECKER.
const findCompatibleItemsTest = (myCart: Cart, myOption: ItemInstance): void => {
    const gen: IterableIterator<ItemInstance> = cartOps.findCompatibleItems(myCart, myOption);
    printResults(gen);
}
// TODO: Implement.
console.log(`\n##### FIND COMPATIBLE ITEMS BY OPTION TEST #####`);
findCompatibleItemsTest(myCart, testOption);



// Print results from the iterator.
function printResults(gen: IterableIterator<ItemInstance>) {
    let done: boolean = false;
    while (!done) {
        console.log('NEXT VALUE:');
        console.log(gen.next().value);
        done = gen.next().done;
    }
}