import { PharmacyProduct, MedicineOrder, MedicineOrderItem, OrderStatus } from '../types';
import { AppDataStore } from './store';

export class PharmacyService {
  static getProducts(search?: string, category?: string): PharmacyProduct[] {
    let list = AppDataStore.getPharmacyProducts();
    if (category && category !== 'all') {
      list = list.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.genericName?.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    return list;
  }

  static getOrders(patientId?: string): MedicineOrder[] {
    let list = AppDataStore.getOrders();
    if (patientId) {
      list = list.filter((o) => o.patientId === patientId);
    }
    return list.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
  }

  static createOrder(data: {
    patientId: string;
    prescriptionId?: string;
    items: { productId: string; quantity: number }[];
    deliveryAddress: string;
    deliveryCity: string;
    contactPhone: string;
  }): { success: boolean; message: string; order?: MedicineOrder } {
    const products = AppDataStore.getPharmacyProducts();
    const orders = AppDataStore.getOrders();

    const orderId = 'ord_' + Date.now();
    let totalAmount = 0;

    const lineItems: MedicineOrderItem[] = [];

    for (const item of data.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) continue;
      const subtotal = prod.price * item.quantity;
      totalAmount += subtotal;
      lineItems.push({
        id: `ordi_${Date.now()}_${item.productId}`,
        orderId,
        productId: prod.id,
        productName: prod.name,
        quantity: item.quantity,
        unitPrice: prod.price,
        subtotal,
      });
    }

    if (lineItems.length === 0) {
      return { success: false, message: 'Please select at least one valid medication.' };
    }

    const newOrder: MedicineOrder = {
      id: orderId,
      orderNumber: `CB-MED-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: data.patientId,
      prescriptionId: data.prescriptionId,
      totalAmount: Math.round(totalAmount * 100) / 100,
      deliveryAddress: data.deliveryAddress,
      deliveryCity: data.deliveryCity,
      contactPhone: data.contactPhone,
      status: 'confirmed',
      trackingNumber: `CB-EXP-${Math.floor(100000 + Math.random() * 900000)}`,
      placedAt: new Date().toISOString(),
      items: lineItems,
    };

    AppDataStore.setOrders([newOrder, ...orders]);

    // Send notification
    const patients = AppDataStore.getPatients();
    const pObj = patients.find((p) => p.id === data.patientId);
    if (pObj) {
      const notifs = AppDataStore.getNotifications();
      AppDataStore.setNotifications([
        {
          id: 'not_' + Date.now(),
          recipientProfileId: pObj.profileId,
          title: 'Pharmacy Order Confirmed',
          message: `Order #${newOrder.orderNumber} for $${newOrder.totalAmount.toFixed(2)} is being prepared for dispatch.`,
          type: 'pharmacy',
          actionPath: '/patient/pharmacy',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        ...notifs,
      ]);
    }

    return {
      success: true,
      message: `Order #${newOrder.orderNumber} successfully placed! Tracking ID: ${newOrder.trackingNumber}`,
      order: newOrder,
    };
  }

  static updateOrderStatus(orderId: string, status: OrderStatus, trackingNumber?: string): boolean {
    const orders = AppDataStore.getOrders();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return false;

    const updated = [...orders];
    updated[idx] = {
      ...updated[idx],
      status,
      trackingNumber: trackingNumber || updated[idx].trackingNumber,
    };

    AppDataStore.setOrders(updated);
    return true;
  }
}
