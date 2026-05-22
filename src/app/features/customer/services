import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; 
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  
  private API_URL = 'http://localhost:9090/api/orders'; 

  private _listaPedidos = [
    { orderId: 0, orderCode: 'ORD-000', orderDate: '2026-04-26', status: 'Local', incoterm: '-' }
  ];

  constructor(private http: HttpClient) { }

  // Obtiene los datos locales (respaldo)
  getPedidos() {
    return this._listaPedidos;
  }

  // TRAE los datos desde SQL Server a través de Java
  getPedidosDesdeJava(): Observable<any[]> {
    return this.http.get<any[]>(this.API_URL).pipe(
      map(pedidos => {
        console.log('📦 Pedidos crudos del servidor:', pedidos);
        // Mapear los datos para asegurar que tengan las propiedades correctas
        return pedidos.map(p => ({
          orderId: p.orderId,
          orderCode: p.orderCode,
          orderDate: p.orderDate,
          status: p.status,
          incoterm: p.incoterm
        }));
      })
    );
  }

  // GUARDA el nuevo pedido en SQL Server a través de Java
  agregarPedidoServidor(nuevoPedido: any): Observable<any> {
    return this.http.post(this.API_URL, nuevoPedido);
  }

  // Método local (opcional)
  agregarPedido(nuevo: any) {
    this._listaPedidos.push(nuevo);
  }
}