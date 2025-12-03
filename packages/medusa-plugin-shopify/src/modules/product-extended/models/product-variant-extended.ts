import { model } from '@medusajs/framework/utils';

const ProductVariantExtended = model.define('product_variant_extended', {
  id: model.id().primaryKey(),
  requires_shipping: model.boolean(),
});

export default ProductVariantExtended;
