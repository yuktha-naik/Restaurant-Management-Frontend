import { Manager } from './manager';

export interface Waiter {
  waiterId?: number;
  name: string;
  phone: string;
  email: string;
  manager: Pick<Manager, 'managerId'>;
  password?: string;
}