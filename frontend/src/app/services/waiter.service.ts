import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Waiter } from '../models/waiter';

@Injectable({ providedIn: 'root' })
export class WaiterService {
  private readonly baseUrl = `${environment.apiUrl}/waiters`;

  constructor(private http: HttpClient) {}

  getAllWaiters(): Observable<Waiter[]> {
    return this.http.get<Waiter[]>(this.baseUrl);
  }

  getWaiterById(id: number): Observable<Waiter> {
    return this.http.get<Waiter>(`${this.baseUrl}/${id}`);
  }

  createWaiter(waiter: Waiter): Observable<Waiter> {
    return this.http.post<Waiter>(this.baseUrl, waiter);
  }

  updateWaiter(id: number, waiter: Waiter): Observable<Waiter> {
    return this.http.put<Waiter>(`${this.baseUrl}/${id}`, waiter);
  }

  deleteWaiter(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }
}
