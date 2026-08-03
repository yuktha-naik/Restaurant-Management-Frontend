import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RestaurantTable } from '../models/restaurant-table';

@Injectable({ providedIn: 'root' })
export class RestaurantTableService {
  private readonly baseUrl = `${environment.apiUrl}/tables`;

  constructor(private http: HttpClient) {}

  getAllTables(): Observable<RestaurantTable[]> {
    return this.http.get<RestaurantTable[]>(this.baseUrl);
  }

  getTableById(id: number): Observable<RestaurantTable> {
    return this.http.get<RestaurantTable>(`${this.baseUrl}/${id}`);
  }

  createTable(table: RestaurantTable): Observable<RestaurantTable> {
    return this.http.post<RestaurantTable>(this.baseUrl, table);
  }

  updateTable(id: number, table: RestaurantTable): Observable<RestaurantTable> {
    return this.http.put<RestaurantTable>(`${this.baseUrl}/${id}`, table);
  }

  // Calls the backend's dedicated allocation-trigger endpoint — marks the
  // table AVAILABLE and immediately re-runs the best-fit allocation engine
  // for the oldest waiting reservation, if any (see ReservationServiceImpl).
  releaseTable(id: number): Observable<RestaurantTable> {
    return this.http.put<RestaurantTable>(`${this.baseUrl}/${id}/release`, {});
  }

  deleteTable(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }
}