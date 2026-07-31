import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MenuItem } from '../models/menu-item';

@Injectable({ providedIn: 'root' })
export class MenuItemService {
  private readonly baseUrl = `${environment.apiUrl}/menu-items`;

  constructor(private http: HttpClient) {}

  getAllMenuItems(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(this.baseUrl);
  }

  getMenuItemById(id: number): Observable<MenuItem> {
    return this.http.get<MenuItem>(`${this.baseUrl}/${id}`);
  }

  createMenuItem(item: MenuItem): Observable<MenuItem> {
    return this.http.post<MenuItem>(this.baseUrl, item);
  }

  updateMenuItem(id: number, item: MenuItem): Observable<MenuItem> {
    return this.http.put<MenuItem>(`${this.baseUrl}/${id}`, item);
  }

  deleteMenuItem(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }
}
