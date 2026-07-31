import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RestaurantOrder } from '../models/restaurant-order';

@Injectable({ providedIn: 'root' })
export class RestaurantOrderService {
  private readonly baseUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  getAllOrders(): Observable<RestaurantOrder[]> {
    return this.http.get<RestaurantOrder[]>(this.baseUrl);
  }

  getOrderById(id: number): Observable<RestaurantOrder> {
    return this.http.get<RestaurantOrder>(`${this.baseUrl}/${id}`);
  }

  createOrder(order: RestaurantOrder): Observable<RestaurantOrder> {
    return this.http.post<RestaurantOrder>(this.baseUrl, order);
  }

  updateOrder(id: number, order: Partial<RestaurantOrder>): Observable<RestaurantOrder> {
    return this.http.put<RestaurantOrder>(`${this.baseUrl}/${id}`, order);
  }

  deleteOrder(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }
}
