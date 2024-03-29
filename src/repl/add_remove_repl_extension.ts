import {
  ICartOps,
  ICatalog,
  IdGenerator,
  ItemInstance,
  MENUITEM,
  SpecificTypedEntity,
  State,
  World,
} from '../core';

import {
  IRepl,
  IReplExtension,
  IReplExtensionFactory,
  ReplProcessor,
} from './interfaces';

//
// Sample ReplExtension that provides a Processor that can add and remove
// items with a specific phrasing.
//
class AddRemoveReplExtension implements IReplExtension {
  private readonly catalog: ICatalog;
  private readonly cartOps: ICartOps;
  private readonly idGenerator = new IdGenerator();

  constructor(world: World) {
    this.catalog = world.catalog;
    this.cartOps = world.cartOps;
  }

  name(): string {
    return 'simple';
  }

  createProcessor(): ReplProcessor | null {
    return {
      name: 'simple',
      description: 'Simple processor that supports add and remove.',
      processor: async (text: string, state: State): Promise<State> => {
        const add = text.match(/\s*add(\s+(one|two|three))?\s+(.+)/);

        if (add) {
          let quantity = 1;
          if (add[2]) {
            switch (add[2]) {
              case 'two':
                quantity = 2;
                break;
              case 'three':
                quantity = 3;
                break;
              default:
            }
          }
          const name = add[3];
          const specific = getSpecific(this.catalog, name);
          if (specific) {
            const item: ItemInstance = {
              uid: this.idGenerator.next(),
              quantity,
              key: specific.key,
              children: [],
            };

            if (specific.kind === MENUITEM) {
              // Adding a new product.
              const cart = this.cartOps.addToCart(state.cart, item);
              return { ...state, cart };
            } else if (state.cart.items.length > 0) {
              // Adding an option to an existing product.
              const parent = state.cart.items[state.cart.items.length - 1];
              const newParent = this.cartOps.addToItemWithReplacement(
                parent,
                item,
                true
              );
              const cart = this.cartOps.replaceInCart(state.cart, newParent);
              return { ...state, cart };
            }
          }
        }

        const remove = text.match(/\s*remove\s+(.+)/);
        if (remove) {
          const name = remove[1];
          const specific = getSpecific(this.catalog, name);
          if (specific) {
            for (const item of this.cartOps.findByKey(
              state.cart,
              specific.key
            )) {
              // Remove the first matching item.
              const cart = this.cartOps.removeFromCart(state.cart, item.uid);
              return { ...state, cart };
            }
          }
        }

        // Failed to add or remove. Just return state, unmodified.
        return state;
      },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  registerCommands(repl: IRepl): void {}
}

export const simpleReplExtensionFactory: IReplExtensionFactory = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  create: (world: World, dataPath: string) => {
    return new AddRemoveReplExtension(world);
  },
};

function getSpecific(
  catalog: ICatalog,
  name: string
): SpecificTypedEntity | undefined {
  for (const entity of catalog.specificEntities()) {
    if (name === entity.name) {
      return entity;
    }
  }

  return undefined;
}
