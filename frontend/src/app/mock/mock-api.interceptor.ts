import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import * as store from './mock-data';

// ─── In-memory copies so mutations persist during the session ─────────────────
let managers    = [...store.managers];
let waiters     = [...store.waiters];
let customers   = [...store.customers];
let tables      = [...store.tables];
let menuItems   = [...store.menuItems];
let reservations = [...store.reservations];
let orders      = [...store.orders];

let nextId = 100;

function ok(body: unknown = null) {
  return of(new HttpResponse({ status: 200, body }));
}

function created(body: unknown) {
  return of(new HttpResponse({ status: 201, body }));
}

function notFound(msg = 'Not found') {
  return throwError(() => new HttpResponse({ status: 404, body: msg }));
}

/** Parse the last path segment as a numeric id. Returns NaN if not numeric. */
function idFromUrl(url: string): number {
  const parts = url.split('?')[0].split('/').filter(Boolean);
  return Number(parts[parts.length - 1]);
}

/** Strip query string and return lowercase path only */
function path(url: string): string {
  return url.split('?')[0].toLowerCase();
}

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  const method = req.method;
  const url = path(req.urlWithParams);
  const id = idFromUrl(url);
  const body = req.body as Record<string, unknown>;

  // ── /managers ──────────────────────────────────────────────────────────────
  if (url.includes('/managers')) {
    if (!isNaN(id)) {
      const found = managers.find((m) => m.managerId === id);
      if (!found) return notFound('Manager not found');
      if (method === 'GET') return ok(found);
      if (method === 'PUT') {
        Object.assign(found, body);
        return ok(found);
      }
      if (method === 'DELETE') {
        managers = managers.filter((m) => m.managerId !== id);
        return ok('Manager deleted successfully.');
      }
    }
    if (method === 'GET') return ok(managers);
    if (method === 'POST') {
      const created_ = { ...body, managerId: nextId++ };
      managers.push(created_ as typeof managers[0]);
      return created(created_);
    }
  }

  // ── /waiters ───────────────────────────────────────────────────────────────
  if (url.includes('/waiters')) {
    if (!isNaN(id)) {
      const found = waiters.find((w) => w.waiterId === id);
      if (!found) return notFound('Waiter not found');
      if (method === 'GET') return ok(found);
      if (method === 'PUT') {
        Object.assign(found, body);
        return ok(found);
      }
      if (method === 'DELETE') {
        waiters = waiters.filter((w) => w.waiterId !== id);
        return ok('Waiter deleted successfully.');
      }
    }
    if (method === 'GET') return ok(waiters);
    if (method === 'POST') {
      const created_ = { ...body, waiterId: nextId++ };
      waiters.push(created_ as typeof waiters[0]);
      return created(created_);
    }
  }

  // ── /customers ────────────────────────────────────────────────────────────
  if (url.includes('/customers')) {
    if (!isNaN(id)) {
      const found = customers.find((c) => c.customerId === id);
      if (!found) return notFound('Customer not found');
      if (method === 'GET') return ok(found);
      if (method === 'PUT') {
        Object.assign(found, body);
        return ok(found);
      }
      if (method === 'DELETE') {
        customers = customers.filter((c) => c.customerId !== id);
        return ok('Customer deleted successfully.');
      }
    }
    if (method === 'GET') return ok(customers);
    if (method === 'POST') {
      const created_ = { ...body, customerId: nextId++ };
      customers.push(created_ as typeof customers[0]);
      return created(created_);
    }
  }

  // ── /tables ───────────────────────────────────────────────────────────────
  if (url.includes('/tables')) {
    if (!isNaN(id)) {
      const found = tables.find((t) => t.tableId === id);
      if (!found) return notFound('Table not found');
      if (method === 'GET') return ok(found);
      if (method === 'PUT') {
        Object.assign(found, body);
        return ok(found);
      }
      if (method === 'DELETE') {
        tables = tables.filter((t) => t.tableId !== id);
        return ok('Table deleted successfully.');
      }
    }
    if (method === 'GET') return ok(tables);
    if (method === 'POST') {
      const created_ = { ...body, tableId: nextId++, status: (body['status'] ?? 'AVAILABLE') };
      tables.push(created_ as typeof tables[0]);
      return created(created_);
    }
  }

  // ── /menu-items ───────────────────────────────────────────────────────────
  if (url.includes('/menu-items')) {
    if (!isNaN(id)) {
      const found = menuItems.find((i) => i.itemId === id);
      if (!found) return notFound('Menu item not found');
      if (method === 'GET') return ok(found);
      if (method === 'PUT') {
        Object.assign(found, body);
        return ok(found);
      }
      if (method === 'DELETE') {
        menuItems = menuItems.filter((i) => i.itemId !== id);
        return ok('Menu Item deleted successfully.');
      }
    }
    if (method === 'GET') return ok(menuItems);
    if (method === 'POST') {
      const created_ = { ...body, itemId: nextId++ };
      menuItems.push(created_ as typeof menuItems[0]);
      return created(created_);
    }
  }

  // ── /reservations ─────────────────────────────────────────────────────────
  if (url.includes('/reservations')) {
    if (!isNaN(id)) {
      const found = reservations.find((r) => r.reservationId === id);
      if (!found) return notFound('Reservation not found');
      if (method === 'GET') return ok(found);
      if (method === 'PUT') {
        Object.assign(found, body);
        return ok(found);
      }
      if (method === 'DELETE') {
        reservations = reservations.filter((r) => r.reservationId !== id);
        return ok('Reservation cancelled successfully.');
      }
    }
    if (method === 'GET') return ok(reservations);
    if (method === 'POST') {
      // resolve full customer and table objects for realistic response
      const customerRef = body['customer'] as { customerId?: number } | null;
      const tableRef = body['restaurantTable'] as { tableId?: number } | null;
      const fullCustomer = customers.find((c) => c.customerId === customerRef?.customerId) ?? customerRef;
      const fullTable = tables.find((t) => t.tableId === tableRef?.tableId) ?? tableRef;

      // mark table as RESERVED
      const tableToUpdate = tables.find((t) => t.tableId === tableRef?.tableId);
      if (tableToUpdate) tableToUpdate.status = 'RESERVED';

      const created_ = {
        ...body,
        reservationId: nextId++,
        status: 'CONFIRMED',
        customer: fullCustomer,
        restaurantTable: fullTable,
      };
      reservations.push(created_ as typeof reservations[0]);
      return created(created_);
    }
  }

  // ── /orders ───────────────────────────────────────────────────────────────
  if (url.includes('/orders')) {
    if (!isNaN(id)) {
      const found = orders.find((o) => o.orderId === id);
      if (!found) return notFound('Order not found');
      if (method === 'GET') return ok(found);
      if (method === 'PUT') {
        Object.assign(found, body);
        return ok(found);
      }
      if (method === 'DELETE') {
        orders = orders.filter((o) => o.orderId !== id);
        return ok('Order deleted successfully.');
      }
    }
    if (method === 'GET') return ok(orders);
    if (method === 'POST') {
      const created_ = {
        ...body,
        orderId: nextId++,
        orderTime: new Date().toISOString(),
        status: 'PENDING',
      };
      orders.push(created_ as typeof orders[0]);
      return created(created_);
    }
  }

  // ── Pass through anything else (e.g. assets) ──────────────────────────────
  return next(req);
};
