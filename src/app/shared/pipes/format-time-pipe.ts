import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatTime',
  standalone: true
})
export class FormatTimePipe implements PipeTransform {

  transform(value: string | null | undefined): string {
    if (!value || typeof value !== 'string') {
      return '--:--'; // Devuelve esto si la hora es nula o no es un texto
    }
    // Devuelve solo los primeros 5 caracteres (HH:mm)
    return value.slice(0, 5);
  }

}
