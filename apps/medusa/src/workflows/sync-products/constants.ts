export const PRODUCT_ALGOLIA_FIELDS = [
  'id',
  'title',
  'description',
  'handle',
  'thumbnail',
  'status',
  'created_at',
  'updated_at',
  'collection_id',
  'collection.*',
  'categories.*',
  'tags.*',
  'images.*',
  'variants.*',
  'variants.inventory.id',
  'variants.inventory.location_levels.id',
  'variants.inventory.location_levels.stocked_quantity',
  'variants.inventory.location_levels.reserved_quantity',
];

export const PRODUCT_BROWSE_FIELDS = [
  ...PRODUCT_ALGOLIA_FIELDS,
  'variants.calculated_price.*',
];
