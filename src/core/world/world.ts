import {
  AttributeInfo,
  DimensionAndTensorDescription,
  ICartOps,
  ICatalog,
  ICookbook,
  IRuleChecker,
} from '..';

export interface World {
  attributeInfo: AttributeInfo;
  attributes: DimensionAndTensorDescription;
  cartOps: ICartOps;
  catalog: ICatalog;
  cookbook: ICookbook;
  ruleChecker: IRuleChecker;
}
