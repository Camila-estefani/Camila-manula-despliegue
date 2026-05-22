export interface Product {
  productId?: number;
  categoryId: number;
  name: string;
  variety?: string;
  caliber?: string;
  unitMeasure: string;
  boxWeightKg?: number;
  isOwnProduction: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
