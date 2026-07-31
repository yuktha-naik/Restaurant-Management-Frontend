import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Manager } from '../models/manager';

@Injectable({ providedIn: 'root' })
export class ManagerService {
  private readonly baseUrl = `${environment.apiUrl}/managers`;

  constructor(private http: HttpClient) {}

  getAllManagers(): Observable<Manager[]> {
    return this.http.get<Manager[]>(this.baseUrl);
  }

  getManagerById(id: number): Observable<Manager> {
    return this.http.get<Manager>(`${this.baseUrl}/${id}`);
  }

  createManager(manager: Manager): Observable<Manager> {
    return this.http.post<Manager>(this.baseUrl, manager);
  }

  updateManager(id: number, manager: Manager): Observable<Manager> {
    return this.http.put<Manager>(`${this.baseUrl}/${id}`, manager);
  }

  deleteManager(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }
}
