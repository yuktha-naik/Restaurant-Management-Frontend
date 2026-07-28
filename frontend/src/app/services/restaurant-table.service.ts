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
}
