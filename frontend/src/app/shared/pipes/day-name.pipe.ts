import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dayName', standalone: true })
export class DayNamePipe implements PipeTransform {
  private readonly days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  transform(value: number | string): string {
    const idx = Number(value);
    return this.days[idx] ?? String(value);
  }
}
