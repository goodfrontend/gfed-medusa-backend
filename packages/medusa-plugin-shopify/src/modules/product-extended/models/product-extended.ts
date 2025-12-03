import { model } from '@medusajs/framework/utils';

const ProductExtended = model.define('product_extended', {
  id: model.id().primaryKey(),
  vendor: model.text(),
});

export default ProductExtended;
