import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: any): string {
    if (!value) {
      return '';
    }

    // Try to parse the date string or timestamp
    const date = new Date(value);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return '';
    }

    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    // Less than a minute
    if (seconds < 60) {
      return 'à l\'instant';
    }
    
    // Less than an hour
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `il y a ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    }
    
    // Less than a day
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `il y a ${hours} ${hours === 1 ? 'heure' : 'heures'}`;
    }
    
    // Less than a week
    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `il y a ${days} ${days === 1 ? 'jour' : 'jours'}`;
    }
    
    // Less than a month
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `il y a ${weeks} ${weeks === 1 ? 'semaine' : 'semaines'}`;
    }
    
    // Less than a year
    const months = Math.floor(days / 30);
    if (months < 12) {
      return `il y a ${months} ${months === 1 ? 'mois' : 'mois'}`;
    }
    
    // More than a year
    const years = Math.floor(days / 365);
    return `il y a ${years} ${years === 1 ? 'an' : 'ans'}`;
  }
}
