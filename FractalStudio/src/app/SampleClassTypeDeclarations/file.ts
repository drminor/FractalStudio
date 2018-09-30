export interface Order {
  id?: number;
  petId?: number;
  quantity?: number;
  shipDate?: Date;
  /**
   * Order Status
   */
  status?: Order.StatusEnum;
  complete?: boolean;
}

export namespace Order {
  export type StatusEnum = 'placed' | 'approved' | 'delivered';
  export const StatusEnum = {
    Placed: 'placed' as StatusEnum,
    Approved: 'approved' as StatusEnum,
    Delivered: 'delivered' as StatusEnum
  };
}

