import { KEY, PID, Option } from '../catalog';
import { AID, Cart, ItemInstance, UID, } from './interfaces';
import { Item } from '../item';
import { AttributeUtils, CartUtils } from './cart'
import { duplicateHamburger1, duplicateUIDItem, hamburger1, testCart, testOption, unaddedItem } from './fakeCartData'

///////////////////////////////////////////////////////////////////////////////
//
// CartUtils Tests
//
///////////////////////////////////////////////////////////////////////////////

const cartOps = new CartUtils();

let myCart: Cart = testCart;



const findItemByKeyTest = (myCart: Cart, myKey: KEY): void => {
    const gen: IterableIterator<ItemInstance> = cartOps.findItemByKey(myCart, myKey);
    printIterableResults(gen);
}
// WORKING AS EXPECTED
// console.log(`\n\n##### FIND ITEM BY PARENT PID TEST #####`);
// findItemByKeyTest(myCart, 'e');



const findItemByPIDTest = (myCart: Cart, myPid: PID): void => {
    const gen: IterableIterator<ItemInstance> = cartOps.findItemByPID(myCart, myPid);
    printIterableResults(gen);
}
// TODO: Only returns one instance, not ALL matching instances.
// console.log(`\n\n##### FIND ITEM BY PARENT PID TEST #####`);
// findItemByPIDTest(myCart, 2);



const findItemByChildKeyTest = (myCart: Cart, myKey: KEY): void => {
    const gen: IterableIterator<ItemInstance> = cartOps.findItemByChildKey(myCart, myKey);
    printIterableResults(gen);
}
// WORKING AS EXPECTED
// console.log(`\n##### FIND ITEM BY CHILD KEY TEST #####`);
// findItemByChildKeyTest(myCart, 'c');



// Test for findItemByChildPid.
const findItemByChildPIDTest = (myCart: Cart, myPid: PID): void => {
    const gen: IterableIterator<ItemInstance> = cartOps.findItemByChildPID(myCart, myPid);
    printIterableResults(gen);
}
// TODO: Only returns one instance, not ALL matching instances.
// console.log(`\n##### FIND ITEM BY CHILD PID TEST #####`);
// findItemByChildPIDTest(myCart, 0);



// const findCompatibleItemsTest = (myCart: Cart, myOption: ItemInstance): void => {
//     const gen: IterableIterator<ItemInstance> = cartOps.findCompatibleItems(myCart, myOption);
//     printIterableResults(gen);
// }
// // TODO: Implement.
// console.log(`\n##### FIND COMPATIBLE ITEMS BY OPTION TEST #####`);
// findCompatibleItemsTest(myCart, testOption);



const findChildByKeyTest = (myItem: ItemInstance, myKey: KEY): void => {
    const gen: IterableIterator<ItemInstance> = cartOps.findChildByKey(myItem, myKey);
    printIterableResults(gen);
}
// WORKING AS EXPECTED SINCE THERE SHOULDN'T EVER BE TWO CHILDREN WITH THE SAME
// PID FOR A SINGLE ITEM
// console.log(`\n##### FIND CHILD BY KEY TEST #####`);
// findChildByKeyTest(hamburger1, 'c');



const findChildByPIDTest = (myItem: ItemInstance, myPid: PID): void => {
    const gen: IterableIterator<ItemInstance> = cartOps.findChildByPID(myItem, myPid);
    printIterableResults(gen);
}
// WORKING AS EXPECTED
// console.log(`\n##### FIND CHILD BY PID TEST #####`);
// findChildByPIDTest(hamburger1, 0);



// Helper that prints results from an iterator.
function printIterableResults(gen: IterableIterator<ItemInstance>) {
    let done: boolean = false;
    while (!done) {
        console.log('NEXT VALUE:');
        console.log(gen.next().value);
        done = gen.next().done;
    }
}



const addItemTest = (myCart: Cart, myItem: ItemInstance): void => {
    const resCart: Cart = cartOps.addItem(myCart, myItem);
    console.log(resCart);
}
// WORKING AS EXPECTED
// console.log(`\n##### ADD ITEM TO CART TEST #####`);
// addItemTest(testCart, unaddedItem);
// NOT SURE HOW WE SHOULD REACT IN THIS CASE, SEE TODO IN CART.TS
// console.log(`\n##### ADD A DUPLICATE ITEM TO CART TEST #####`);
// addItemTest(testCart, duplicateHamburger1);



const replaceItemTest = (myCart: Cart, myItem: ItemInstance): void => {
    const resCart: Cart = cartOps.replaceItem(myCart, myItem);
    console.log(resCart);
}
// WORKING AS EXPECTED
// console.log(`\n##### REPLACE ITEM IN CART TEST #####`);
// replaceItemTest(testCart, duplicateUIDItem);



const removeItemTest = (myCart: Cart, myItem: ItemInstance): void => {
    const resCart: Cart = cartOps.removeItem(myCart, myItem);
    console.log(resCart);
}
// WORKING AS EXPECTED
// console.log(`\n##### REMOVE ITEM IN CART TEST #####`);
// removeItemTest(testCart, hamburger1);



const addChildTest = (myParent: ItemInstance, myChild: ItemInstance): void => {
    const resItem: ItemInstance = cartOps.addChild(myParent, myChild);
    console.log(resItem);
}
// TODO
// console.log(`\n##### ADD CHILD TEST #####`);
// replaceItemTest(hamburger1, lettuce1);



const updateChildTest = (myParent: ItemInstance, myChild: ItemInstance): void => {
    const resItem: ItemInstance = cartOps.updateChild(myParent, myChild);
    console.log(resItem);
}
// TODO
// console.log(`\n##### UPDATE CHILD TEST #####`);
// updateChildTest(hamburger1, lettuce1);



const removeChildTest = (myParent: ItemInstance, myChild: ItemInstance): void => {
    const resItem: ItemInstance = cartOps.removeChild(myParent, myChild);
    console.log(resItem);
}
// TODO
// console.log(`\n##### REMOVE CHILD TEST #####`);
// removeChildTest(hamburger1, lettuce1);



const updateAttributesTest = (myParent: ItemInstance, myAttributes: Set<AID>): void => {
    const resItem: ItemInstance = cartOps.updateAttributes(myParent, myAttributes);
    console.log(resItem);
}
// TODO
// console.log(`\n##### UPDATE ATTRIBUTES TEST #####`);
// updateAttributesTest(hamburger1, lettuce1);



///////////////////////////////////////////////////////////////////////////////
//
// AttributeUtils Tests
//
///////////////////////////////////////////////////////////////////////////////

const atrOps = new AttributeUtils();



const createItemInstanceTest = (myPID: PID, myAttributes: Set<AID>): void => {
    const resItem: ItemInstance | undefined = atrOps.createItemInstance(myPID, myAttributes);
    console.log(resItem);
}
// TODO
// console.log(`\n##### UPDATE ATTRIBUTES TEST #####`);
// createItemInstanceTest(hamburger1, lettuce1);