import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class CorsInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const headers: Record<string, string> = {};

    if (!(req.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const corsRequest = req.clone({
      withCredentials: true,
      setHeaders: headers
    });
    return next.handle(corsRequest);
  }
}
