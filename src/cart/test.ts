import { KEY, PID, Option } from '../catalog';
import { AID, Cart, ItemInstance, UID, } from './interfaces';
import { Item } from '../item';
import { AttributeUtils, CartUtils } from './cart'
import { duplicateHamburger1, duplicateUIDCoke, duplicateUIDTomato, hamburger1, lettuce1, testCart, testOption, tomato1, unaddedItem } from './fakeCartData'

///////////////////////////////////////////////////////////////////////////////
//
// CartUtils Tests
//
///////////////////////////////////////////////////////////////////////////////

const cartOps = new CartUtils();

let myCart: Cart = testCart;



console.log(`\n\n##### TEST CART #####`);
console.log(myCart);



const findItemByKeyTest = (myCart: Cart, myKey: KEY): void => {
    const gen: IterableIterator<ItemInstance> = cartOps.findItemByKey(myCart, myKey);
    printIterableResults(gen);
}
// const itemByKey: KEY = 'e';
// console.log(`\n##### FIND ITEM BY PARENT KEY TEST #####`);
// console.log(`##### KEY === ${itemByKey}                    #####`);
// findItemByKeyTest(myCart, itemByKey);



const findItemByPIDTest = (myCart: Cart, myPid: PID): void => {
    const gen: IterableIterator<ItemInstance> = cartOps.findItemByPID(myCart, myPid);
    printIterableResults(gen);
}
// const itemByPID: PID = 2;
// console.log(`\n##### FIND ITEM BY PARENT PID TEST #####`);
// console.log(`##### PID === ${itemByPID}                    #####`);
// findItemByPIDTest(myCart, itemByPID);



const findItemByChildKeyTest = (myCart: Cart, myKey: KEY): void => {
    const gen: IterableIterator<ItemInstance> = cartOps.findItemByChildKey(myCart, myKey);
    printIterableResults(gen);
}
// const itemByChildKey: KEY = 'c';
// console.log(`\n##### FIND ITEM BY CHILD KEY TEST #####`);
// console.log(`##### KEY === ${itemByChildKey}                   #####`);
// findItemByChildKeyTest(myCart, itemByChildKey);



const findItemByChildPIDTest = (myCart: Cart, myPid: PID): void => {
    const gen: IterableIterator<ItemInstance> = cartOps.findItemByChildPID(myCart, myPid);
    printIterableResults(gen);
}
// const itemByChildPID: PID = 1;
// console.log(`\n##### FIND ITEM BY CHILD PID TEST #####`);
// console.log(`##### PID === ${itemByChildPID}                   #####`);
// findItemByChildPIDTest(myCart, itemByChildPID);



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
// const childByKey: KEY = 'c';
// console.log(`\n##### FIND CHILD BY KEY TEST #####`);
// console.log(`##### KEY === ${childByKey}              #####`);
// findChildByKeyTest(hamburger1, childByKey);



const findChildByPIDTest = (myItem: ItemInstance, myPid: PID): void => {
    const gen: IterableIterator<ItemInstance> = cartOps.findChildByPID(myItem, myPid);
    printIterableResults(gen);
}
// const childByPID: PID = 0;
// console.log(`\n##### FIND CHILD BY PID TEST #####`);
// console.log(`##### PID === ${childByPID}              #####`);
// findChildByPIDTest(hamburger1, childByPID);



// Helper that prints results from an iterator.
function printIterableResults(gen: IterableIterator<ItemInstance>) {
    for (let res of gen) {
        console.log(res);
    }
}



const addItemTest = (myCart: Cart, myItem: ItemInstance): void => {
    const resCart: Cart = cartOps.addItem(myCart, myItem);
    console.log(resCart);
}
// console.log(`\n##### ADD ITEM TO CART TEST #####`);
// addItemTest(testCart, unaddedItem);



const replaceItemTest = (myCart: Cart, myItem: ItemInstance): void => {
    const resCart: Cart = cartOps.replaceItem(myCart, myItem);
    console.log(resCart);
}
// console.log(`\n##### REPLACE ITEM IN CART TEST #####`);
// replaceItemTest(testCart, duplicateUIDCoke);



const removeItemTest = (myCart: Cart, myItem: ItemInstance): void => {
    const resCart: Cart = cartOps.removeItem(myCart, myItem);
    console.log(resCart);
}
// console.log(`\n##### REMOVE ITEM IN CART TEST #####`);
// removeItemTest(testCart, hamburger1);



const addChildTest = (myParent: ItemInstance, myChild: ItemInstance): void => {
    const resItem: ItemInstance = cartOps.addChild(myParent, myChild);
    console.log(resItem);
}
// console.log(`\n##### ADD CHILD TEST #####`);
// addChildTest(hamburger1, tomato1);



const updateChildTest = (myParent: ItemInstance, myChild: ItemInstance): void => {
    const resItem: ItemInstance = cartOps.updateChild(myParent, myChild);
    console.log(resItem);
}
// console.log(`\n##### UPDATE CHILD TEST #####`);
// updateChildTest(hamburger1, duplicateUIDTomato);



const removeChildTest = (myParent: ItemInstance, myChild: ItemInstance): void => {
    const resItem: ItemInstance = cartOps.removeChild(myParent, myChild);
    console.log(resItem);
}
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