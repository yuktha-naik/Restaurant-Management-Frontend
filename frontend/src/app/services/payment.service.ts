import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Payment } from '../models/payment';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly baseUrl = `${environment.apiUrl}/payments`;
  private readonly singularBaseUrl = `${environment.apiUrl}/payment`;

  constructor(private http: HttpClient) {}

  getAllPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(this.baseUrl);
  }

  getPaymentById(id: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseUrl}/${id}`);
  }

  createPayment(payment: Payment): Observable<Payment> {
    return this.http.post<Payment>(this.baseUrl, payment);
  }

  updatePayment(id: number, payment: Payment): Observable<Payment> {
    return this.http.put<Payment>(`${this.baseUrl}/${id}`, payment).pipe(
      catchError((error) => {
        if (error?.status === 404) {
          return this.http.put<Payment>(`${this.singularBaseUrl}/${id}`, payment);
        }
        return throwError(() => error);
      }),
    );
  }

  deletePayment(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }
}