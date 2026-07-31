import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Reservation } from '../models/reservation';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly baseUrl = `${environment.apiUrl}/reservations`;

  constructor(private http: HttpClient) {}

  createReservation(reservation: Reservation): Observable<Reservation> {
    return this.http.post<Reservation>(this.baseUrl, reservation);
  }

  getAllReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(this.baseUrl);
  }

  getReservationById(id: number): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.baseUrl}/${id}`);
  }

  updateReservation(id: number, reservation: Partial<Reservation>): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.baseUrl}/${id}`, reservation);
  }

  cancelReservation(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }
}
